import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = await request.json()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("sequences")
      .update({ name: payload.name, description: payload.description, active: payload.active })
      .eq("id", params.id)
      .select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, sequence: (data || [])[0] || null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update sequence" }, { status: 500 })
  }
}
