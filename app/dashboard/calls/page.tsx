"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function CallsDashboardPage() {
  const [calls, setCalls] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    sentiment: "",
    minMotivation: "",
    decisionMaker: "",
    hasObjections: "",
    leadQuery: "",
  })

  async function loadCalls() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("limit", "100")
      if (filters.sentiment) params.set("sentiment", filters.sentiment)
      if (filters.minMotivation) params.set("minMotivation", filters.minMotivation)
      if (filters.decisionMaker) params.set("decisionMaker", filters.decisionMaker)
      if (filters.hasObjections) params.set("hasObjections", filters.hasObjections)
      const resp = await fetch(`/api/calls/recent?${params.toString()}`)
      const data = await resp.json()
      const arr = Array.isArray(data.calls) ? data.calls : []
      const filteredByLead =
        filters.leadQuery.trim().length > 0
          ? arr.filter((c: any) => {
              const l = c.lead || {}
              const q = filters.leadQuery.toLowerCase()
              return (
                String(l.name || "").toLowerCase().includes(q) ||
                String(l.address || "").toLowerCase().includes(q) ||
                String(l.phone_number || "").includes(filters.leadQuery)
              )
            })
          : arr
      setCalls(filteredByLead)
      setSelected(filteredByLead[0] || null)
    } catch {
      setCalls([])
      setSelected(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCalls()
  }, [filters.sentiment, filters.minMotivation, filters.decisionMaker, filters.hasObjections, filters.leadQuery])

  const sentiments = useMemo(() => ["positive", "neutral", "negative"], [])

  return (
    <div className="p-6 h-full">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Calls</CardTitle>
            <CardDescription>Latest 100 recorded calls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Sentiment</label>
                  <select
                    value={filters.sentiment}
                    onChange={(e) => setFilters((f) => ({ ...f, sentiment: e.target.value }))}
                    className="w-full rounded border border-border bg-background p-2 text-sm"
                  >
                    <option value="">Any</option>
                    {sentiments.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Min Motivation</label>
                  <Input
                    type="number"
                    placeholder="0–5"
                    value={filters.minMotivation}
                    onChange={(e) => setFilters((f) => ({ ...f, minMotivation: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Decision Maker</label>
                  <select
                    value={filters.decisionMaker}
                    onChange={(e) => setFilters((f) => ({ ...f, decisionMaker: e.target.value }))}
                    className="w-full rounded border border-border bg-background p-2 text-sm"
                  >
                    <option value="">Any</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Objections</label>
                  <select
                    value={filters.hasObjections}
                    onChange={(e) => setFilters((f) => ({ ...f, hasObjections: e.target.value }))}
                    className="w-full rounded border border-border bg-background p-2 text-sm"
                  >
                    <option value="">Any</option>
                    <option value="true">Has</option>
                    <option value="false">None</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Lead Filter</label>
                <Input
                  placeholder="Name, address, or phone"
                  value={filters.leadQuery}
                  onChange={(e) => setFilters((f) => ({ ...f, leadQuery: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : calls.length === 0 ? (
                <p className="text-sm text-muted-foreground">No calls</p>
              ) : (
                <div className="space-y-2">
                  {calls.map((c) => (
                    <div
                      key={c.id}
                      className="cursor-pointer rounded border border-border p-2 hover:bg-muted/50"
                      onClick={() => setSelected(c)}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-foreground">{c.lead?.name || "Unknown lead"}</p>
                          <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{c.sentiment || "neutral"}</Badge>
                          <Badge variant="outline">{c.intent || "unknown"}</Badge>
                          {typeof c.urgency === "number" && <span className="text-xs">Urgency: {c.urgency}</span>}
                          {typeof c.motivation === "number" && <span className="text-xs">Motivation: {c.motivation}</span>}
                        </div>
                      </div>
                      {c.summary && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.summary}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Audio and insights</CardDescription>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-sm text-muted-foreground">Select a call</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <a href={`/dashboard?lead=${selected.lead_id}`} className="text-sm text-primary hover:underline">
                    {selected.lead?.name || selected.lead_id}
                  </a>
                  <Badge variant="outline">{selected.sentiment}</Badge>
                  <Badge variant="outline">{selected.intent}</Badge>
                </div>
                {selected.recording_url && (
                  <audio controls src={selected.recording_url} className="w-full">
                    Your browser does not support the audio element.
                  </audio>
                )}
                {selected.summary && <p className="text-sm">{selected.summary}</p>}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {typeof selected.urgency === "number" && <p>Urgency: {selected.urgency}</p>}
                  {typeof selected.motivation === "number" && <p>Motivation: {selected.motivation}</p>}
                  {selected.decision_maker && <p>Decision Maker: {selected.decision_maker}</p>}
                  {selected.objections && <p>Objections: {selected.objections}</p>}
                  {selected.pain_points && <p>Pain: {selected.pain_points}</p>}
                  {selected.next_action && <p>Next: {selected.next_action}</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
