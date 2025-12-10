import { NextResponse } from "next/server"
import OpenAI from "openai"

async function fetchProvider(address: string) {
  try {
    const url = process.env.PROPERTY_PROVIDER_URL
    const key = process.env.PROPERTY_PROVIDER_API_KEY
    if (!url || !key) return null
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ address }),
    })
    if (!resp.ok) return null
    const data = await resp.json()
    const est = Number(data?.estimate || data?.value || data?.price)
    return Number.isFinite(est) ? est : null
  } catch {
    return null
  }
}

async function fetchLLM(address: string) {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const prompt = `Estimate current fair market value for: ${address}. Return JSON: {"estimate": number}.`
    const completion = await client.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
    })
    const text = completion.choices[0].message.content || "{}"
    const m = text.match(/\{[\s\S]*\}/)
    const j = m ? JSON.parse(m[0]) : {}
    const est = Number(j?.estimate)
    return Number.isFinite(est) ? est : null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const { address } = await request.json()
    if (!address) return NextResponse.json({ error: "address required" }, { status: 400 })
    const [prov, llm] = await Promise.all([fetchProvider(address), fetchLLM(address)])
    const hasProv = Number.isFinite(prov as number)
    const hasLLM = Number.isFinite(llm as number)
    let estimate: number | null = null
    if (hasProv && hasLLM) estimate = Math.round(((prov as number) * 0.7 + (llm as number) * 0.3) * 100) / 100
    else if (hasProv) estimate = prov as number
    else if (hasLLM) estimate = llm as number
    return NextResponse.json({ success: true, estimate, provider: prov, llm })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to estimate value" }, { status: 500 })
  }
}
