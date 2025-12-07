import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { getLeadById } from "@/lib/lead-actions"
import { createCall, updateCall } from "@/lib/voice-call-actions"

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_PHONE_NUMBER

export async function POST(request: NextRequest) {
  try {
    const { leadId } = await request.json()

    if (!leadId || !accountSid || !authToken || !fromNumber) {
      return NextResponse.json({ error: "Missing required parameters or Twilio credentials" }, { status: 400 })
    }

    const lead = await getLeadById(leadId)

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Create call record
    const call = await createCall(leadId, "outbound")

    if (!call) {
      return NextResponse.json({ error: "Failed to create call record" }, { status: 500 })
    }

    // Initiate call with Twilio
    const client = twilio(accountSid, authToken)

    const twilio_call = await client.calls.create({
      from: fromNumber,
      to: lead.phone_number,
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/twilio/voice/outbound-callback?call_id=${call.id}&lead_id=${leadId}`,
    })

    // Update call with Twilio SID
    await updateCall(call.id, {
      twilio_call_sid: twilio_call.sid,
      call_status: "ringing",
    })

    return NextResponse.json({
      success: true,
      callId: call.id,
      twilioSid: twilio_call.sid,
    })
  } catch (error) {
    console.error("[Voice Outbound] Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
