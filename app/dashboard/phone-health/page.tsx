"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PhoneHealthPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Record<string, number>>({})

  async function load() {
    setLoading(true)
    try {
      const resp = await fetch("/api/sms/health")
      const json = await resp.json()
      setData(json.perNumber || {})
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
          <CardTitle>Phone Number Health Monitor</CardTitle>
          <CardDescription>Last-hour sends per number to watch rate limiting and pool distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={load} disabled={loading}>{loading ? "Loading..." : "Refresh"}</Button>
          <div className="mt-4 space-y-2 font-mono text-sm">
            {Object.keys(data).length === 0 ? (
              <p className="text-muted-foreground">No data yet</p>
            ) : (
              Object.entries(data).map(([from, count]) => (
                <div key={from} className="flex items-center justify-between">
                  <span>{from}</span>
                  <span>{count}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
