import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { getLeadByPhone } from "@/lib/lead-actions"
import { createCall, updateCall } from "@/lib/voice-call-actions"

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const from = formData.get("From") as string
    const callStatus = formData.get("CallStatus") as string

    console.log(`[Incoming Voice Call] From: ${from}, CallSid: ${callSid}, Status: ${callStatus}`)

    // Find lead by phone number
    const lead = await getLeadByPhone(from)

    if (!lead) {
      console.log(`[Voice] No lead found for phone: ${from}`)
      const twiml = new VoiceResponse()
      twiml.say("Sorry, we couldn't find your information. Goodbye.")
      twiml.hangup()

      return new NextResponse(twiml.toString(), {
        headers: { "Content-Type": "text/xml" },
      })
    }

    // Create call record
    const call = await createCall(lead.id, "inbound")

    if (call) {
      await updateCall(call.id, {
        twilio_call_sid: callSid,
        call_status: "ringing",
      })
    }

    // Build TwiML response
    const twiml = new VoiceResponse()

    // Gather speech input for AI processing
    const gather = twiml.gather({
      timeout: 3,
      numDigits: 1,
      action: `/api/twilio/voice/handle-input?call_id=${call?.id}&lead_id=${lead.id}`,
      method: "POST",
      speechTimeout: "auto",
      language: "en-US",
    })

    gather.say(`Hi ${lead.name}, thank you for calling. Please hold while we connect you.`)

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })
  } catch (error) {
    console.error("[Voice Incoming] Error:", error)

    const twiml = new VoiceResponse()
    twiml.say("An error occurred. Please try again later.")
    twiml.hangup()

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })
  }
}
