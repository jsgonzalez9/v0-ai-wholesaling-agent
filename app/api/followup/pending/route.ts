import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const now = new Date().toISOString()
    const maxAttempts = Number(process.env.FOLLOWUP_MAX_ATTEMPTS || 3)
    const { data, error } = await supabase
      .from("follow_up_sequences")
      .select("id, lead_id, sequence_number, scheduled_for, attempts, next_attempt_at, status, error_last, leads(name, phone_number, address)")
      .eq("status", "pending")
      .lt("attempts", maxAttempts)
      .lte("scheduled_for", now)
      .or(`next_attempt_at.is.null,next_attempt_at.lte.${now}`)
      .order("scheduled_for", { ascending: true })
      .limit(200)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, items: data || [] })
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch pending follow-ups" }, { status: 500 })
  }
}
