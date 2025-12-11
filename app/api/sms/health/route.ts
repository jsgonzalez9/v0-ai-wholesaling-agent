import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const since = new Date()
    since.setMinutes(since.getMinutes() - 60)
    const { data: sent, error } = await supabase
      .from("sms_events")
      .select("from_number, created_at")
      .eq("status", "sent")
      .gte("created_at", since.toISOString())
      .limit(2000)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const perNumber: Record<string, number> = {}
    for (const row of sent || []) {
      const from = (row as any).from_number
      if (typeof from === "string") perNumber[from] = (perNumber[from] || 0) + 1
    }

    return NextResponse.json({ success: true, perNumber })
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch health" }, { status: 500 })
  }
}
