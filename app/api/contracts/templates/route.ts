import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET() {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase.from("contract_templates").select("*").order("created_at", { ascending: false })
    return NextResponse.json({ templates: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to list templates" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get("file") as File | null
    const name = String(form.get("name") || "")
    const role = String(form.get("role") || "seller")
    const state = String(form.get("state") || "")
    if (!file || !name) return NextResponse.json({ error: "file and name required" }, { status: 400 })
    const supabase = createServiceClient()
    const path = `templates/${Date.now()}-${file.name}`
    const { error: upErr } = await supabase.storage.from("contracts").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    } as any)
    if (upErr) return NextResponse.json({ error: upErr.message || "Upload failed" }, { status: 500 })
    const { data: row } = await supabase
      .from("contract_templates")
      .insert({ name, storage_path: path, role, state: state || null })
      .select("*")
      .single()
    return NextResponse.json({ success: true, template: row })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to upload template" }, { status: 500 })
  }
}
