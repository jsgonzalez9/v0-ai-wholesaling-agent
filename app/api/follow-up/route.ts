import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateFollowUp, getAgentConfig } from "@/lib/wholesaling-agent"
import { saveMessage, updateLead } from "@/lib/lead-actions"
import { sendSMS } from "@/lib/twilio"
import type { Lead } from "@/lib/types"

// Endpoint to send follow-up messages to leads who haven't responded
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const config = await getAgentConfig()

    // Find leads that need follow-up:
    // - Have been contacted but no response in X hours
    // - Haven't exceeded max follow-ups
    // - Not in final states (contract_signed, closed, lost)
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - config.follow_up_hours)

    const { data: leadsToFollowUp, error } = await supabase
      .from("leads")
      .select("*")
      .in("conversation_state", ["contacted", "offer_made", "contract_sent"])
      .lt("last_message_at", cutoffTime.toISOString())
      .lt("follow_up_count", config.max_follow_ups)
      .order("last_message_at", { ascending: true })

    if (error) {
      console.error("Error fetching leads for follow-up:", error)
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
    }

    const results = []

    for (const lead of (leadsToFollowUp || []) as Lead[]) {
      try {
        const message = await generateFollowUp(lead, config)

        // Send SMS
        const { sid, error: smsError } = await sendSMS(lead.phone_number, message)

        if (smsError) {
          results.push({ leadId: lead.id, success: false, error: smsError })
          continue
        }

        // Save message
        await saveMessage({
          lead_id: lead.id,
          direction: "outbound",
          content: message,
          twilio_sid: sid || undefined,
        })

        // Increment follow-up count
        await updateLead(lead.id, {
          follow_up_count: lead.follow_up_count + 1,
          last_message_at: new Date().toISOString(),
        })

        results.push({ leadId: lead.id, success: true, message })
      } catch (err) {
        console.error(`Error following up with lead ${lead.id}:`, err)
        results.push({
          leadId: lead.id,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error("Error in follow-up job:", error)
    return NextResponse.json({ error: "Follow-up job failed" }, { status: 500 })
  }
}

// GET endpoint to check which leads need follow-up
export async function GET() {
  try {
    const supabase = await createClient()
    const config = await getAgentConfig()

    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - config.follow_up_hours)

    const { data: leads, error } = await supabase
      .from("leads")
      .select("id, name, phone_number, address, conversation_state, last_message_at, follow_up_count")
      .in("conversation_state", ["contacted", "offer_made", "contract_sent"])
      .lt("last_message_at", cutoffTime.toISOString())
      .lt("follow_up_count", config.max_follow_ups)
      .order("last_message_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
    }

    return NextResponse.json({
      count: leads?.length || 0,
      leads: leads || [],
      config: {
        follow_up_hours: config.follow_up_hours,
        max_follow_ups: config.max_follow_ups,
      },
    })
  } catch (error) {
    console.error("Error checking follow-ups:", error)
    return NextResponse.json({ error: "Failed to check follow-ups" }, { status: 500 })
  }
}
