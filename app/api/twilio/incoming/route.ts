import { type NextRequest, NextResponse } from "next/server"
import { getLeadByPhone, saveMessage, updateLead } from "@/lib/lead-actions"
import { generateAgentResponse, getAgentConfig } from "@/lib/wholesaling-agent"
import { sendSMS } from "@/lib/twilio"
import { triggerVoiceCall } from "@/lib/voice-call-actions"
import { notifyHotLead } from "@/lib/notify"

export async function POST(request: NextRequest) {
  try {
    // Parse the form data from Twilio
    const formData = await request.formData()
    const from = formData.get("From") as string
    const body = formData.get("Body") as string
    const messageSid = formData.get("MessageSid") as string

    console.log(`[Incoming SMS] From: ${from}, Message: ${body}`)

    if (!from || !body) {
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { "Content-Type": "text/xml" },
      })
    }

    // Find the lead by phone number
    const lead = await getLeadByPhone(from)

    if (!lead) {
      console.log(`No lead found for phone: ${from}`)
      // Return empty TwiML response - we don't respond to unknown numbers
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { "Content-Type": "text/xml" },
      })
    }

    // Don't respond if contract is already signed
    if (lead.conversation_state === "contract_signed" || lead.conversation_state === "closed") {
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { "Content-Type": "text/xml" },
      })
    }

    // Save the incoming message
    await saveMessage({
      lead_id: lead.id,
      direction: "inbound",
      content: body,
      twilio_sid: messageSid,
    })

    const lower = body.trim().toLowerCase()
    const isOptOut =
      lower === "stop" ||
      lower.includes("unsubscribe") ||
      lower.includes("cancel") ||
      lower === "end" ||
      lower === "quit" ||
      lower.includes("stop all") ||
      lower.includes("do not text")

    if (isOptOut) {
      await updateLead(lead.id, { is_opted_out: true, opted_out_at: new Date().toISOString(), optout_reason: "keyword" })
      await saveMessage({
        lead_id: lead.id,
        direction: "outbound",
        content: "You’ve been unsubscribed — no more messages.",
      })
      const { error: smsError } = await sendSMS(lead.phone_number, "You’ve been unsubscribed — no more messages.", {
        withFooter: false,
        bypassSuppression: true,
      })
      if (smsError) {
        console.error("Failed to send opt-out confirmation:", smsError)
      }
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { "Content-Type": "text/xml" },
      })
    }

    // Update state if this is first response from a cold lead
    if (lead.conversation_state === "cold_lead" || lead.conversation_state === "contacted") {
      await updateLead(lead.id, { conversation_state: "contacted" })
      lead.conversation_state = "contacted"
    }

    // Get agent config
    const config = await getAgentConfig()

    // Generate AI response
    const response = await generateAgentResponse(lead, body, config)

    console.log(`[AI Response] Model: ${response.modelUsed}, Escalated: ${response.escalated}`)

    // Update lead with extracted information
    if (Object.keys(response.updatedLead).length > 0) {
      await updateLead(lead.id, response.updatedLead)
    }

    // Update conversation state if changed
    if (response.newState) {
      await updateLead(lead.id, { conversation_state: response.newState })
    }

    if (response.callIntent?.action === "update_lead_status" && response.callIntent?.lead_status) {
      console.log(
        `[Call Intent Detected] Lead: ${lead.id}, Status: ${response.callIntent.lead_status}, Time: ${response.callIntent.call_time || "immediate"}`,
      )

      // Update lead status to call intent status
      await updateLead(lead.id, {
        conversation_state: response.callIntent.lead_status,
      })

      // If not text_only, trigger voice call
      if (response.callIntent.lead_status !== "text_only") {
        try {
          await triggerVoiceCall(lead.id, response.callIntent.lead_status, response.callIntent.call_time)
          console.log(`[Voice Call Triggered] for lead: ${lead.id}`)
        } catch (error) {
          console.error(`[Voice Call Error] Failed to trigger call for lead ${lead.id}:`, error)
        }
      }
    }

    const hotStates = new Set(["offer_made", "offer_accepted", "contract_sent", "ready_for_offer_call", "warm_call_requested", "schedule_call"])
    const becameHot =
      response.escalated ||
      (response.newState && hotStates.has(response.newState)) ||
      (response.callIntent?.lead_status && hotStates.has(response.callIntent.lead_status))
    if (becameHot) {
      await updateLead(lead.id, { pipeline_status: "HOT", score: 5 })
      await notifyHotLead({ id: lead.id, name: lead.name, phone_number: lead.phone_number, address: lead.address })
    }

    // Send the response via Twilio
    const { sid: outgoingSid, error } = await sendSMS(from, response.message)

    if (error) {
      console.error("Failed to send SMS:", error)
    }

    await saveMessage({
      lead_id: lead.id,
      direction: "outbound",
      content: response.message,
      twilio_sid: outgoingSid || undefined,
      model_used: response.modelUsed,
      was_escalated: response.escalated,
    })

    // Return empty TwiML since we're sending via API
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { "Content-Type": "text/xml" },
    })
  } catch (error) {
    console.error("Error processing incoming SMS:", error)
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { "Content-Type": "text/xml" },
    })
  }
}
