import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { saveMessage, updateLead } from "@/lib/lead-actions"
import { sendSMS } from "@/lib/twilio"
import { getAgentConfig } from "@/lib/wholesaling-agent"

export async function POST(request: NextRequest) {
  try {
    const { leadId, contractLink } = await request.json()

    if (!leadId) {
      return NextResponse.json({ error: "Lead ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const config = await getAgentConfig()

    const { data: lead, error: leadError } = await supabase.from("leads").select("*").eq("id", leadId).single()

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Generate contract link if not provided (placeholder for DocuSign integration)
    const finalContractLink = contractLink || generateContractLink(lead, config.company_name)

    // Compose message
    const message = `Great news, ${lead.name}! I've prepared the contract for ${lead.address} at $${lead.offer_amount?.toLocaleString()}. You can review and sign here: ${finalContractLink}`

    // Send SMS
    const { sid, error: smsError } = await sendSMS(lead.phone_number, message)

    if (smsError) {
      return NextResponse.json({ error: smsError }, { status: 500 })
    }

    // Save message
    await saveMessage({
      lead_id: lead.id,
      direction: "outbound",
      content: message,
      twilio_sid: sid || undefined,
    })

    // Update lead state
    await updateLead(lead.id, {
      conversation_state: "contract_sent",
      contract_link: finalContractLink,
      last_message_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      contractLink: finalContractLink,
      messageSid: sid,
    })
  } catch (error) {
    console.error("Error sending contract:", error)
    return NextResponse.json({ error: "Failed to send contract" }, { status: 500 })
  }
}

// Placeholder function - replace with actual DocuSign integration
function generateContractLink(lead: any, companyName: string): string {
  // In production, this would:
  // 1. Call DocuSign API to create envelope
  // 2. Pre-fill contract with lead info
  // 3. Return the signing URL

  // For MVP, return a placeholder URL with encoded data
  const params = new URLSearchParams({
    name: lead.name,
    address: lead.address,
    offer: lead.offer_amount?.toString() || "",
    company: companyName,
  })

  return `https://your-docusign-url.com/sign?${params.toString()}`
}
