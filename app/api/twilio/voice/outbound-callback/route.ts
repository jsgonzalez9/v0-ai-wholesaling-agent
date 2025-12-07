import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { getLeadById } from "@/lib/lead-actions"
import { updateCall, addCallEvent } from "@/lib/voice-call-actions"

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callId = request.nextUrl.searchParams.get("call_id") as string
    const leadId = request.nextUrl.searchParams.get("lead_id") as string
    const callStatus = formData.get("CallStatus") as string

    console.log(`[Voice Callback] CallId: ${callId}, Status: ${callStatus}`)

    if (!callId || !leadId) {
      const twiml = new VoiceResponse()
      twiml.hangup()
      return new NextResponse(twiml.toString(), {
        headers: { "Content-Type": "text/xml" },
      })
    }

    const lead = await getLeadById(leadId)

    if (!lead) {
      const twiml = new VoiceResponse()
      twiml.hangup()
      return new NextResponse(twiml.toString(), {
        headers: { "Content-Type": "text/xml" },
      })
    }

    // Update call status
    await updateCall(callId, { call_status: callStatus })
    await addCallEvent(callId, `call_${callStatus}`, {})

    const twiml = new VoiceResponse()

    if (callStatus === "no-answer" || callStatus === "failed") {
      // Leave voicemail option
      twiml.say(
        `Hi ${lead.name}, this is a callback from Property Direct Cash. We'd love to discuss your property. Please call us back at ${process.env.TWILIO_PHONE_NUMBER}`,
      )
    } else {
      // Greeting for answered call
      twiml.say(
        `Hi ${lead.name}, thanks for picking up! I'm calling from Property Direct Cash to discuss your property at ${lead.address}.`,
      )

      // Gather speech
      const gather = twiml.gather({
        timeout: 3,
        action: `/api/twilio/voice/handle-input?call_id=${callId}&lead_id=${leadId}`,
        method: "POST",
        speechTimeout: "auto",
        language: "en-US",
      })

      gather.say("Are you open to selling your property?")
    }

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })
  } catch (error) {
    console.error("[Voice Callback] Error:", error)

    const twiml = new VoiceResponse()
    twiml.hangup()

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })
  }
}
