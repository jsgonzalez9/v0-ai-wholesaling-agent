import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = await createClient()
    const thresholdDays = Number(process.env.DEAD_LEAD_AFTER_DAYS || 21)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - thresholdDays)
    const cutoffISO = cutoff.toISOString()
    const { data } = await supabase
      .from("leads")
      .select("*")
      .lte("last_message_at", cutoffISO)
      .neq("pipeline_status", "HOT")
      .neq("pipeline_status", "WARM")
      .is("is_opted_out", null)
      .limit(500)
    const targets = (data || []).filter((l: any) => !l.is_opted_out)
    for (const l of targets) {
      await supabase.from("leads").update({ pipeline_status: "DEAD", score: 0 }).eq("id", l.id)
    }
    return NextResponse.json({ success: true, updated: targets.length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to auto-mark dead" }, { status: 500 })
  }
}
