import { type NextRequest, NextResponse } from "next/server"
import { saveMessage, updateLead } from "@/lib/lead-actions"
import { sendSMS } from "@/lib/twilio"
import { createClient } from "@/lib/supabase/server"

// Manual message sending endpoint (for testing or manual intervention)
export async function POST(request: NextRequest) {
  try {
    const { leadId, message } = await request.json()

    if (!leadId || !message) {
      return NextResponse.json({ error: "Lead ID and message required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: lead, error: leadError } = await supabase.from("leads").select("*").eq("id", leadId).single()

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Send SMS
    const { sid, error: smsError } = await sendSMS(lead.phone_number, message)

    if (smsError) {
      return NextResponse.json({ error: smsError }, { status: 500 })
    }

    // Save the outgoing message
    await saveMessage({
      lead_id: lead.id,
      direction: "outbound",
      content: message,
      twilio_sid: sid || undefined,
    })

    // Update last message time
    await updateLead(lead.id, {
      last_message_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      messageSid: sid,
    })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
