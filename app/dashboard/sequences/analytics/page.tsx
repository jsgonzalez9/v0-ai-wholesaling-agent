"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts"

export default function SequenceAnalyticsPage() {
  const [data, setData] = useState<Record<string, any>>({})
  useEffect(() => {
    ;(async () => {
      try {
        const resp = await fetch("/api/sequences/analytics")
        const j = await resp.json()
        setData(j.analytics || {})
      } catch {}
    })()
  }, [])
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Sequence Analytics</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(data).map(([seqId, stats]) => (
              <div key={seqId} className="rounded border border-border p-2 text-sm">
                <p className="font-medium">Sequence {(stats as any).name || seqId}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="h-40">
                    <ResponsiveContainer>
                      <BarChart data={[{ label: "Sent", value: (stats as any).sent }, { label: "Delivered", value: (stats as any).queued }, { label: "Replied", value: (stats as any).responses }]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#4ade80" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-40">
                    <ResponsiveContainer>
                      <LineChart data={Object.entries((stats as any).timeline || {}).map(([day, count]) => ({ day, count }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#60a5fa" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-40">
                    <ResponsiveContainer>
                      <BarChart data={(stats as any).bestTemplates || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="message" hide />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="replyRate" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <span>Response Rate: {(stats as any).responseRate}</span>{" "}
                  <span className="ml-2">Avg Time-To-First-Response: {(stats as any).avgTimeToFirstResponse ?? "-"} min</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
