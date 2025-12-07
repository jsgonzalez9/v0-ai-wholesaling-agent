import { type NextRequest, NextResponse } from "next/server"
import { updateLead, saveMessage } from "@/lib/lead-actions"
import { generateInitialOutreach, getAgentConfig } from "@/lib/wholesaling-agent"
import { sendSMS } from "@/lib/twilio"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { leadId } = await request.json()

    if (!leadId) {
      return NextResponse.json({ error: "Lead ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: lead, error: leadError } = await supabase.from("leads").select("*").eq("id", leadId).single()

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Don't send outreach if already contacted
    if (lead.conversation_state !== "cold_lead") {
      return NextResponse.json(
        {
          error: "Lead has already been contacted",
          state: lead.conversation_state,
        },
        { status: 400 },
      )
    }

    const config = await getAgentConfig()
    const message = await generateInitialOutreach(lead, config)

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

    // Update lead state
    await updateLead(lead.id, {
      conversation_state: "contacted",
      last_message_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message,
      messageSid: sid,
    })
  } catch (error) {
    console.error("Error sending outreach:", error)
    return NextResponse.json({ error: "Failed to send outreach" }, { status: 500 })
  }
}
