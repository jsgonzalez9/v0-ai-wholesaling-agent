import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: brands } = await supabase.from("a2p_brands").select("*").order("created_at", { ascending: false }).limit(1)
    const brand = brands?.[0] || null
    const { data: campaigns } = await supabase.from("a2p_campaigns").select("*").order("created_at", { ascending: false }).limit(5)
    const since = new Date()
    since.setDate(1)
    since.setHours(0, 0, 0, 0)
    const { data: events } = await supabase.from("sms_events").select("*").gte("created_at", since.toISOString())
    const perNumber: Record<string, { sent: number; failed: number; blocked: number }> = {}
    for (const e of events || []) {
      const num = (e as any).from_number || "unknown"
      perNumber[num] = perNumber[num] || { sent: 0, failed: 0, blocked: 0 }
      const status = (e as any).status
      if (status === "sent" || status === "delivered") perNumber[num].sent++
      else if (status === "failed") perNumber[num].failed++
      else if (status === "blocked") perNumber[num].blocked++
    }
    const limit = Number(process.env.SMS_MONTHLY_LIMIT_PER_NUMBER || 10000)
    const stats = Object.entries(perNumber).map(([num, s]) => ({
      number: num,
      sent: s.sent,
      failed: s.failed,
      blocked: s.blocked,
      cap_used_pct: Math.round((s.sent / Math.max(1, limit)) * 100),
    }))
    return NextResponse.json({
      success: true,
      brand_status: brand?.submission_status || "unknown",
      campaign_statuses: (campaigns || []).map((c: any) => ({ id: c.id, status: c.submission_status || "unknown" })),
      numbers: stats,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to compute A2P health" }, { status: 500 })
  }
}
