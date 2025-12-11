import { NextResponse } from "next/server"

function functionUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  if (!base) return null
  try {
    const u = new URL(base)
    const host = u.host.replace(".supabase.co", ".functions.supabase.co")
    return `https://${host}/sequence-runner`
  } catch {
    return null
  }
}

export async function POST() {
  try {
    const url = functionUrl()
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return NextResponse.json({ error: "Function URL or key missing" }, { status: 400 })
    const resp = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${key}` } })
    const j = await resp.json().catch(() => ({ status: "ok" }))
    return NextResponse.json(j)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to invoke function" }, { status: 500 })
  }
}
