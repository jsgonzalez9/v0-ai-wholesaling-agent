import { NextResponse, NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("follow_up_sequences")
      .select("*")
      .eq("lead_id", id)
      .order("sequence_number", { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, sequences: data || [] })
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch sequences" }, { status: 500 })
  }
}
