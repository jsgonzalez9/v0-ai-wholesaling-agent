import { type NextRequest, NextResponse } from "next/server"
import { updateLead, saveMessage } from "@/lib/lead-actions"
import { createClient } from "@/lib/supabase/server"

// Endpoint to mark a contract as signed (can be called by DocuSign webhook or manually)
export async function POST(request: NextRequest) {
  try {
    const { leadId } = await request.json()

    if (!leadId) {
      return NextResponse.json({ error: "Lead ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: lead, error: leadError } = await supabase.from("leads").select("*").eq("id", leadId).single()

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Update lead state to contract_signed
    const { lead: updatedLead, error } = await updateLead(leadId, {
      conversation_state: "contract_signed",
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    // Save a system message noting the contract was signed
    await saveMessage({
      lead_id: leadId,
      direction: "outbound",
      content: `[SYSTEM] Contract signed by ${lead.name} for ${lead.address}. Deal value: $${lead.offer_amount?.toLocaleString()}`,
    })

    return NextResponse.json({
      success: true,
      lead: updatedLead,
    })
  } catch (error) {
    console.error("Error marking contract signed:", error)
    return NextResponse.json({ error: "Failed to mark signed" }, { status: 500 })
  }
}
