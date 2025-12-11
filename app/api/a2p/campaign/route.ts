import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { submitCampaignToTwilio } from "@/lib/a2p"

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("a2p_campaigns")
      .insert({
        brand_id: payload.brand_id,
        campaign_name: payload.campaign_name,
        description: payload.description || null,
        message_flow: payload.message_flow || null,
        call_to_action: payload.call_to_action || null,
        sample_messages: payload.sample_messages || null,
        submission_status: "submitted",
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const twilioEnabled = process.env.TWILIO_A2P_ENABLED === "true"
    if (twilioEnabled) {
      const res = await submitCampaignToTwilio({
        brand_provider_id: payload.brand_provider_id || payload.brand_id,
        campaign_name: payload.campaign_name,
        description: payload.description,
        sample_messages: payload.sample_messages,
      })
      await supabase
        .from("a2p_campaigns")
        .update({ provider_id: res.provider_id || null, submission_status: res.status || "submitted" })
        .eq("id", data.id)
      await supabase.from("a2p_logs").insert({
        entity_type: "campaign",
        entity_id: data.id,
        level: res.error ? "error" : "info",
        message: res.error ? "Campaign submission error" : "Campaign submitted to Twilio",
        meta: res,
      })
    }

    await supabase.from("a2p_logs").insert({
      entity_type: "campaign",
      entity_id: data.id,
      level: "info",
      message: "Campaign submitted",
      meta: payload,
    })

    return NextResponse.json({ success: true, campaign: data })
  } catch {
    return NextResponse.json({ error: "Failed to submit campaign" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("a2p_campaigns").select("*").order("created_at", { ascending: false }).limit(50)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, campaigns: data })
  } catch {
    return NextResponse.json({ error: "Failed to list campaigns" }, { status: 500 })
  }
}
