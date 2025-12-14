import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { downloadCompletedPdf } from "@/lib/docuseal"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const svc = createServiceClient()
  const payload = await req.json().catch(() => ({}))
  const event = payload?.event || payload?.type
  const packetId = payload?.packet_id || payload?.id
  const leadId = payload?.metadata?.lead_id
  const role = payload?.metadata?.role // 'seller' | 'buyer'
  if (!packetId || !leadId || !role) return NextResponse.json({ error: "missing packetId/leadId/role" }, { status: 400 })
  if (event !== "completed") return NextResponse.json({ success: true })
  const baseUrl = process.env.DOCUSEAL_BASE_URL || ""
  const apiToken = process.env.DOCUSEAL_API_TOKEN || ""
  let uploadedPath = ""
  let signedUrl = payload?.signed_url || payload?.download_url || payload?.signed_pdf_url || ""
  if (baseUrl && apiToken) {
    const pdf = await downloadCompletedPdf({ baseUrl, apiToken, packetId })
    if (!pdf.error && pdf.blob) {
      const path = `signed/${leadId}-${packetId}-${Date.now()}.pdf`
      const { error: upErr } = await svc.storage.from("contracts").upload(path, pdf.blob, { cacheControl: "3600", upsert: false } as any)
      if (!upErr) uploadedPath = path
    }
  }
  if (role === "seller") {
    await supabase
      .from("leads")
      .update({
        seller_contract_status: "completed",
        contract_link: null,
        seller_contract_signed_url: signedUrl || undefined,
      })
      .eq("id", leadId)
  } else {
    await supabase
      .from("leads")
      .update({
        buyer_contract_status: "completed",
        buyer_contract_signed_url: signedUrl || undefined,
      })
      .eq("id", leadId)
  }
  return NextResponse.json({ success: true, path: uploadedPath || undefined, signedUrl: signedUrl || undefined })
}
