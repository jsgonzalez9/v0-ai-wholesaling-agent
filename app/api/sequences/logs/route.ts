import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: logs } = await supabase
      .from("lead_sequence_steps")
      .select("*, lead_sequences(id, lead_id, sequence_id), sequences:lead_sequences(sequence_id)")
      .order("sent_at", { ascending: false })
      .limit(200)
    const leadIds = Array.from(new Set((logs || []).map((l: any) => l.lead_sequences?.lead_id).filter(Boolean)))
    const seqIds = Array.from(new Set((logs || []).map((l: any) => l.lead_sequences?.sequence_id).filter(Boolean)))
    const { data: leads } = await supabase.from("leads").select("id,name").in("id", leadIds)
    const { data: sequences } = await supabase.from("sequences").select("id,name").in("id", seqIds)
    const leadMap: Record<string, any> = {}
    const seqMap: Record<string, any> = {}
    for (const l of leads || []) leadMap[(l as any).id] = l
    for (const s of sequences || []) seqMap[(s as any).id] = s
    const out = (logs || []).map((l: any) => ({
      id: l.id,
      lead_id: l.lead_sequences?.lead_id,
      sequence_id: l.lead_sequences?.sequence_id,
      type: "unknown",
      status: l.status,
      sent_at: l.sent_at,
      summary: l.metadata?.message || "",
      lead: l.lead_sequences?.lead_id ? leadMap[l.lead_sequences.lead_id] || null : null,
      sequence: l.lead_sequences?.sequence_id ? seqMap[l.lead_sequences.sequence_id] || null : null,
    }))
    return NextResponse.json({ success: true, logs: out })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch logs" }, { status: 500 })
  }
}
