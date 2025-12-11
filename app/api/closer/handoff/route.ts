import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendSMS } from "@/lib/twilio"
import { saveMessage, updateLead } from "@/lib/lead-actions"
import { notifyHotLead } from "@/lib/notify"

export async function POST(request: Request) {
  try {
    const { leadId, call_time } = await request.json()
    if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 })
    const supabase = await createClient()
    const { data: lead, error } = await supabase.from("leads").select("*").eq("id", leadId).single()
    if (error || !lead) return NextResponse.json({ error: "lead not found" }, { status: 404 })

    const msg =
      call_time && String(call_time).trim().length > 0
        ? `Great — I’ll have our closing specialist give you a quick call around ${call_time}. They'll walk you through the offer and next steps.`
        : `Great — I’ll have our closing specialist give you a quick call to walk through the offer and next steps. What time works best?`

    const { sid, error: smsError } = await sendSMS(lead.phone_number, msg)
    await saveMessage({ lead_id: lead.id, direction: "outbound", content: msg, twilio_sid: sid || undefined, was_escalated: true })
    await updateLead(lead.id, {
      pipeline_status: "HOT",
      conversation_state: "ready_for_offer_call",
      tags: Array.from(new Set([...(lead.tags || []), "handoff"])),
    })
    await notifyHotLead({ id: lead.id, name: lead.name, phone_number: lead.phone_number, address: lead.address })
    if (smsError) {
      return NextResponse.json({ success: false, error: String(smsError) }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to handoff" }, { status: 500 })
  }
}
