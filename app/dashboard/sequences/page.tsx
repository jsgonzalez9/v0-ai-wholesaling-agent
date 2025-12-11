"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core"
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

export default function SequencesPage() {
  const [sequences, setSequences] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [steps, setSteps] = useState<any[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [active, setActive] = useState(true)
  const [newStep, setNewStep] = useState({ type: "sms", delay_minutes: 0, message: "", recording_url: "", step_index: 0 })
  const [health, setHealth] = useState<Record<string, any>>({})
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const [activeId, setActiveId] = useState<string | null>(null)

  function SortableStep({ st }: { st: any }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: st.id })
    const style = {
      transform: transform ? CSS.Transform.toString(transform) : undefined,
      transition,
    }
    return (
      <div ref={setNodeRef} style={style} className="flex items-center gap-2 rounded border border-border p-2">
        <span className="cursor-grab" {...attributes} {...listeners}>⋮⋮</span>
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
            if (selected?.id) {
              const resp = await fetch(`/api/sequences/${selected.id}/steps`)
              const j = await resp.json()
              setSteps(j.steps || [])
            }
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
            if (selected?.id) {
              const resp = await fetch(`/api/sequences/${selected.id}/steps`)
              const j = await resp.json()
              setSteps(j.steps || [])
            }
          }}
        >
          Down
        </Button>
      </div>
    )
  }

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
  useEffect(() => {
    ;(async () => {
      try {
        const resp = await fetch("/api/sequences/health")
        const j = await resp.json()
        setHealth(j.health || {})
      } catch {}
    })()
  }, [])

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
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{s.active ? "active" : "inactive"}</Badge>
                    {health[s.id] && (
                      <Badge variant="outline">
                        {health[s.id].disabled > 0
                          ? "Failing"
                          : health[s.id].failing > 0
                            ? "Warning"
                            : "Healthy"}
                      </Badge>
                    )}
                  </div>
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
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={async (evt: any) => {
                      const { active, over } = evt
                      if (!over || active.id === over.id) return
                      const oldIndex = steps.findIndex((s: any) => s.id === active.id)
                      const newIndex = steps.findIndex((s: any) => s.id === over.id)
                      const newOrder = arrayMove(steps, oldIndex, newIndex)
                      setSteps(newOrder)
                      await fetch(`/api/sequences/${selected!.id}/steps/reorder`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderedStepIds: newOrder.map((x: any) => x.id) }),
                      })
                      setActiveId(null)
                    }}
                    onDragStart={(evt: any) => {
                      const { active } = evt
                      setActiveId(String(active.id))
                    }}
                    onDragCancel={() => {
                      setActiveId(null)
                    }}
                  >
                    <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                      {steps.map((st) => (
                        <SortableStep key={st.id} st={st} />
                      ))}
                    </SortableContext>
                    <DragOverlay>
                      {activeId && (() => {
                        const st = steps.find((x) => x.id === activeId)
                        if (!st) return null
                        return (
                          <div className="flex items-center gap-2 rounded border border-border bg-muted p-2 shadow-xl opacity-90">
                            <span className="cursor-grabbing">⋮⋮</span>
                            <Badge variant="outline">{st.step_index}</Badge>
                            <Badge variant="outline">{st.type}</Badge>
                            <span className="text-xs text-muted-foreground">Delay: {st.delay_minutes}m</span>
                            <span className="text-xs text-muted-foreground flex-1 truncate">
                              {st.type === "sms" ? (st.message || "") : (st.recording_url || "")}
                            </span>
                          </div>
                        )
                      })()}
                    </DragOverlay>
                  </DndContext>
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
                  <div className="mt-4 space-y-3">
                    <p className="text-xs text-muted-foreground">Rules per step</p>
                    {steps.map((st) => (
                      <div key={`${st.id}-rules`} className="rounded border border-border p-2">
                        <p className="text-xs">Step {st.step_index} • {st.type}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Inbound reply within (min)</label>
                            <Input
                              type="number"
                              defaultValue={0}
                              onBlur={async (e) => {
                                const minutes = Number(e.target.value || 0)
                                const rules = { action: "skip", conditions: minutes > 0 ? [{ type: "inbound_reply_within", minutes }] : [] }
                                await fetch(`/api/sequences/steps/${st.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rules }) })
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Pipeline status</label>
                            <select
                              multiple
                              className="w-full rounded border border-border bg-background p-2 text-sm"
                              onChange={async (e) => {
                                const options = Array.from(e.target.selectedOptions).map((o) => o.value)
                                const rules = { action: "skip", conditions: [{ type: "pipeline_status_in", statuses: options }] }
                                await fetch(`/api/sequences/steps/${st.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rules }) })
                              }}
                            >
                              <option value="DEAD">DEAD</option>
                              <option value="APPOINTMENT SET">APPOINTMENT SET</option>
                              <option value="HOT">HOT</option>
                              <option value="NEW">NEW</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Lead opted-out</label>
                            <select
                              className="w-full rounded border border-border bg-background p-2 text-sm"
                              onChange={async (e) => {
                                const enabled = e.target.value === "true"
                                const rules = { action: "complete", conditions: enabled ? [{ type: "lead_opted_out" }] : [] }
                                await fetch(`/api/sequences/steps/${st.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rules }) })
                              }}
                            >
                              <option value="false">disabled</option>
                              <option value="true">enabled</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Sentiment high → jump to</label>
                            <Input
                              type="number"
                              defaultValue={st.step_index}
                              onBlur={async (e) => {
                                const jump_to_step_index = Number(e.target.value || 0)
                                const rules = { action: "jump", jump_to_step_index, conditions: [{ type: "sentiment_high" }] }
                                await fetch(`/api/sequences/steps/${st.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rules }) })
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
