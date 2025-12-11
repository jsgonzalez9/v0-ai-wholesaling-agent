"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function SequenceLogsPage() {
  const [rows, setRows] = useState<any[]>([])
  useEffect(() => {
    ;(async () => {
      try {
        const resp = await fetch("/api/sequences/logs")
        const j = await resp.json()
        setRows(j.logs || [])
      } catch {}
    })()
  }, [])
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Sequence Logs</CardTitle>
          <CardDescription>Latest 200 sent steps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="rounded border border-border p-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-medium">{r.lead?.name || r.lead_id}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.sent_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{r.sequence?.name || r.sequence_id}</Badge>
                    <Badge variant="outline">{r.type}</Badge>
                    <Badge variant="outline">{r.status}</Badge>
                  </div>
                </div>
                {r.summary && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.summary}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
