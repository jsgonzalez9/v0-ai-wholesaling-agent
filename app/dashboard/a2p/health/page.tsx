"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function A2PHealthPage() {
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    ;(async () => {
      try {
        const resp = await fetch("/api/a2p/health")
        const j = await resp.json()
        setData(j)
      } catch {}
    })()
  }, [])
  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>A2P Health</CardTitle>
          <CardDescription>Brand, campaign, and number status</CardDescription>
        </CardHeader>
        <CardContent>
          {!data ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span>Brand</span>
                <Badge variant="outline">{data.brand_status}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Campaigns</p>
                {(data.campaign_statuses || []).map((c: any) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <span className="text-xs">{c.id}</span>
                    <Badge variant="outline">{c.status}</Badge>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Numbers</p>
                {(data.numbers || []).map((n: any) => (
                  <div key={n.number} className="flex items-center gap-4 text-sm">
                    <span>{n.number}</span>
                    <span>Sent: {n.sent}</span>
                    <span>Failed: {n.failed}</span>
                    <span>Blocked: {n.blocked}</span>
                    <span>Cap used: {n.cap_used_pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
