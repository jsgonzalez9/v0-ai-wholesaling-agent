import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { getLeadById } from "@/lib/lead-actions"
import { updateCall, addCallEvent } from "@/lib/voice-call-actions"
import { validateTwilioRequest } from "@/lib/twilio"

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const signature = request.headers.get("x-twilio-signature") || ""
    const params: Record<string, string> = {}
    for (const [key, value] of formData.entries()) {
      params[key] = String(value)
    }

    const valid = validateTwilioRequest(signature, request.url, params)
    if (!valid) {
      const twiml = new VoiceResponse()
      twiml.hangup()
      return new NextResponse(twiml.toString(), {
        status: 403,
        headers: { "Content-Type": "text/xml" },
      })
    }
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
      twiml.say(`Please call us back at ${process.env.TWILIO_PHONE_NUMBER}`)
    } else {
      const mediaUrl = `${process.env.NEXT_PUBLIC_MEDIA_WS_URL}?call_id=${callId}&lead_id=${leadId}`
      twiml.connect().stream({ url: mediaUrl })
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
