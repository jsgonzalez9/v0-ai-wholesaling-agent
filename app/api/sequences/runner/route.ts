import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendSMS, getTwilioClient, eligibleNumbersSorted } from "@/lib/twilio"

async function runOnce() {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const { data: enrollments } = await supabase
    .from("lead_sequences")
    .select("*")
    .eq("completed", false)
    .lte("next_run_at", now)
    .limit(100)
  for (const ls of enrollments || []) {
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
    let status = "pending"
    let meta: any = {}
    try {
      if (step.type === "sms") {
        const { data: lead } = await supabase.from("leads").select("*").eq("id", (ls as any).lead_id).single()
        if (!lead) throw new Error("Lead not found")
        const resp = await sendSMS((lead as any).phone_number, step.message || "")
        status = resp.error ? "error" : "sent"
        meta = { sid: resp.sid, error: resp.error || null }
      } else if (step.type === "voicemail") {
        const client = getTwilioClient()
        const { data: lead } = await supabase.from("leads").select("*").eq("id", (ls as any).lead_id).single()
        if (!client || !lead) throw new Error("Twilio or lead missing")
        const candidates = await eligibleNumbersSorted()
        const fromNumber = candidates[0]
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
