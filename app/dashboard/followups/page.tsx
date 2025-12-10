"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function FollowupsAdminPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const resp = await fetch("/api/followup/pending")
      const json = await resp.json()
      setItems(json.items || [])
    } catch {}
    setLoading(false)
  }

  async function runBatch() {
    setRunning(true)
    try {
      const resp = await fetch("/api/followup/send-pending", { method: "POST" })
      await resp.json()
      await load()
    } catch {}
    setRunning(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Follow-up Queue</CardTitle>
          <CardDescription>Pending messages with retry/backoff</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={load} variant="outline" disabled={loading}>{loading ? "Loading..." : "Refresh"}</Button>
            <Button onClick={runBatch} disabled={running}>{running ? "Running..." : "Run Batch"}</Button>
          </div>
          <div className="mt-4 space-y-2">
            {items.length === 0 ? (
              <p className="text-muted-foreground">No pending follow-ups</p>
            ) : (
              items.map((it) => (
                <div key={it.id} className="rounded border border-border p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{it.leads?.name || "Unknown"}</span>
                    <span className="text-muted-foreground">#{it.sequence_number}</span>
                  </div>
                  <div className="text-muted-foreground">
                    <p>Phone: {it.leads?.phone_number}</p>
                    <p>Scheduled: {new Date(it.scheduled_for).toLocaleString()}</p>
                    <p>Attempts: {it.attempts} {it.next_attempt_at ? `(next at ${new Date(it.next_attempt_at).toLocaleString()})` : ""}</p>
                    {it.error_last && <p className="text-red-400">Last error: {it.error_last}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
