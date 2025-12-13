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
    followup_backoff_minutes: (initialConfig as any)?.followup_backoff_minutes?.toString() || "15",
    followup_max_attempts: (initialConfig as any)?.followup_max_attempts?.toString() || "3",
  })
  const [health, setHealth] = useState<Record<string, number>>({})
  const [loadingHealth, setLoadingHealth] = useState(false)

  async function loadHealth() {
    setLoadingHealth(true)
    try {
      const resp = await fetch("/api/sms/health")
      const data = await resp.json()
      if (data.success) setHealth(data.perNumber || {})
    } catch {}
    setLoadingHealth(false)
  }

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
          followup_backoff_minutes: Number.parseInt(config.followup_backoff_minutes),
          followup_max_attempts: Number.parseInt(config.followup_max_attempts),
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
          <div>
            <Label htmlFor="followup_backoff_minutes">Backoff Minutes</Label>
            <Input
              id="followup_backoff_minutes"
              type="number"
              value={config.followup_backoff_minutes}
              onChange={(e) => setConfig((prev) => ({ ...prev, followup_backoff_minutes: e.target.value }))}
              placeholder="15"
            />
            <p className="mt-1 text-sm text-muted-foreground">Minutes to wait before retrying failed follow-up</p>
          </div>
          <div>
            <Label htmlFor="followup_max_attempts">Max Retry Attempts</Label>
            <Input
              id="followup_max_attempts"
              type="number"
              value={config.followup_max_attempts}
              onChange={(e) => setConfig((prev) => ({ ...prev, followup_max_attempts: e.target.value }))}
              placeholder="3"
            />
            <p className="mt-1 text-sm text-muted-foreground">Max retries per follow-up message</p>
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
            <p>TWILIO_NUMBER_POOL=+15551230001,+15551230002,+15551230003</p>
            <p>SMS_MONTHLY_LIMIT_PER_NUMBER=10000</p>
            <p>SMS_RATE_LIMIT_PER_MIN=25</p>
            <p>SMS_QUIET_HOURS_START=8</p>
            <p>SMS_QUIET_HOURS_END=21</p>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Set your Twilio webhook URL to: <code className="rounded bg-muted px-1">/api/twilio/incoming</code>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phone Provider Health</CardTitle>
          <CardDescription>Last-hour sends per number to monitor rate limiting</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={loadHealth} disabled={loadingHealth}>
            {loadingHealth ? "Loading..." : "Load Health"}
          </Button>
          <div className="mt-3 space-y-2 font-mono text-sm">
            {Object.keys(health).length === 0 ? (
              <p className="text-muted-foreground">No data yet</p>
            ) : (
              Object.entries(health).map(([from, count]) => (
                <div key={from} className="flex items-center justify-between">
                  <span>{from}</span>
                  <span>{count}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contract Templates</CardTitle>
          <CardDescription>Upload PDFs to store securely and send via SMS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <input id="tpl-file" type="file" accept="application/pdf" />
            <Input id="tpl-name" placeholder="Template name" />
            <select id="tpl-role" className="rounded border border-border bg-background p-2 text-sm">
              <option value="seller">Seller</option>
              <option value="buyer">Buyer</option>
            </select>
            <Input id="tpl-state" placeholder="State (e.g. TX)" className="w-24" />
            <Button
              variant="outline"
              onClick={async () => {
                const fileInput = document.getElementById("tpl-file") as HTMLInputElement
                const nameInput = document.getElementById("tpl-name") as HTMLInputElement
                const roleInput = document.getElementById("tpl-role") as HTMLSelectElement
                const stateInput = document.getElementById("tpl-state") as HTMLInputElement
                if (!fileInput.files?.[0] || !nameInput.value) {
                  alert("Pick a PDF and enter a name")
                  return
                }
                const form = new FormData()
                form.append("file", fileInput.files[0])
                form.append("name", nameInput.value)
                if (roleInput.value) form.append("role", roleInput.value)
                if (stateInput.value) form.append("state", stateInput.value)
                const resp = await fetch("/api/contracts/templates", { method: "POST", body: form })
                const j = await resp.json()
                if (!resp.ok) {
                  alert(j.error || "Upload failed")
                } else {
                  alert("Template uploaded")
                  fileInput.value = ""
                  nameInput.value = ""
                  stateInput.value = ""
                }
              }}
            >
              Upload
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await fetch("/api/contracts/setup", { method: "POST" })
                alert("Bucket initialized")
              }}
            >
              Initialize Bucket
            </Button>
          </div>
          <div className="mt-2">
            <Button
              variant="ghost"
              onClick={async () => {
                const resp = await fetch("/api/contracts/templates")
                const j = await resp.json()
                const list = Array.isArray(j.templates) ? j.templates : []
                alert(`Templates:\n${list.map((t: any) => `${t.name} (${t.storage_path})`).join("\n") || "none"}`)
              }}
            >
              List Templates
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  )
}
