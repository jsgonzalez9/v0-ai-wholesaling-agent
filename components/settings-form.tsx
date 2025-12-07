"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { AgentConfig } from "@/lib/types"

interface SettingsFormProps {
  initialConfig: AgentConfig | null
}

export function SettingsForm({ initialConfig }: SettingsFormProps) {
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    company_name: initialConfig?.company_name || "CashBuyer Properties",
    wholesaling_fee: initialConfig?.wholesaling_fee?.toString() || "10000",
    arv_multiplier: initialConfig?.arv_multiplier?.toString() || "0.70",
    follow_up_hours: initialConfig?.follow_up_hours?.toString() || "24",
    max_follow_ups: initialConfig?.max_follow_ups?.toString() || "3",
  })

  async function handleSave() {
    setSaving(true)
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: config.company_name,
          wholesaling_fee: Number.parseFloat(config.wholesaling_fee),
          arv_multiplier: Number.parseFloat(config.arv_multiplier),
          follow_up_hours: Number.parseInt(config.follow_up_hours),
          max_follow_ups: Number.parseInt(config.max_follow_ups),
        }),
      })
      const data = await response.json()
      if (data.success) {
        alert("Settings saved!")
      } else {
        alert(data.error || "Failed to save")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Failed to save settings")
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Configure your company name used in SMS messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={config.company_name}
              onChange={(e) => setConfig((prev) => ({ ...prev, company_name: e.target.value }))}
              placeholder="Your Company Name"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Offer Calculation</CardTitle>
          <CardDescription>Configure the MAO formula parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="arv_multiplier">ARV Multiplier</Label>
            <Input
              id="arv_multiplier"
              type="number"
              step="0.01"
              value={config.arv_multiplier}
              onChange={(e) => setConfig((prev) => ({ ...prev, arv_multiplier: e.target.value }))}
              placeholder="0.70"
            />
            <p className="mt-1 text-sm text-muted-foreground">Typically 0.70 (70%) for wholesaling</p>
          </div>
          <div>
            <Label htmlFor="wholesaling_fee">Wholesaling Fee ($)</Label>
            <Input
              id="wholesaling_fee"
              type="number"
              value={config.wholesaling_fee}
              onChange={(e) => setConfig((prev) => ({ ...prev, wholesaling_fee: e.target.value }))}
              placeholder="10000"
            />
            <p className="mt-1 text-sm text-muted-foreground">Your assignment fee deducted from MAO</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Follow-up Settings</CardTitle>
          <CardDescription>Configure automated follow-up behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="follow_up_hours">Follow-up Delay (hours)</Label>
            <Input
              id="follow_up_hours"
              type="number"
              value={config.follow_up_hours}
              onChange={(e) => setConfig((prev) => ({ ...prev, follow_up_hours: e.target.value }))}
              placeholder="24"
            />
            <p className="mt-1 text-sm text-muted-foreground">Hours to wait before sending follow-up</p>
          </div>
          <div>
            <Label htmlFor="max_follow_ups">Max Follow-ups</Label>
            <Input
              id="max_follow_ups"
              type="number"
              value={config.max_follow_ups}
              onChange={(e) => setConfig((prev) => ({ ...prev, max_follow_ups: e.target.value }))}
              placeholder="3"
            />
            <p className="mt-1 text-sm text-muted-foreground">Maximum follow-up messages per lead</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Twilio Configuration</CardTitle>
          <CardDescription>Add these environment variables to enable SMS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4 font-mono text-sm">
            <p>TWILIO_ACCOUNT_SID=your_account_sid</p>
            <p>TWILIO_AUTH_TOKEN=your_auth_token</p>
            <p>TWILIO_PHONE_NUMBER=+1234567890</p>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Set your Twilio webhook URL to: <code className="rounded bg-muted px-1">/api/twilio/incoming</code>
          </p>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  )
}
