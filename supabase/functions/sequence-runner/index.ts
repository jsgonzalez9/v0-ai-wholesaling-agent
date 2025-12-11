// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

type Row = Record<string, any>

const env = {
  SUPABASE_URL: Deno.env.get("SUPABASE_URL") || "",
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  TWILIO_ACCOUNT_SID: Deno.env.get("TWILIO_ACCOUNT_SID") || "",
  TWILIO_AUTH_TOKEN: Deno.env.get("TWILIO_AUTH_TOKEN") || "",
  TWILIO_CALLER_ID: Deno.env.get("TWILIO_CALLER_ID") || "",
  TWILIO_MESSAGING_SERVICE_SID: Deno.env.get("TWILIO_MESSAGING_SERVICE_SID") || "",
  TWILIO_PHONE_NUMBER: Deno.env.get("TWILIO_PHONE_NUMBER") || "",
  NEXT_PUBLIC_APP_URL: Deno.env.get("NEXT_PUBLIC_APP_URL") || "http://localhost:3000",
}

function hasRequiredEnv(): boolean {
  return !!(
    env.SUPABASE_URL &&
    env.SUPABASE_SERVICE_ROLE_KEY &&
    env.TWILIO_ACCOUNT_SID &&
    env.TWILIO_AUTH_TOKEN &&
    (env.TWILIO_CALLER_ID || env.TWILIO_MESSAGING_SERVICE_SID || env.TWILIO_PHONE_NUMBER)
  )
}

async function logRun(supabase: any, data: { sequence_id?: string | null; step_id?: string | null; rule_action?: string | null; status: string; error?: string | null }) {
  try {
    await supabase.from("sequence_runs").insert({
      sequence_id: data.sequence_id ?? null,
      step_id: data.step_id ?? null,
      rule_action: data.rule_action ?? null,
      status: data.status,
      error: data.error ?? null,
      created_at: new Date().toISOString(),
    })
  } catch {
    // swallow
  }
}

async function sendSMS(to: string, body: string): Promise<{ sid: string | null; error: string | null }> {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) return { sid: null, error: "Twilio missing" }
  const footer = "\n\nReply STOP to unsubscribe"
  const fullBody = `${body}${footer}`
  const params: Record<string, string> = {
    To: to,
    Body: fullBody,
  }
  if (env.TWILIO_MESSAGING_SERVICE_SID) params["MessagingServiceSid"] = env.TWILIO_MESSAGING_SERVICE_SID
  else params["From"] = env.TWILIO_CALLER_ID || env.TWILIO_PHONE_NUMBER
  const form = new URLSearchParams(params)
  const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  })
  if (!resp.ok) {
    const t = await resp.text()
    return { sid: null, error: t }
  }
  const j = await resp.json()
  return { sid: j.sid || null, error: null }
}

async function evaluateRules(supabase: any, lead: Row, ls: Row, step: Row): Promise<{ allow: boolean; action?: string; jump_to_step_index?: number }> {
  const rules = step.rules || null
  if (!rules || typeof rules !== "object") return { allow: true }
  const action = rules.action as string | undefined
  const conditions = Array.isArray(rules.conditions) ? rules.conditions : []
  let triggered = conditions.length === 0

  for (const c of conditions) {
    if (!c) continue
    if (c.type === "inbound_reply_within") {
      const minutes = Number(c.minutes || 0)
      const since = new Date(Date.now() - minutes * 60_000).toISOString()
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("lead_id", ls.lead_id)
        .eq("direction", "inbound")
        .gte("created_at", since)
        .limit(1)
      triggered = triggered || !!(data && data.length > 0)
    } else if (c.type === "lead_opted_out") {
      triggered = triggered || !!lead?.is_opted_out
    } else if (c.type === "pipeline_status_in") {
      const list = Array.isArray(c.statuses) ? c.statuses : []
      triggered = triggered || list.includes(lead?.pipeline_status)
    } else if (c.type === "sentiment_high") {
      const { data: cs } = await supabase
        .from("call_summaries")
        .select("*")
        .eq("lead_id", ls.lead_id)
        .order("created_at", { ascending: false })
        .limit(1)
      triggered = triggered || ((cs?.[0] as any)?.sentiment === "positive")
    }
  }
  if (action && triggered) {
    return { allow: false, action, jump_to_step_index: Number(rules.jump_to_step_index ?? ls.current_step_index) }
  }
  return { allow: true }
}

serve(async () => {
  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
    if (!hasRequiredEnv()) {
      await logRun(supabase, { status: "not_configured", error: "Missing required env keys" })
      return new Response(JSON.stringify({ status: "ok", sent: 0, skipped: 0 }), { headers: { "Content-Type": "application/json" } })
    }
    const now = new Date().toISOString()
    const { data: enrollments } = await supabase
      .from("lead_sequences")
      .select("*")
      .eq("completed", false)
      .lte("next_run_at", now)
      .limit(100)
    let sent = 0
    let skipped = 0
    for (const ls of enrollments || []) {
      if ((ls as any).disabled) continue
      const { data: lead } = await supabase.from("leads").select("*").eq("id", (ls as any).lead_id).single()
      if (lead && ((lead as any).is_opted_out || (lead as any).pipeline_status === "DEAD")) {
        await supabase.from("lead_sequences").update({ completed: true, disabled: true }).eq("id", (ls as any).id)
        await logRun(supabase, { sequence_id: (ls as any).sequence_id, step_id: null, rule_action: "complete", status: "ok", error: null })
        skipped++
        continue
      }
      const { data: steps } = await supabase
        .from("sequence_steps")
        .select("*")
        .eq("sequence_id", (ls as any).sequence_id)
        .eq("step_index", (ls as any).current_step_index)
        .eq("active", true)
        .limit(1)
      const step = steps?.[0]
      if (!step) {
        await supabase.from("lead_sequences").update({ completed: true }).eq("id", (ls as any).id)
        await logRun(supabase, { sequence_id: (ls as any).sequence_id, step_id: null, rule_action: "complete", status: "ok", error: null })
        skipped++
        continue
      }
      const evalRes = await evaluateRules(supabase, lead as Row, ls as Row, step as Row)
      if (!evalRes.allow) {
        await supabase.from("lead_sequence_steps").insert({
          lead_sequence_id: (ls as any).id,
          step_index: (step as any).step_index,
          status: "rule_action",
          metadata: { action: evalRes.action, rules: (step as any).rules || null },
        })
        await logRun(supabase, { sequence_id: (ls as any).sequence_id, step_id: (step as any).id, rule_action: evalRes.action || null, status: "ok", error: null })
        if (evalRes.action === "skip") {
          const nextIndex = (ls as any).current_step_index + 1
          const { data: allSteps } = await supabase
            .from("sequence_steps")
            .select("*")
            .eq("sequence_id", (ls as any).sequence_id)
            .eq("active", true)
          const next = (allSteps || []).find((s: any) => s.step_index === nextIndex)
          const delay = (next?.delay_minutes as number) || 0
          const nextRun = new Date(Date.now() + delay * 60_000).toISOString()
          await supabase.from("lead_sequences").update({ current_step_index: nextIndex, next_run_at: nextRun }).eq("id", (ls as any).id)
        } else if (evalRes.action === "pause") {
          const pauseMin = 60
          const nextRun = new Date(Date.now() + pauseMin * 60_000).toISOString()
          await supabase.from("lead_sequences").update({ next_run_at: nextRun }).eq("id", (ls as any).id)
        } else if (evalRes.action === "jump") {
          await supabase.from("lead_sequences").update({ current_step_index: evalRes.jump_to_step_index, next_run_at: new Date().toISOString() }).eq("id", (ls as any).id)
        } else if (evalRes.action === "complete") {
          await supabase.from("lead_sequences").update({ completed: true }).eq("id", (ls as any).id)
        }
        skipped++
        continue
      }
      // send
      let status = "pending"
      let meta: any = {}
      try {
        if ((step as any).type === "sms") {
          const resp = await sendSMS((lead as any).phone_number, (step as any).message || "")
          status = resp.error ? "error" : "sent"
          meta = { sid: resp.sid, error: resp.error || null, message: (step as any).message || "" }
        } else if ((step as any).type === "voicemail") {
          // Optional: voicemail path via Twilio Calls; not required by this migration
          status = "queued"
          meta = {}
        }
      } catch (e: any) {
        status = "error"
        meta = { error: e?.message || "send failed" }
      }
      await supabase.from("lead_sequence_steps").insert({
        lead_sequence_id: (ls as any).id,
        step_index: (step as any).step_index,
        status,
        metadata: meta,
      })
      await logRun(supabase, { sequence_id: (ls as any).sequence_id, step_id: (step as any).id, rule_action: null, status, error: meta?.error || null })
      if (status === "error") {
        const retryBase = 5
        const currRetry = Number((ls as any).retry_count || 0)
        const maxRetry = (step as any).type === "sms" ? 2 : 1
        const nextRetry = currRetry + 1
        const nextDelayMinutes = retryBase * Math.pow(2, currRetry)
        const nextRunRetry = new Date(Date.now() + nextDelayMinutes * 60_000).toISOString()
        const newFailStreak = Number((ls as any).fail_streak || 0) + 1
        if (nextRetry <= maxRetry) {
          await supabase.from("lead_sequences").update({ retry_count: nextRetry, fail_streak: newFailStreak, next_run_at: nextRunRetry }).eq("id", (ls as any).id)
        } else {
          await supabase.from("lead_sequences").update({ retry_count: 0, fail_streak: newFailStreak }).eq("id", (ls as any).id)
        }
        skipped++
        continue
      }
      // advance
      const { data: allSteps } = await supabase
        .from("sequence_steps")
        .select("*")
        .eq("sequence_id", (ls as any).sequence_id)
        .eq("active", true)
      const maxIndex = Math.max(...(allSteps || []).map((s: any) => s.step_index), 0)
      const final = (ls as any).current_step_index >= maxIndex
      if (final) {
        await supabase.from("lead_sequences").update({ completed: true }).eq("id", (ls as any).id)
      } else {
        const nextIndex = (ls as any).current_step_index + 1
        const next = (allSteps || []).find((s: any) => s.step_index === nextIndex)
        const delay = (next?.delay_minutes as number) || 0
        const nextRun = new Date(Date.now() + delay * 60_000).toISOString()
        await supabase.from("lead_sequences").update({ current_step_index: nextIndex, next_run_at: nextRun }).eq("id", (ls as any).id)
      }
      sent++
    }
    return new Response(JSON.stringify({ status: "ok", sent, skipped }), { headers: { "Content-Type": "application/json" } })
  } catch (e: any) {
    // Edge function requirement: do not throw; exit gracefully
    return new Response(JSON.stringify({ status: "ok", sent: 0, skipped: 0 }), { headers: { "Content-Type": "application/json" } })
  }
})
