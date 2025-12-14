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
    let leadId: string | null = null
    let contractLink: string | null = null
    let role: string | null = null
    const contentType = request.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const body = await request.json()
      leadId = body.leadId
      contractLink = body.contractLink || null
      role = body.role || null
    } else {
      const form = await request.formData()
      leadId = String(form.get("leadId") || "")
      contractLink = (form.get("contractLink") as string) || null
      role = (form.get("role") as string) || null
    }

    if (!leadId) {
      return NextResponse.json({ error: "Lead ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const config = await getAgentConfig()

    const { data: lead, error: leadError } = await supabase.from("leads").select("*").eq("id", leadId).single()

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Generate contract link: prefer DocuSeal if configured; else Supabase Storage signed URL from latest template
    let finalContractLink = contractLink || ""
    try {
      if (!finalContractLink) {
        const svc = createServiceClient()
        const state = (lead.state as string | null) || extractStateFromAddress(lead.address || "") || null
        let q = svc
          .from("contract_templates")
          .select("*")
          .eq("role", String(role || "seller"))
        if (state) q = q.eq("state", state)
        const { data: templates } = await q.order("created_at", { ascending: false }).limit(1)
        const tpl = templates?.[0]
        // DocuSeal direct link path
        if (tpl?.docuseal_direct_link) {
          finalContractLink = tpl.docuseal_direct_link
          const update: Record<string, any> = { conversation_state: "contract_sent" }
          if ((role || "seller") === "seller") {
            update.seller_contract_status = "sent"
            update.seller_contract_envelope_id = null
            update.seller_contract_signed_url = tpl.docuseal_direct_link
            update.contract_link = tpl.docuseal_direct_link
          } else {
            update.buyer_contract_status = "sent"
            update.buyer_contract_envelope_id = null
            update.buyer_contract_signed_url = tpl.docuseal_direct_link
          }
          await svc.from("leads").update(update).eq("id", lead.id)
        }
        // DocuSeal API packet path
        else if (tpl?.docuseal_template_id && process.env.DOCUSEAL_BASE_URL && process.env.DOCUSEAL_API_TOKEN) {
          const baseUrl = process.env.DOCUSEAL_BASE_URL!
          const apiToken = process.env.DOCUSEAL_API_TOKEN!
          let submitters: Array<{ name: string; email?: string; phone?: string }> = [
            { name: lead.name, email: (lead as any).email, phone: lead.phone_number },
          ]
          if ((role || "seller") === "buyer" && lead.winning_buyer_id) {
            const { data: buyer } = await svc.from("buyers").select("*").eq("id", lead.winning_buyer_id).single()
            if (buyer) submitters = [{ name: buyer.name, email: buyer.email, phone: buyer.phone }]
          }
          const { createSigningPacket } = await import("@/lib/docuseal")
          const resp = await createSigningPacket({
            baseUrl,
            apiToken,
            templateId: tpl.docuseal_template_id,
            submitters,
            fields: {
              address: lead.address,
              offer_amount: lead.offer_amount || "",
              seller_name: lead.name,
            },
          })
          if (!resp.error && resp.signingUrls && resp.signingUrls[0]) {
            finalContractLink = resp.signingUrls[0]
            const update: Record<string, any> = { conversation_state: "contract_sent" }
            if ((role || "seller") === "seller") {
              update.seller_contract_status = "sent"
              update.seller_contract_envelope_id = resp.packetId || null
              update.seller_contract_signed_url = finalContractLink
              update.contract_link = finalContractLink
            } else {
              update.buyer_contract_status = "sent"
              update.buyer_contract_envelope_id = resp.packetId || null
              update.buyer_contract_signed_url = finalContractLink
            }
            await svc.from("leads").update(update).eq("id", lead.id)
          }
        }
        // Fallback: static file instance duplication and signed URL
        else if (tpl && tpl.storage_path) {
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
