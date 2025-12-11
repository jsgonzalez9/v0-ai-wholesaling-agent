import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { submitBrandToTwilio } from "@/lib/a2p"

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("a2p_brands")
      .insert({
        business_name: payload.business_name,
        ein: payload.ein || null,
        contact_email: payload.contact_email || null,
        contact_phone: payload.contact_phone || null,
        address: payload.address || null,
        use_case: payload.use_case || "real_estate_lead_generation",
        submission_status: "submitted",
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const twilioEnabled = process.env.TWILIO_A2P_ENABLED === "true"
    if (twilioEnabled) {
      const res = await submitBrandToTwilio(payload)
      await supabase
        .from("a2p_brands")
        .update({ provider_id: res.provider_id || null, submission_status: res.status || "submitted" })
        .eq("id", data.id)
      await supabase.from("a2p_logs").insert({
        entity_type: "brand",
        entity_id: data.id,
        level: res.error ? "error" : "info",
        message: res.error ? "Brand submission error" : "Brand submitted to Twilio",
        meta: res,
      })
    }

    await supabase.from("a2p_logs").insert({
      entity_type: "brand",
      entity_id: data.id,
      level: "info",
      message: "Brand submitted",
      meta: payload,
    })

    return NextResponse.json({ success: true, brand: data })
  } catch (e) {
    return NextResponse.json({ error: "Failed to submit brand" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("a2p_brands").select("*").order("created_at", { ascending: false }).limit(50)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, brands: data })
  } catch {
    return NextResponse.json({ error: "Failed to list brands" }, { status: 500 })
  }
}
