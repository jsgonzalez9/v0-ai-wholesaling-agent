import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get("limit") || 100)
    const sentiment = url.searchParams.get("sentiment")
    const minMotivation = url.searchParams.get("minMotivation")
    const decisionMaker = url.searchParams.get("decisionMaker")
    const hasObjections = url.searchParams.get("hasObjections")
    const leadId = url.searchParams.get("leadId")

    const supabase = await createClient()
    let q = supabase.from("call_summaries").select("*").order("created_at", { ascending: false }).limit(Math.min(100, limit))
    if (sentiment) q = q.eq("sentiment", sentiment)
    if (minMotivation) q = q.gte("motivation", Number(minMotivation))
    if (decisionMaker === "true") q = q.not("decision_maker", "is", null)
    if (decisionMaker === "false") q = q.is("decision_maker", null)
    if (hasObjections === "true") q = q.not("objections", "is", null)
    if (hasObjections === "false") q = q.is("objections", null)
    if (leadId) q = q.eq("lead_id", leadId)
    const { data: calls, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const leadIds = Array.from(new Set((calls || []).map((c: any) => c.lead_id).filter(Boolean)))
    let leadsById: Record<string, any> = {}
    if (leadIds.length > 0) {
      const { data: leads } = await supabase.from("leads").select("id,name,address,phone_number").in("id", leadIds)
      for (const l of leads || []) {
        leadsById[(l as any).id] = l
      }
    }
    const result = (calls || []).map((c: any) => ({
      ...c,
      lead: c.lead_id ? leadsById[c.lead_id] || null : null,
    }))
    return NextResponse.json({ success: true, calls: result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch calls" }, { status: 500 })
  }
}
