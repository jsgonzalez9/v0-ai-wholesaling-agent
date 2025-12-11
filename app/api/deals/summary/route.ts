import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const supabase = await createClient()
    const { data: lead, error } = await supabase.from("leads").select("*").eq("id", id).single()
    if (error || !lead) return NextResponse.json({ error: "lead not found" }, { status: 404 })
    const html = `
      <html><head><meta charset="utf-8"><title>Deal Summary</title>
      <style>body{font-family:system-ui;padding:24px;}h1{margin:0 0 8px}section{margin-top:16px}table{width:100%;border-collapse:collapse}td{padding:6px;border-bottom:1px solid #ddd}</style>
      </head><body>
      <h1>Deal Summary</h1>
      <p>${lead.name} — ${lead.address}</p>
      <section>
        <table>
          <tr><td>Phone</td><td>${lead.phone_number}</td></tr>
          <tr><td>Status</td><td>${lead.pipeline_status || ""} (${lead.conversation_state})</td></tr>
          <tr><td>ARV</td><td>${lead.arv ? `$${lead.arv.toLocaleString()}` : "-"}</td></tr>
          <tr><td>Repairs</td><td>${lead.repair_estimate ? `$${lead.repair_estimate.toLocaleString()}` : "-"}</td></tr>
          <tr><td>Mortgage Owed</td><td>${lead.mortgage_owed ? `$${lead.mortgage_owed.toLocaleString()}` : "-"}</td></tr>
          <tr><td>Offer</td><td>${lead.offer_amount ? `$${lead.offer_amount.toLocaleString()}` : "-"}</td></tr>
          <tr><td>Tags</td><td>${(lead.tags || []).join(", ")}</td></tr>
          <tr><td>Score</td><td>${lead.score ?? "-"}</td></tr>
        </table>
      </section>
      <section><h3>Notes</h3><p>${(lead.notes || "").replace(/\n/g, "<br/>")}</p></section>
      </body></html>
    `
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } })
  } catch {
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 })
  }
}
