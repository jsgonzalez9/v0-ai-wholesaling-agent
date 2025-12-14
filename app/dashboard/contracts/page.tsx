import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default async function ContractsPage() {
  const supabase = await createClient()
  const { data: templates } = await supabase.from("contract_templates").select("*").order("created_at", { ascending: false })
  const { data: sellerSigned } = await supabase
    .from("leads")
    .select("id,name,address,seller_contract_signed_url,seller_contract_status,updated_at")
    .eq("seller_contract_status", "completed")
    .order("updated_at", { ascending: false })
    .limit(50)
  const { data: buyerSigned } = await supabase
    .from("leads")
    .select("id,name,address,buyer_contract_signed_url,buyer_contract_status,updated_at,winning_buyer_id")
    .eq("buyer_contract_status", "completed")
    .order("updated_at", { ascending: false })
    .limit(50)
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-foreground">Contracts</h1>
      <div className="mt-4">
        <form action="/api/contracts/templates" method="post" encType="multipart/form-data" className="flex items-center gap-2">
          <Input name="file" type="file" accept=".pdf,.docx,.txt" />
          <Input name="name" placeholder="Template name" />
          <Input name="role" placeholder="Role (seller|buyer)" />
          <Input name="state" placeholder="State (optional)" />
          <Button type="submit">Upload Template</Button>
        </form>
        <div className="mt-4">
          <form action="/api/contracts/docuseal/link" method="post" className="flex flex-wrap items-center gap-2">
            <select name="role" defaultValue="seller" className="rounded border border-border bg-background p-2 text-sm">
              <option value="seller">Seller</option>
              <option value="buyer">Buyer</option>
            </select>
            <Input name="state" placeholder="State (optional)" />
            <Input name="templateId" placeholder="DocuSeal template id or URL (e.g. http://localhost:3010/d/...)" />
            <Button type="submit" variant="outline">Link DocuSeal</Button>
          </form>
          <form action="/api/send-contract" method="post" className="mt-3 flex flex-wrap items-center gap-2">
            <select name="role" defaultValue="seller" className="rounded border border-border bg-background p-2 text-sm">
              <option value="seller">Send Seller Contract</option>
              <option value="buyer">Send Buyer Contract</option>
            </select>
            <Input name="leadId" placeholder="Lead ID" />
            <Button type="submit">Send Contract</Button>
          </form>
          <form action="/api/sign/ds/manual-complete" method="post" className="mt-3 flex flex-wrap items-center gap-2">
            <select name="role" defaultValue="seller" className="rounded border border-border bg-background p-2 text-sm">
              <option value="seller">Mark Seller Completed</option>
              <option value="buyer">Mark Buyer Completed</option>
            </select>
            <Input name="leadId" placeholder="Lead ID" />
            <Input name="signedUrl" placeholder="Signed URL (optional)" />
            <Button type="submit" variant="outline">Mark Completed</Button>
          </form>
        </div>
      </div>
      <h2 className="mt-6 text-base font-semibold text-foreground">Contract Templates</h2>
      <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
        {(!templates || templates.length === 0) && (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">No templates uploaded yet. You can still link a DocuSeal ID or URL using the form above.</p>
          </div>
        )}
        {(templates || []).map((t: any) => (
          <div key={t.id} className="rounded-lg border border-border bg-card p-4">
            <p className="font-medium text-foreground">{t.name}</p>
            <p className="text-sm text-muted-foreground">Role: {t.role}</p>
            <p className="text-sm text-muted-foreground">State: {t.state || "-"}</p>
            <p className="text-xs text-muted-foreground">Path: {t.storage_path}</p>
            <div className="mt-2 flex items-center gap-2">
              <form action="/api/contracts/docuseal/link" method="post" className="flex items-center gap-2">
                <input type="hidden" name="role" value={t.role} />
                <input type="hidden" name="state" value={t.state || ""} />
                <Input name="templateId" placeholder="DocuSeal template id or URL" defaultValue={t.docuseal_template_id || t.docuseal_direct_link || ""} />
                <Button type="submit" variant="outline">Link DocuSeal</Button>
              </form>
              <form action="/api/contracts/templates/delete" method="post" className="flex items-center gap-2">
                <input type="hidden" name="id" value={t.id} />
                <Button type="submit" variant="destructive">Delete</Button>
              </form>
              {t.docuseal_direct_link && (
                <a className="inline-block text-primary underline" href={t.docuseal_direct_link} target="_blank" rel="noreferrer">
                  Open DocuSeal
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      <h2 className="mt-8 text-base font-semibold text-foreground">Seller Signed</h2>
      <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
        {(!sellerSigned || sellerSigned.length === 0) && (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">No seller contracts completed yet.</p>
          </div>
        )}
        {(sellerSigned || []).map((l: any) => (
          <div key={l.id} className="rounded-lg border border-border bg-card p-4">
            <p className="font-medium text-foreground">{l.name}</p>
            <p className="text-sm text-muted-foreground">{l.address}</p>
            <p className="text-xs text-muted-foreground">Status: {l.seller_contract_status}</p>
            {l.seller_contract_signed_url && (
              <a className="mt-2 inline-block text-primary underline" href={l.seller_contract_signed_url} target="_blank" rel="noreferrer">
                View Signed PDF
              </a>
            )}
          </div>
        ))}
      </div>
      <h2 className="mt-8 text-base font-semibold text-foreground">Buyer Signed</h2>
      <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
        {(!buyerSigned || buyerSigned.length === 0) && (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">No buyer contracts completed yet.</p>
          </div>
        )}
        {(buyerSigned || []).map((l: any) => (
          <div key={l.id} className="rounded-lg border border-border bg-card p-4">
            <p className="font-medium text-foreground">{l.name}</p>
            <p className="text-sm text-muted-foreground">{l.address}</p>
            <p className="text-xs text-muted-foreground">Status: {l.buyer_contract_status}</p>
            {l.winning_buyer_id && <p className="text-xs text-muted-foreground">Buyer: {l.winning_buyer_id}</p>}
            {l.buyer_contract_signed_url && (
              <a className="mt-2 inline-block text-primary underline" href={l.buyer_contract_signed_url} target="_blank" rel="noreferrer">
                View Signed PDF
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
