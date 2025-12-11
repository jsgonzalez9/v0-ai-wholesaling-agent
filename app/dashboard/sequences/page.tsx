"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function SequencesPage() {
  const [sequences, setSequences] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [steps, setSteps] = useState<any[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [active, setActive] = useState(true)
  const [newStep, setNewStep] = useState({ type: "sms", delay_minutes: 0, message: "", recording_url: "", step_index: 0 })

  async function loadSequences() {
    const resp = await fetch("/api/sequences")
    const j = await resp.json()
    setSequences(j.sequences || [])
    if (!selected && (j.sequences || []).length > 0) setSelected(j.sequences[0])
  }
  async function loadSteps(id: string) {
    const resp = await fetch(`/api/sequences/${id}/steps`)
    const j = await resp.json()
    setSteps(j.steps || [])
  }

  useEffect(() => {
    loadSequences()
  }, [])
  useEffect(() => {
    if (selected?.id) loadSteps(selected.id)
    setName(selected?.name || "")
    setDescription(selected?.description || "")
    setActive(!!selected?.active)
  }, [selected?.id])

  return (
    <div className="p-6 h-full">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Sequences</CardTitle>
            <CardDescription>Create and edit sequences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sequences.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded border border-border p-2">
                  <button className="text-left" onClick={() => setSelected(s)}>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </button>
                  <Badge variant="outline">{s.active ? "active" : "inactive"}</Badge>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                <span>Active</span>
              </div>
              <Button
                onClick={async () => {
                  if (!selected) {
                    const resp = await fetch("/api/sequences", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name, description, active }),
                    })
                    const j = await resp.json()
                    setSelected(j.sequence)
                    loadSequences()
                  } else {
                    await fetch(`/api/sequences/${selected.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name, description, active }),
                    })
                    loadSequences()
                  }
                }}
              >
                {selected ? "Save Sequence" : "Create Sequence"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Steps</CardTitle>
            <CardDescription>Add and reorder steps</CardDescription>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-sm text-muted-foreground">Select or create a sequence</p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  {steps.map((st) => (
                    <div key={st.id} className="flex items-center gap-2 rounded border border-border p-2">
                      <Badge variant="outline">{st.step_index}</Badge>
                      <Badge variant="outline">{st.type}</Badge>
                      <span className="text-xs text-muted-foreground">Delay: {st.delay_minutes}m</span>
                      <span className="text-xs text-muted-foreground flex-1 truncate">
                        {st.type === "sms" ? (st.message || "") : (st.recording_url || "")}
                      </span>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          await fetch(`/api/sequences/steps/${st.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ step_index: st.step_index - 1 }),
                          })
                          loadSteps(selected.id)
                        }}
                      >
                        Up
                      </Button>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          await fetch(`/api/sequences/steps/${st.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ step_index: st.step_index + 1 }),
                          })
                          loadSteps(selected.id)
                        }}
                      >
                        Down
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 rounded border border-border p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Type</label>
                      <select
                        value={newStep.type}
                        onChange={(e) => setNewStep((s) => ({ ...s, type: e.target.value }))}
                        className="w-full rounded border border-border bg-background p-2 text-sm"
                      >
                        <option value="sms">sms</option>
                        <option value="voicemail">voicemail</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Delay (minutes)</label>
                      <Input
                        type="number"
                        value={newStep.delay_minutes}
                        onChange={(e) => setNewStep((s) => ({ ...s, delay_minutes: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Step Index</label>
                      <Input
                        type="number"
                        value={newStep.step_index}
                        onChange={(e) => setNewStep((s) => ({ ...s, step_index: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Recording URL</label>
                      <Input
                        placeholder="For voicemail"
                        value={newStep.recording_url}
                        onChange={(e) => setNewStep((s) => ({ ...s, recording_url: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Message (SMS)</label>
                    <Input
                      placeholder="Hello, just following up…"
                      value={newStep.message}
                      onChange={(e) => setNewStep((s) => ({ ...s, message: e.target.value }))}
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      await fetch(`/api/sequences/${selected.id}/steps`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(newStep),
                      })
                      setNewStep({ type: "sms", delay_minutes: 0, message: "", recording_url: "", step_index: 0 })
                      loadSteps(selected.id)
                    }}
                  >
                    Add Step
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
