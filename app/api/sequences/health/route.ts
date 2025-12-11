import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: enroll } = await supabase.from("lead_sequences").select("*")
    const bySeq: Record<string, { total: number; disabled: number; failing: number; warning: number }> = {}
    for (const e of enroll || []) {
      const sid = (e as any).sequence_id
      bySeq[sid] = bySeq[sid] || { total: 0, disabled: 0, failing: 0, warning: 0 }
      bySeq[sid].total++
      if ((e as any).disabled) bySeq[sid].disabled++
      else if (Number((e as any).fail_streak || 0) >= 3) bySeq[sid].failing++
      else if (Number((e as any).fail_streak || 0) >= 1) bySeq[sid].warning++
    }
    return NextResponse.json({ success: true, health: bySeq })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to compute health" }, { status: 500 })
  }
}
