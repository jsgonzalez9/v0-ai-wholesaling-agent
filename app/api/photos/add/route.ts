import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { leadId, url, caption } = await request.json()
    if (!leadId || !url) return NextResponse.json({ error: "leadId and url required" }, { status: 400 })
    const supabase = await createClient()
    const { error } = await supabase.from("property_photos").insert({ lead_id: leadId, url, caption: caption || null })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to add photo" }, { status: 500 })
  }
}
