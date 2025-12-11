import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { phone_number, lead_id, source } = await request.json()
    if (!phone_number) return NextResponse.json({ error: "phone_number required" }, { status: 400 })
    const supabase = await createClient()
    let normalized = String(phone_number).replace(/\D/g, "")
    if (normalized.length === 10) normalized = `+1${normalized}`
    else if (normalized.length === 11 && normalized.startsWith("1")) normalized = `+${normalized}`
    else if (!normalized.startsWith("+")) normalized = `+${normalized}`
    let id = lead_id
    if (!id) {
      const { data: l } = await supabase.from("leads").select("id").eq("phone_number", normalized).single()
      id = (l as any)?.id || null
    }
    await supabase
      .from("consents")
      .insert({ lead_id: id, phone_number: normalized, event: "opt_in", source: source || "web", message_sid: null })
    if (id) {
      await supabase
        .from("leads")
        .update({ consent_status: "opt_in", consented_at: new Date().toISOString(), consent_source: source || "web" })
        .eq("id", id)
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to capture consent" }, { status: 500 })
  }
}
