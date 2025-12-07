import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { getLeadById } from "@/lib/lead-actions"
import { updateCall, addCallEvent } from "@/lib/voice-call-actions"
import { generateVoiceResponse } from "@/lib/voice-agent"

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callId = request.nextUrl.searchParams.get("call_id") as string
    const leadId = request.nextUrl.searchParams.get("lead_id") as string
    const speechResult = formData.get("SpeechResult") as string

    console.log(`[Voice Input] CallId: ${callId}, Speech: ${speechResult}`)

    const lead = await getLeadById(leadId)

    if (!lead || !callId) {
      const twiml = new VoiceResponse()
      twiml.say("Sorry, I couldn't process that. Goodbye.")
      twiml.hangup()
      return new NextResponse(twiml.toString(), {
        headers: { "Content-Type": "text/xml" },
      })
    }

    // Generate AI response
    const response = await generateVoiceResponse(lead, speechResult, {
      leadId,
      phone: lead.phone_number,
      companyName: "Property Direct Cash",
      agentName: "Alex",
      mode: "inbound",
    })

    // Update call with transcript segment
    const currentTranscript = `Lead: ${speechResult}\nAgent: ${response.message}`
    await updateCall(callId, {
      transcript: currentTranscript,
      call_status: response.shouldEndCall ? "completed" : "in_progress",
    })

    // Add event
    await addCallEvent(callId, "transcript_update", { speech: speechResult, response: response.message })

    // Build response TwiML
    const twiml = new VoiceResponse()

    if (response.shouldEndCall) {
      twiml.say(response.message)
      twiml.hangup()
    } else {
      const gather = twiml.gather({
        timeout: 3,
        action: `/api/twilio/voice/handle-input?call_id=${callId}&lead_id=${leadId}`,
        method: "POST",
        speechTimeout: "auto",
        language: "en-US",
      })

      gather.say(response.message)
    }

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })
  } catch (error) {
    console.error("[Voice Handle Input] Error:", error)

    const twiml = new VoiceResponse()
    twiml.say("An error occurred during the call.")
    twiml.hangup()

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })
  }
}
