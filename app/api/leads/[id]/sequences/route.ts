import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { sequenceId } = await request.json()
    const supabase = await createClient()
    const { data: firstStep } = await supabase
      .from("sequence_steps")
      .select("*")
      .eq("sequence_id", sequenceId)
      .order("step_index", { ascending: true })
      .limit(1)
    const first = firstStep?.[0]
    const nextRun = new Date(Date.now() + ((first?.delay_minutes as number) || 0) * 60_000).toISOString()
    const { data, error } = await supabase
      .from("lead_sequences")
      .insert({ lead_id: params.id, sequence_id: sequenceId, current_step_index: first?.step_index || 0, next_run_at: nextRun })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, enrollment: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to enroll lead" }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: enrollments } = await supabase
      .from("lead_sequences")
      .select("*")
      .eq("lead_id", params.id)
      .order("created_at", { ascending: false })
      .limit(5)
    const ids = Array.from(new Set((enrollments || []).map((e: any) => e.id)))
    const { data: steps } = await supabase.from("lead_sequence_steps").select("*").in("lead_sequence_id", ids).order("sent_at", { ascending: false })
    return NextResponse.json({ success: true, enrollments: enrollments || [], steps: steps || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to list lead sequences" }, { status: 500 })
  }
}
