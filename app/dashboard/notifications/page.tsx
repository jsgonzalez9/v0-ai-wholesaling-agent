"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

interface LogItem {
  id: string
  message: string
  created_at: string
  meta: any
}

export default function NotificationsPage() {
  const [items, setItems] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const resp = await fetch("/api/notifications/hot")
      const json = await resp.json()
      setItems(json.items || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Recent HOT lead alerts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">No notifications yet</p>
          ) : (
            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.id} className="rounded border border-border p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{it.meta?.name || "Unknown"}</span>
                    <span className="text-muted-foreground">{new Date(it.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-muted-foreground">{it.meta?.address || ""}</p>
                  <p className="text-muted-foreground">Phone: {it.meta?.phone || ""}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
