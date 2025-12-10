import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const since = new Date()
    since.setDate(since.getDate() - 7)
    const { data, error } = await supabase
      .from("a2p_logs")
      .select("*")
      .eq("entity_type", "lead")
      .eq("message", "hot_lead")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(200)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, items: data || [] })
  } catch {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}
