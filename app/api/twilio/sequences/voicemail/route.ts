import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const form = await request.formData()
  const answeredBy = (form.get("AnsweredBy") as string) || ""
  const recordingUrl = (new URL(request.url)).searchParams.get("recording_url") || ""
  const isMachine = answeredBy && answeredBy.toLowerCase().includes("machine")
  const twiml = isMachine && recordingUrl
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Play>${recordingUrl}</Play><Hangup/></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`
  return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } })
}
