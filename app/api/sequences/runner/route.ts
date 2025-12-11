import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendSMS, getTwilioClient, eligibleNumbersSorted, chooseCallerId } from "@/lib/twilio"

export async function runOnce() {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const smsConfigured =
    !!process.env.TWILIO_ACCOUNT_SID &&
    !!process.env.TWILIO_AUTH_TOKEN &&
    (!!process.env.TWILIO_MESSAGING_SERVICE_SID || !!process.env.TWILIO_PHONE_NUMBER || !!process.env.TWILIO_NUMBER_POOL)
  const voiceConfigured =
    !!process.env.TWILIO_ACCOUNT_SID &&
    !!process.env.TWILIO_AUTH_TOKEN &&
    (!!process.env.TWILIO_CALLER_ID || !!process.env.TWILIO_PHONE_NUMBER || !!process.env.TWILIO_NUMBER_POOL)
  const { data: enrollments } = await supabase
    .from("lead_sequences")
    .select("*")
    .eq("completed", false)
    .lte("next_run_at", now)
    .limit(100)
  for (const ls of enrollments || []) {
    if ((ls as any).disabled) continue
    const { data: lead } = await supabase.from("leads").select("*").eq("id", (ls as any).lead_id).single()
    if (lead && ((lead as any).is_opted_out || (lead as any).pipeline_status === "DEAD")) {
      await supabase.from("lead_sequences").update({ completed: true, disabled: true }).eq("id", (ls as any).id)
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
      continue
    }
    try {
      const rules = (step as any).rules || null
      if (rules && typeof rules === "object") {
        const action = (rules as any).action as string | undefined
        const conditions = Array.isArray((rules as any).conditions) ? (rules as any).conditions : []
        let shouldTrigger = conditions.length === 0
        for (const c of conditions) {
          if (c?.type === "inbound_reply_within") {
            const minutes = Number(c.minutes || 0)
            const since = new Date(Date.now() - minutes * 60_000).toISOString()
            const { data: inbound } = await supabase
              .from("messages")
              .select("*")
              .eq("lead_id", (ls as any).lead_id)
              .eq("direction", "inbound")
              .gte("created_at", since)
              .limit(1)
            shouldTrigger = shouldTrigger || !!(inbound && inbound.length > 0)
          } else if (c?.type === "lead_opted_out") {
            shouldTrigger = shouldTrigger || !!(lead as any)?.is_opted_out
          } else if (c?.type === "pipeline_status_in") {
            const list = Array.isArray(c.statuses) ? c.statuses : []
            shouldTrigger = shouldTrigger || list.includes((lead as any)?.pipeline_status)
          } else if (c?.type === "sentiment_high") {
            const { data: cs } = await supabase
              .from("call_summaries")
              .select("*")
              .eq("lead_id", (ls as any).lead_id)
              .order("created_at", { ascending: false })
              .limit(1)
            shouldTrigger = shouldTrigger || ((cs?.[0] as any)?.sentiment === "positive")
          }
        }
        if (action && shouldTrigger) {
          await supabase.from("lead_sequence_steps").insert({
            lead_sequence_id: (ls as any).id,
            step_index: (step as any).step_index,
            status: "rule_action",
            metadata: { action, rules },
          })
          if (action === "skip") {
            const nextIndexSkip = (ls as any).current_step_index + 1
            const { data: allStepsRule } = await supabase
              .from("sequence_steps")
              .select("*")
              .eq("sequence_id", (ls as any).sequence_id)
              .eq("active", true)
            const nextRule = (allStepsRule || []).find((s: any) => s.step_index === nextIndexSkip)
            const delayRule = (nextRule?.delay_minutes as number) || 0
            const nextRunRule = new Date(Date.now() + delayRule * 60_000).toISOString()
            await supabase.from("lead_sequences").update({ current_step_index: nextIndexSkip, next_run_at: nextRunRule }).eq("id", (ls as any).id)
            continue
          } else if (action === "pause") {
            const pauseMin = Number((rules as any).pause_minutes || 60)
            const nextRunPause = new Date(Date.now() + pauseMin * 60_000).toISOString()
            await supabase.from("lead_sequences").update({ next_run_at: nextRunPause }).eq("id", (ls as any).id)
            continue
          } else if (action === "jump") {
            const jumpTo = Number((rules as any).jump_to_step_index ?? (ls as any).current_step_index)
            await supabase.from("lead_sequences").update({ current_step_index: jumpTo, next_run_at: new Date().toISOString() }).eq("id", (ls as any).id)
            continue
          } else if (action === "complete") {
            await supabase.from("lead_sequences").update({ completed: true }).eq("id", (ls as any).id)
            continue
          }
        }
      }
    } catch {}
    let recentInbound = false
    try {
      const since = new Date(Date.now() - Number(process.env.SEQUENCE_REPLY_PAUSE_MINUTES || 720) * 60_000).toISOString()
      const { data: inbound } = await supabase
        .from("messages")
        .select("*")
        .eq("lead_id", (ls as any).lead_id)
        .eq("direction", "inbound")
        .gte("created_at", since)
        .limit(1)
      recentInbound = !!(inbound && inbound.length > 0)
    } catch {}
    if (recentInbound && step.type === "sms") {
      await supabase.from("lead_sequence_steps").insert({
        lead_sequence_id: (ls as any).id,
        step_index: step.step_index,
        status: "skipped",
        metadata: { reason: "recent_inbound" },
      })
      const { data: allStepsSkip } = await supabase
        .from("sequence_steps")
        .select("*")
        .eq("sequence_id", (ls as any).sequence_id)
        .eq("active", true)
      const nextIndexSkip = (ls as any).current_step_index + 1
      const nextSkip = (allStepsSkip || []).find((s: any) => s.step_index === nextIndexSkip)
      const delaySkip = (nextSkip?.delay_minutes as number) || 0
      const nextRunSkip = new Date(Date.now() + delaySkip * 60_000).toISOString()
      await supabase
        .from("lead_sequences")
        .update({ current_step_index: nextIndexSkip, next_run_at: nextRunSkip, retry_count: 0 })
        .eq("id", (ls as any).id)
      continue
    }
    let status = "pending"
    let meta: any = {}
    try {
      if (step.type === "sms") {
        if (!smsConfigured) {
          status = "not_configured"
          meta = { error: "SMS not configured" }
        } else {
          const resp = await sendSMS((lead as any).phone_number, step.message || "")
          status = resp.error ? "error" : "sent"
          meta = { sid: resp.sid, error: resp.error || null, message: step.message || "" }
        }
      } else if (step.type === "voicemail") {
        if (!voiceConfigured) {
          status = "not_configured"
          meta = { error: "Voicemail not configured" }
        } else {
          const client = getTwilioClient()
          if (!client) throw new Error("Twilio missing")
          const candidates = await eligibleNumbersSorted()
          const preferred = chooseCallerId()
          const fromNumber = preferred || candidates[0]
          if (!fromNumber) throw new Error("No caller ID configured")
          const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/twilio/sequences/voicemail?recording_url=${encodeURIComponent(step.recording_url || "")}`
          const call = await client.calls.create({
            to: (lead as any).phone_number,
            from: fromNumber,
            url: callbackUrl,
            machineDetection: "Enable",
          })
          status = "queued"
          meta = { call_sid: call.sid }
        }
      }
    } catch (e: any) {
      status = "error"
      meta = { error: e?.message || "send failed" }
    }
    await supabase.from("lead_sequence_steps").insert({
      lead_sequence_id: (ls as any).id,
      step_index: step.step_index,
      status,
      metadata: meta,
    })
    if (status === "not_configured") {
      const nextRunNC = new Date(Date.now() + 60 * 60_000).toISOString()
      await supabase.from("lead_sequences").update({ next_run_at: nextRunNC }).eq("id", (ls as any).id)
      continue
    }
    if (status === "error") {
      const retryBase = Number(process.env.SEQUENCE_RETRY_BASE_MINUTES || 5)
      const currRetry = Number((ls as any).retry_count || 0)
      const maxRetry = step.type === "sms" ? 2 : 1
      const nextRetry = currRetry + 1
      const nextDelayMinutes = retryBase * Math.pow(2, currRetry)
      const nextRunRetry = new Date(Date.now() + nextDelayMinutes * 60_000).toISOString()
      const newFailStreak = Number((ls as any).fail_streak || 0) + 1
      if (nextRetry <= maxRetry) {
        await supabase
          .from("lead_sequences")
          .update({ retry_count: nextRetry, fail_streak: newFailStreak, next_run_at: nextRunRetry })
          .eq("id", (ls as any).id)
        continue
      } else {
        if (newFailStreak >= 5) {
          await supabase.from("lead_sequences").update({ completed: true, disabled: true }).eq("id", (ls as any).id)
          continue
        }
        await supabase
          .from("lead_sequences")
          .update({ retry_count: 0, fail_streak: newFailStreak })
          .eq("id", (ls as any).id)
      }
    } else {
      await supabase.from("lead_sequences").update({ retry_count: 0, fail_streak: 0 }).eq("id", (ls as any).id)
    }
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
  }
}

export async function GET() {
  try {
    await runOnce()
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Runner failed" }, { status: 500 })
  }
}

export const runtime = "nodejs"
export const schedule = "*/1 * * * *"
export default async function handler() {
  await runOnce()
  return NextResponse.json({ success: true })
}
