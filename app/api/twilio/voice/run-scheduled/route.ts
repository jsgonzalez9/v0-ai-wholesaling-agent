import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getRuntimeSettings } from "@/lib/settings"

export async function POST() {
  try {
    const supabase = await createClient()

    const { data: scheduledEvents, error } = await supabase
      .from("call_events")
      .select("id, call_id, event_data, created_at")
      .eq("event_type", "call_scheduled")
      .order("created_at", { ascending: true })
      .limit(200)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const now = new Date()
    const settings = await getRuntimeSettings()

    // Concurrency guard: count active calls
    const { data: activeCalls } = await supabase
      .from("calls")
      .select("id")
      .in("call_status", ["in_progress", "ringing"])

    const availableSlots = Math.max(0, (settings.concurrencyLimit || 0) - (activeCalls?.length || 0))
    let initiated = 0
    let skipped = 0

    let slotsLeft = availableSlots
    for (const evt of scheduledEvents || []) {
      if (slotsLeft <= 0) {
        skipped++
        continue
      }
      try {
        const scheduledTimeStr = (evt as any).event_data?.scheduled_time as string | undefined
        if (!scheduledTimeStr) {
          skipped++
          continue
        }
        const scheduledTime = new Date(scheduledTimeStr)
        if (isNaN(scheduledTime.getTime()) || scheduledTime > now) {
          skipped++
          continue
        }

        const { data: call } = await supabase.from("calls").select("id, lead_id, call_status").eq("id", evt.call_id).single()
        if (!call || call.call_status !== "pending") {
          skipped++
          continue
        }

        const resp = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/twilio/voice/outbound`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: call.lead_id }),
        })

        if (resp.ok) {
          initiated++
          slotsLeft--
          await supabase.from("call_events").insert({
            call_id: call.id,
            event_type: "call_initiated_by_scheduler",
            event_data: { scheduled_time: scheduledTimeStr, initiated_at: new Date().toISOString() },
          })
        } else {
          skipped++
        }
      } catch (err) {
        skipped++
      }
    }

    return NextResponse.json({ success: true, initiated, skipped })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
