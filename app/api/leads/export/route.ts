import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(5000)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const headers = [
      "id",
      "name",
      "phone_number",
      "address",
      "pipeline_status",
      "tags",
      "score",
      "conversation_state",
      "last_message_at",
      "created_at",
    ]
    const rows = (data || []).map((l: any) => [
      l.id,
      l.name,
      l.phone_number,
      l.address,
      l.pipeline_status || "",
      Array.isArray(l.tags) ? l.tags.join("|") : "",
      typeof l.score === "number" ? l.score : "",
      l.conversation_state,
      l.last_message_at || "",
      l.created_at,
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => String(v).replace(/,/g, ";")).join(","))].join("\n")
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="leads.csv"',
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to export" }, { status: 500 })
  }
}
