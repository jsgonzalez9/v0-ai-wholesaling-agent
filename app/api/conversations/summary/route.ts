import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

export async function POST(request: Request) {
  try {
    const { leadId } = await request.json()
    if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 })
    const supabase = await createClient()
    const { data: messages } = await supabase
      .from("messages")
      .select("direction, content, created_at")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true })
    const convo = (messages || [])
      .map((m: any) => `${m.direction === "inbound" ? "SELLER" : "AGENT"}: ${m.content}`)
      .join("\n")

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await client.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content:
            "Summarize this SMS conversation between an agent and seller (2-3 sentences). Extract tone (positive/neutral/negative).",
        },
        { role: "user", content: convo || "No messages" },
      ],
    })
    const text = completion.choices[0].message.content || ""
    const sentiment = /positive|neutral|negative/i.exec(text)?.[0]?.toLowerCase() || "neutral"
    await supabase.from("conversation_summaries").insert({ lead_id: leadId, summary: text, sentiment })
    return NextResponse.json({ success: true, summary: text, sentiment })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to summarize" }, { status: 500 })
  }
}
