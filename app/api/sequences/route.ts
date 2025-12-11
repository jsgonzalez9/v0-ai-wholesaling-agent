import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("sequences")
      .insert({ name: payload.name, description: payload.description || null, active: payload.active ?? true })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, sequence: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create sequence" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("sequences").select("*").order("created_at", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, sequences: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to list sequences" }, { status: 500 })
  }
}
