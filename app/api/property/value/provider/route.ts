import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { address } = await request.json()
    if (!address) return NextResponse.json({ error: "address required" }, { status: 400 })
    const url = process.env.PROPERTY_PROVIDER_URL
    const key = process.env.PROPERTY_PROVIDER_API_KEY
    if (!url || !key) {
      return NextResponse.json({ error: "Provider not configured" }, { status: 500 })
    }
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ address }),
    })
    if (!resp.ok) {
      const text = await resp.text()
      return NextResponse.json({ error: `Provider error: ${resp.status} ${text}` }, { status: 502 })
    }
    const data = await resp.json()
    return NextResponse.json({ success: true, provider: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to query provider" }, { status: 500 })
  }
}
