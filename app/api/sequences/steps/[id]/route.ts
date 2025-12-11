import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = await request.json()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("sequence_steps")
      .update({
        step_index: payload.step_index,
        type: payload.type,
        delay_minutes: payload.delay_minutes,
        message: payload.message,
        recording_url: payload.recording_url,
        active: payload.active,
      })
      .eq("id", params.id)
      .select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, step: (data || [])[0] || null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update step" }, { status: 500 })
  }
}
