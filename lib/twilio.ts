import twilio from "twilio"
import { createClient } from "@/lib/supabase/server"

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
const twilioCallerId = process.env.TWILIO_CALLER_ID
const twilioNumberPool = (process.env.TWILIO_NUMBER_POOL || "")
  .split(",")
  .map((s) => s.trim())
  .filter((s) => s.length > 0)
const monthlyLimitPerNumber = Number(process.env.SMS_MONTHLY_LIMIT_PER_NUMBER || 10000)

function monthStartISO(): string {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

async function chooseFromNumber(): Promise<string | null> {
  const pool = twilioNumberPool.length > 0 ? twilioNumberPool : (twilioPhoneNumber ? [twilioPhoneNumber] : [])
  if (pool.length === 0) return null

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("call_events")
      .select("event_data, created_at")
      .eq("event_type", "sms_sent")
      .gte("created_at", monthStartISO())

    const counts: Record<string, number> = {}
    for (const row of data || []) {
      const from = (row as any).event_data?.from
      if (typeof from === "string") counts[from] = (counts[from] || 0) + 1
    }

    const eligible = pool.filter((num) => (counts[num] || 0) < monthlyLimitPerNumber)
    if (eligible.length === 0) return null

    let selected = eligible[0]
    let min = counts[selected] || 0
    for (const num of eligible) {
      const c = counts[num] || 0
      if (c < min) {
        min = c
        selected = num
      }
    }
    return selected
  } catch {
    return pool[0]
  }
}

export async function eligibleNumbersSorted(): Promise<string[]> {
  const pool = twilioNumberPool.length > 0 ? twilioNumberPool : (twilioPhoneNumber ? [twilioPhoneNumber] : [])
  if (pool.length === 0) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("call_events")
      .select("event_data, created_at")
      .eq("event_type", "sms_sent")
      .gte("created_at", monthStartISO())
    const counts: Record<string, number> = {}
    for (const row of data || []) {
      const from = (row as any).event_data?.from
      if (typeof from === "string") counts[from] = (counts[from] || 0) + 1
    }
    const eligible = pool.filter((num) => (counts[num] || 0) < monthlyLimitPerNumber)
    return eligible.sort((a, b) => (counts[a] || 0) - (counts[b] || 0))
  } catch {
    return pool
  }
}

// Create Twilio client (only if credentials are available)
export function getTwilioClient() {
  if (!accountSid || !authToken) {
    console.warn("Twilio credentials not configured")
    return null
  }
  return twilio(accountSid, authToken)
}

export function chooseCallerId(): string | null {
  if (twilioCallerId && twilioCallerId.length > 0) return twilioCallerId
  const pool = twilioNumberPool.length > 0 ? twilioNumberPool : (twilioPhoneNumber ? [twilioPhoneNumber] : [])
  return pool.length > 0 ? pool[0] : null
}

export async function sendSMS(
  to: string,
  body: string,
  opts?: { withFooter?: boolean; bypassSuppression?: boolean },
): Promise<{ sid: string | null; error: string | null }> {
  const client = getTwilioClient()

  if (!client) {
    const footer = (opts?.withFooter ?? true) ? "\n\nReply STOP to unsubscribe" : ""
    const fullBody = `${body}${footer}`
    console.log(`[MOCK SMS] To: ${to}\nMessage: ${fullBody}`)
    return { sid: `mock_${Date.now()}`, error: null }
  }

  // Quiet hours block
  const quietStart = Number(process.env.SMS_QUIET_HOURS_START || 8)
  const quietEnd = Number(process.env.SMS_QUIET_HOURS_END || 21)
  const nowHour = new Date().getHours()
  if (nowHour < quietStart || nowHour >= quietEnd) {
    return { sid: null, error: "Quiet hours active; message not sent" }
  }

  // Suppression check by phone opt-out
  if (!opts?.bypassSuppression) {
    try {
      const supabase = await createClient()
      let normalized = to.replace(/\D/g, "")
      if (normalized.length === 10) normalized = `+1${normalized}`
      else if (normalized.length === 11 && normalized.startsWith("1")) normalized = `+${normalized}`
      else if (!normalized.startsWith("+")) normalized = `+${normalized}`
      const { data: lead } = await supabase.from("leads").select("*").eq("phone_number", normalized).single()
      if (lead && (lead as any).is_opted_out) {
        return { sid: null, error: "Recipient has opted out" }
      }
    } catch {}
  }

  const candidates = await eligibleNumbersSorted()
  if (candidates.length === 0) {
    return { sid: null, error: "No available Twilio sender number (check pool or config)" }
  }

  try {
    // Simple per-minute rate limit using recent sms_events
    try {
      const supabase = await createClient()
      const since = new Date(Date.now() - 60_000).toISOString()
      const { count } = await supabase
        .from("sms_events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since)
      const limit = Number(process.env.SMS_RATE_LIMIT_PER_MIN || 25)
      if ((count || 0) >= limit) {
        return { sid: null, error: "Rate limit exceeded, try later" }
      }
    } catch {}
    const footerParts: string[] = []
    try {
      const supabase = await createClient()
      const { data: cfg } = await supabase.from("agent_config").select("*").limit(1).single()
      const company = (cfg as any)?.company_name || "Your Company"
      footerParts.push(`${company}: real estate lead generation`)
    } catch {
      footerParts.push("Real estate lead generation")
    }
    footerParts.push("Msg & data rates may apply")
    footerParts.push("Reply HELP for help")
    footerParts.push("Reply STOP to unsubscribe")
    const footerText = footerParts.join(" • ")
    const footer = (opts?.withFooter ?? true) ? `\n\n${footerText}` : ""
    const fullBody = `${body}${footer}`
    const statusCallback = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/twilio/status`

    let lastError: string | null = null
    for (const fromNumber of candidates) {
      try {
        const message = await client.messages.create({
          body: fullBody,
          from: fromNumber,
          to,
          statusCallback,
        })
        try {
          const supabase = await createClient()
          await supabase.from("sms_events").insert({
            sid: message.sid,
            to_number: to,
            from_number: fromNumber,
            status: "sent",
            error: null,
            body,
          })
        } catch {}
        return { sid: message.sid, error: null }
      } catch (e: any) {
        lastError = e?.message ? String(e.message) : "Failed to send SMS"
        continue
      }
    }
    try {
      const supabase = await createClient()
      await supabase.from("sms_events").insert({
        sid: null,
        to_number: to,
        from_number: candidates[0],
        status: "failed",
        error: lastError || "Failed to send SMS",
        body,
      })
    } catch {}
    return { sid: null, error: lastError || "Failed to send SMS" }
  } catch (error) {
    console.error("Error sending SMS:", error)
    return { sid: null, error: error instanceof Error ? error.message : "Failed to send SMS" }
  }
}

export function validateTwilioRequest(signature: string, url: string, params: Record<string, string>): boolean {
  if (!authToken) {
    // Skip validation in development without credentials
    return true
  }

  return twilio.validateRequest(authToken, signature, url, params)
}
