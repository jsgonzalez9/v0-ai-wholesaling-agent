import { NextResponse } from "next/server"

export async function POST() {
  const callback = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/twilio/voice/recording`
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thanks for calling. This call may be recorded to help prepare your offer.</Say>
  <Record maxLength="600" playBeep="true" transcribe="false" recordingStatusCallback="${callback}" />
  <Say>Got it. We'll follow up with an offer shortly.</Say>
</Response>`
  return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } })
}
