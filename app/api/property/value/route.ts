import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(request: Request) {
  try {
    const { address, arv, repairs } = await request.json()
    if (!address) return NextResponse.json({ error: "address required" }, { status: 400 })
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const prompt = `Estimate the current fair market value for: ${address}.
If ARV (${arv || "unknown"}) and repairs (${repairs || "unknown"}) are provided, use them.
Return JSON: {"estimate": number, "confidence": "low|medium|high", "notes": "brief reasoning"}.`
    const completion = await client.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
    })
    const text = completion.choices[0].message.content || "{}"
    let parsed = {}
    try {
      const m = text.match(/\{[\s\S]*\}/)
      parsed = m ? JSON.parse(m[0]) : {}
    } catch {}
    return NextResponse.json({ success: true, ...parsed })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to estimate value" }, { status: 500 })
  }
}
