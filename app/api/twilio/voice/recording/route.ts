import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"
import { getLeadByPhone } from "@/lib/lead-actions"

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const recordingUrl = (form.get("RecordingUrl") as string) || ""
    const from = (form.get("From") as string) || ""
    if (!recordingUrl || !from) return NextResponse.json({ error: "Missing recording or caller" }, { status: 400 })

    const audioUrl = recordingUrl.endsWith(".mp3") ? recordingUrl : `${recordingUrl}.mp3`
    let transcript = ""
    try {
      const res = await fetch(audioUrl)
      const buf = await res.arrayBuffer()
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const file = new File([buf], "call.mp3", { type: "audio/mpeg" })
      const t = await client.audio.transcriptions.create({ file, model: "whisper-1" })
      transcript = t.text || ""
    } catch {}

    const lead = await getLeadByPhone(from)
    const supabase = await createClient()
    let summary = ""
    let sentiment = "neutral"
    let intent = "unknown"
    let urgency = 0
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const prompt =
        "Summarize the caller's intent in 2-3 sentences. Return JSON with keys: summary, sentiment (positive/neutral/negative), intent (motivated/hesitant/price_shopper/dead), urgency (0-5)."
      const comp = await client.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: transcript || "No transcript" },
        ],
      })
      const text = comp.choices[0].message.content || "{}"
      const m = text.match(/\{[\s\S]*\}/)
      if (m) {
        const j = JSON.parse(m[0])
        summary = j.summary || ""
        sentiment = (j.sentiment || "neutral").toLowerCase()
        intent = (j.intent || "unknown").toLowerCase()
        urgency = Number(j.urgency || 0)
      }
    } catch {}

    await supabase.from("call_summaries").insert({
      lead_id: lead?.id || null,
      transcript,
      summary,
      sentiment,
      intent,
      urgency,
      recording_url: audioUrl,
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to process recording" }, { status: 500 })
  }
}
