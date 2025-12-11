import { NextResponse, NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json()
    const { id } = await context.params
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("leads")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, lead: data })
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to update" }, { status: 500 })
  }
}
