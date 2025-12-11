"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function A2PPage() {
  const [brands, setBrands] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [submittingBrand, setSubmittingBrand] = useState(false)
  const [submittingCampaign, setSubmittingCampaign] = useState(false)
  const [brandForm, setBrandForm] = useState({
    business_name: "",
    ein: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    use_case: "real_estate_lead_generation",
  })
  const [campaignForm, setCampaignForm] = useState({
    brand_id: "",
    brand_provider_id: "",
    campaign_name: "",
    description: "",
    sample_messages: "",
  })

  async function load() {
    try {
      const b = await fetch("/api/a2p/brand").then((r) => r.json())
      const c = await fetch("/api/a2p/campaign").then((r) => r.json())
      setBrands(b.brands || [])
      setCampaigns(c.campaigns || [])
    } catch {}
  }

  useEffect(() => {
    load()
  }, [])

  async function submitBrand() {
    setSubmittingBrand(true)
    try {
      const resp = await fetch("/api/a2p/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brandForm),
      })
      const data = await resp.json()
      if (data.success) {
        await load()
      } else {
        alert(data.error || "Failed to submit brand")
      }
    } catch {
      alert("Failed to submit brand")
    }
    setSubmittingBrand(false)
  }

  async function submitCampaign() {
    setSubmittingCampaign(true)
    try {
      const payload = {
        brand_id: campaignForm.brand_id,
        brand_provider_id: campaignForm.brand_provider_id,
        campaign_name: campaignForm.campaign_name,
        description: campaignForm.description,
        sample_messages: campaignForm.sample_messages,
      }
      const resp = await fetch("/api/a2p/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await resp.json()
      if (data.success) {
        await load()
      } else {
        alert(data.error || "Failed to submit campaign")
      }
    } catch {
      alert("Failed to submit campaign")
    }
    setSubmittingCampaign(false)
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>A2P Brand Registration</CardTitle>
          <CardDescription>Submit your brand details for 10DLC</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Business Name" value={brandForm.business_name} onChange={(e) => setBrandForm((f) => ({ ...f, business_name: e.target.value }))} />
          <Input placeholder="EIN (optional)" value={brandForm.ein} onChange={(e) => setBrandForm((f) => ({ ...f, ein: e.target.value }))} />
          <Input placeholder="Contact Email" value={brandForm.contact_email} onChange={(e) => setBrandForm((f) => ({ ...f, contact_email: e.target.value }))} />
          <Input placeholder="Contact Phone" value={brandForm.contact_phone} onChange={(e) => setBrandForm((f) => ({ ...f, contact_phone: e.target.value }))} />
          <Input placeholder="Business Address" value={brandForm.address} onChange={(e) => setBrandForm((f) => ({ ...f, address: e.target.value }))} />
          <Button onClick={submitBrand} disabled={submittingBrand}>{submittingBrand ? "Submitting..." : "Submit Brand"}</Button>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Submitted Brands</p>
            <div className="mt-2 space-y-2">
              {(brands || []).map((b) => (
                <div key={b.id} className="rounded border border-border p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{b.business_name}</span>
                    <span className="text-muted-foreground">{b.submission_status}</span>
                  </div>
                  <p className="text-muted-foreground">Provider: {b.provider_id || "-"}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>A2P Campaign Registration</CardTitle>
          <CardDescription>Submit campaigns linked to your brand</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Campaign Name" value={campaignForm.campaign_name} onChange={(e) => setCampaignForm((f) => ({ ...f, campaign_name: e.target.value }))} />
          <Input placeholder="Brand ID (internal)" value={campaignForm.brand_id} onChange={(e) => setCampaignForm((f) => ({ ...f, brand_id: e.target.value }))} />
          <Input placeholder="Brand Provider ID (Twilio)" value={campaignForm.brand_provider_id} onChange={(e) => setCampaignForm((f) => ({ ...f, brand_provider_id: e.target.value }))} />
          <Input placeholder="Description" value={campaignForm.description} onChange={(e) => setCampaignForm((f) => ({ ...f, description: e.target.value }))} />
          <Input placeholder="Sample Messages" value={campaignForm.sample_messages} onChange={(e) => setCampaignForm((f) => ({ ...f, sample_messages: e.target.value }))} />
          <Button onClick={submitCampaign} disabled={submittingCampaign}>{submittingCampaign ? "Submitting..." : "Submit Campaign"}</Button>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Submitted Campaigns</p>
            <div className="mt-2 space-y-2">
              {(campaigns || []).map((c) => (
                <div key={c.id} className="rounded border border-border p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{c.campaign_name}</span>
                    <span className="text-muted-foreground">{c.submission_status}</span>
                  </div>
                  <p className="text-muted-foreground">Provider: {c.provider_id || "-"}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
