import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { getLeadById, updateLead } from "@/lib/lead-actions"
import { updateCall, addCallEvent, getCallById } from "@/lib/voice-call-actions"
import { getRuntimeSettings } from "@/lib/settings"
import { generateVoiceResponse, extractCallInsights } from "@/lib/voice-agent"
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
    const speechResult = formData.get("SpeechResult") as string

    console.log(`[Voice Input] CallId: ${callId}, Speech: ${speechResult}`)

    const lead = await getLeadById(leadId)
    const callRecord = await getCallById(callId)

    if (!lead || !callId) {
      const twiml = new VoiceResponse()
      twiml.say("Sorry, I couldn't process that. Goodbye.")
      twiml.hangup()
      return new NextResponse(twiml.toString(), {
        headers: { "Content-Type": "text/xml" },
      })
    }

    // Enforce max call duration if configured
    const settings = await getRuntimeSettings()
    const maxMinutes = Number(settings.maxCallMinutes || 0)
    if (callRecord && maxMinutes > 0) {
      const started = new Date(callRecord.created_at)
      const now = new Date()
      const elapsedSec = Math.floor((now.getTime() - started.getTime()) / 1000)
      if (elapsedSec >= maxMinutes * 60) {
        const twiml = new VoiceResponse()
        twiml.say("Thanks for your time today. We'll follow up with next steps via text. Goodbye.")
        await updateCall(callId, { call_status: "completed", duration_seconds: elapsedSec })
        await addCallEvent(callId, "max_duration_exceeded", { elapsedSec, maxMinutes })
        return new NextResponse(twiml.toString(), { headers: { "Content-Type": "text/xml" } })
      }
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
    if (response.usage) {
      await addCallEvent(callId, "usage", { tokens: response.usage })
    }

    // Build response TwiML
    const twiml = new VoiceResponse()

    if (response.shouldEndCall) {
      twiml.say(response.message)

      try {
        const insights = await extractCallInsights(currentTranscript, lead)
        await updateCall(callId, {
          summary: insights.summary,
          sentiment: insights.sentiment,
          offer_discussed: insights.offerDiscussed,
          next_steps: insights.nextSteps,
        })
        if (Object.keys(insights.leadUpdates).length > 0) {
          await updateLead(leadId, insights.leadUpdates)
        }
      } catch {}

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
