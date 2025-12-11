import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCampaignStatusFromTwilio } from "@/lib/a2p"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    const supabase = await createClient()
    const { data, error } = await supabase.from("a2p_campaigns").select("*").eq("id", id).single()
    if (error || !data) return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    let providerStatus = null
    if (process.env.TWILIO_A2P_ENABLED === "true" && (data as any).provider_id) {
      const res = await getCampaignStatusFromTwilio((data as any).provider_id)
      providerStatus = res.status || null
      if (providerStatus) {
        await supabase.from("a2p_campaigns").update({ submission_status: providerStatus }).eq("id", id)
      }
    }
    return NextResponse.json({ success: true, campaign: data, providerStatus })
  } catch {
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 })
  }
}
