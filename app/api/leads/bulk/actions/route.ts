import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendSMS } from "@/lib/twilio"
import { saveMessage, updateLead } from "@/lib/lead-actions"

export async function POST(request: Request) {
  try {
    const { action, leadIds, payload } = await request.json()
    if (!Array.isArray(leadIds) || leadIds.length === 0) return NextResponse.json({ error: "leadIds required" }, { status: 400 })
    const supabase = await createClient()
    const { data: leads } = await supabase.from("leads").select("*").in("id", leadIds)
    if (!leads) return NextResponse.json({ error: "Leads not found" }, { status: 404 })
    let count = 0
    if (action === "tag_update") {
      const tags = Array.isArray(payload?.tags) ? payload.tags : []
      for (const l of leads) {
        await updateLead(l.id, { tags: Array.from(new Set([...(l.tags || []), ...tags])) })
        count++
      }
    } else if (action === "assign_closer") {
      for (const l of leads) {
        await updateLead(l.id, { pipeline_status: "HOT", tags: Array.from(new Set([...(l.tags || []), "handoff"])) })
        count++
      }
    } else if (action === "schedule_followup") {
      for (const l of leads) {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/followup/schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: l.id, reason: payload?.reason || null, next_action: payload?.next_action || null }),
        })
        count++
      }
    } else if (action === "bulk_sms") {
      const msg = String(payload?.message || "").trim()
      if (!msg) return NextResponse.json({ error: "message required" }, { status: 400 })
      for (const l of leads) {
        const { sid, error } = await sendSMS(l.phone_number, msg)
        await saveMessage({ lead_id: l.id, direction: "outbound", content: msg, twilio_sid: sid || undefined })
        if (!error) count++
      }
    } else {
      return NextResponse.json({ error: "unknown action" }, { status: 400 })
    }
    return NextResponse.json({ success: true, count })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Bulk action failed" }, { status: 500 })
  }
}
