import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { orderedStepIds } = await request.json()
    if (!Array.isArray(orderedStepIds) || orderedStepIds.length === 0) {
      return NextResponse.json({ error: "orderedStepIds required" }, { status: 400 })
    }
    const supabase = await createClient()
    let idx = 0
    for (const stepId of orderedStepIds) {
      await supabase.from("sequence_steps").update({ step_index: idx }).eq("id", stepId)
      idx++
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to reorder" }, { status: 500 })
  }
}
