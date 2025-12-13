import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { saveMessage, updateLead } from "@/lib/lead-actions"
import { sendSMS } from "@/lib/twilio"
import { getAgentConfig } from "@/lib/wholesaling-agent"
import { createServiceClient } from "@/lib/supabase/service"

function extractStateFromAddress(address: string): string | null {
  try {
    // Simple heuristic: use last comma-separated token trimmed to 2 letters if looks like state code
    const parts = address.split(",").map((p) => p.trim())
    const last = parts[parts.length - 1] || ""
    const m = last.match(/\b([A-Z]{2})\b/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { leadId, contractLink, role } = await request.json()

    if (!leadId) {
      return NextResponse.json({ error: "Lead ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const config = await getAgentConfig()

    const { data: lead, error: leadError } = await supabase.from("leads").select("*").eq("id", leadId).single()

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Generate contract link: prefer Supabase Storage signed URL from latest template
    let finalContractLink = contractLink || ""
    try {
      if (!finalContractLink) {
        const svc = createServiceClient()
        const state = extractStateFromAddress(lead.address || "") || null
        let q = svc
          .from("contract_templates")
          .select("*")
          .eq("role", String(role || "seller"))
        if (state) q = q.eq("state", state)
        const { data: templates } = await q.order("created_at", { ascending: false }).limit(1)
        const tpl = templates?.[0]
        if (tpl && tpl.storage_path) {
          const fileRes = await svc.storage.from("contracts").download(tpl.storage_path)
          if (fileRes.data) {
            const filename = tpl.storage_path.split("/").pop() || "contract.pdf"
            const instancePath = `instances/${lead.id}/${Date.now()}-${filename}`
            const uploadRes = await svc.storage.from("contracts").upload(instancePath, fileRes.data, {
              cacheControl: "3600",
              upsert: false,
            } as any)
            if (!uploadRes.error) {
              const signed = await svc.storage.from("contracts").createSignedUrl(instancePath, 15 * 60)
              if (!signed.error && signed.data?.signedUrl) {
                finalContractLink = signed.data.signedUrl
                await svc.from("contract_instances").insert({
                  lead_id: lead.id,
                  template_id: tpl.id,
                  storage_path: instancePath,
                  status: "sent",
                })
                await svc
                  .from("leads")
                  .update({ contract_link: finalContractLink, conversation_state: "contract_sent" })
                  .eq("id", lead.id)
              }
            }
          }
        }
      }
    } catch {}
    if (!finalContractLink) {
      finalContractLink = generateContractLink(lead, config.company_name)
    }

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
