import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    // Check if config exists
    const { data: existing } = await supabase.from("agent_config").select("id").single()

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from("agent_config")
        .update({
          company_name: body.company_name,
          wholesaling_fee: body.wholesaling_fee,
          arv_multiplier: body.arv_multiplier,
          follow_up_hours: body.follow_up_hours,
          max_follow_ups: body.max_follow_ups,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      // Insert new
      const { error } = await supabase.from("agent_config").insert({
        company_name: body.company_name,
        wholesaling_fee: body.wholesaling_fee,
        arv_multiplier: body.arv_multiplier,
        follow_up_hours: body.follow_up_hours,
        max_follow_ups: body.max_follow_ups,
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving settings:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
