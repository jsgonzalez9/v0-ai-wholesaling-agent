"use client"

import { useState, useEffect } from "react"
import type { Lead, Message } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Send,
  Trash2,
  PlayCircle,
  DollarSign,
  Home,
  Clock,
  Target,
  FileText,
  RefreshCw,
  FileSignature,
  CheckCircle,
  Zap,
  Brain,
  Calendar,
} from "lucide-react"
import { Phone } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { FollowUpSequencesView } from "@/components/followup-sequences-view"
import { createSupabaseBrowser } from "@/lib/supabase/client"
import { toast } from "sonner"

interface LeadDetailProps {
  lead: Lead
  onLeadUpdated: (lead: Lead) => void
  onLeadDeleted: (id: string) => void
}

export function LeadDetail({ lead, onLeadUpdated, onLeadDeleted }: LeadDetailProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sendingOutreach, setSendingOutreach] = useState(false)
  const [manualMessage, setManualMessage] = useState("")
  const [sendingManual, setSendingManual] = useState(false)
  const [arv, setArv] = useState(lead.arv?.toString() || "")
  const [repairs, setRepairs] = useState(lead.repair_estimate?.toString() || "")
  const [sendingContract, setSendingContract] = useState(false)
  const [contractRole, setContractRole] = useState<"seller" | "buyer">("seller")
  const [markingSigned, setMarkingSigned] = useState(false)
  const [schedulingSequence, setSchedulingSequence] = useState(false)
  const [sequenceScheduled, setSequenceScheduled] = useState(false)
  const [followReason, setFollowReason] = useState("")
  const [followNextAction, setFollowNextAction] = useState("")
  const [callSummaries, setCallSummaries] = useState<any[]>([])
  const [loadingCalls, setLoadingCalls] = useState(false)
  const [allSequences, setAllSequences] = useState<any[]>([])
  const [selectedSequenceId, setSelectedSequenceId] = useState<string>("")
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [enrollmentSteps, setEnrollmentSteps] = useState<any[]>([])

  useEffect(() => {
    loadMessages()
    setArv(lead.arv?.toString() || "")
    setRepairs(lead.repair_estimate?.toString() || "")
    const supabase = createSupabaseBrowser()
    const channel = supabase
      .channel(`messages_${lead.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `lead_id=eq.${lead.id}` },
        () => {
          loadMessages()
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [lead.id, lead.arv, lead.repair_estimate])

  async function loadMessages() {
    setLoading(true)
    try {
      const resp = await fetch(`/api/leads/${lead.id}/messages`)
      const data = await resp.json()
      const msgs = Array.isArray(data.messages) ? (data.messages as Message[]) : []
      setMessages(msgs)
    } catch {
      setMessages([])
    }
    setLoading(false)
  }

  async function loadCallSummaries() {
    setLoadingCalls(true)
    try {
      const resp = await fetch(`/api/leads/${lead.id}/call-summaries`)
      const data = await resp.json()
      setCallSummaries(Array.isArray(data.summaries) ? data.summaries : [])
    } catch {
      setCallSummaries([])
    }
    setLoadingCalls(false)
  }

  useEffect(() => {
    loadCallSummaries()
  }, [lead.id])

  useEffect(() => {
    ;(async () => {
      try {
        const resp = await fetch("/api/sequences")
        const j = await resp.json()
        setAllSequences(j.sequences || [])
      } catch {}
    })()
  }, [])

  async function loadLeadSequences() {
    try {
      const resp = await fetch(`/api/leads/${lead.id}/sequences`)
      const j = await resp.json()
      setEnrollments(j.enrollments || [])
      setEnrollmentSteps(j.steps || [])
    } catch {
      setEnrollments([])
      setEnrollmentSteps([])
    }
  }

  useEffect(() => {
    loadLeadSequences()
  }, [lead.id])

  async function handleSendOutreach() {
    setSendingOutreach(true)
    try {
      const response = await fetch("/api/send-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      })
      const data = await response.json()
      if (data.success) {
        onLeadUpdated({ ...lead, conversation_state: "contacted" })
        loadMessages()
      } else {
        alert(data.error || "Failed to send outreach")
      }
    } catch (error) {
      console.error("Error sending outreach:", error)
      alert("Failed to send outreach")
    }
    setSendingOutreach(false)
  }

  async function handleSendManual() {
    if (!manualMessage.trim()) return
    setSendingManual(true)
    try {
      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, message: manualMessage }),
      })
      const data = await response.json()
      if (data.success) {
        setManualMessage("")
        loadMessages()
      } else {
        alert(data.error || "Failed to send message")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message")
    }
    setSendingManual(false)
  }

  async function handleUpdateProperty() {
    const arvNum = Number.parseFloat(arv) || null
    const repairsNum = Number.parseFloat(repairs) || null
    let offerAmount = lead.offer_amount

    if (arvNum && repairsNum) {
      offerAmount = arvNum * 0.7 - repairsNum - 10000
    }

    try {
      const resp = await fetch(`/api/leads/${lead.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arv: arvNum,
          repair_estimate: repairsNum,
          offer_amount: offerAmount,
        }),
      })
      const data = await resp.json()
      if (data.success && data.lead) {
        onLeadUpdated(data.lead as Lead)
      } else {
        alert(data.error || "Failed to update")
      }
    } catch (e) {
      alert("Failed to update")
    }
  }

  async function handleSendContract() {
    if (!lead.offer_amount) {
      alert("Please set an offer amount first")
      return
    }
    setSendingContract(true)
    try {
      const response = await fetch("/api/send-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, role: contractRole }),
      })
      const data = await response.json()
      if (data.success) {
        onLeadUpdated({ ...lead, conversation_state: "contract_sent", contract_link: data.contractLink })
        loadMessages()
      } else {
        alert(data.error || "Failed to send contract")
      }
    } catch (error) {
      console.error("Error sending contract:", error)
      alert("Failed to send contract")
    }
    setSendingContract(false)
  }

  async function handleMarkSigned() {
    setMarkingSigned(true)
    try {
      const response = await fetch("/api/mark-signed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      })
      const data = await response.json()
      if (data.success) {
        onLeadUpdated({ ...lead, conversation_state: "contract_signed" })
        loadMessages()
      } else {
        alert(data.error || "Failed to mark as signed")
      }
    } catch (error) {
      console.error("Error marking signed:", error)
      alert("Failed to mark as signed")
    }
    setMarkingSigned(false)
  }

  async function handleScheduleSequence() {
    setSchedulingSequence(true)
    try {
      const resp = await fetch(`/api/followup/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, reason: followReason, next_action: followNextAction }),
      })
      const data = await resp.json()
      if (data.success) {
        setSequenceScheduled(true)
        alert("12-message follow-up sequence scheduled!")
      } else {
        alert(data.error || "Failed to schedule sequence")
      }
    } catch (error) {
      console.error("Error scheduling sequence:", error)
      alert("Failed to schedule sequence")
    }
    setSchedulingSequence(false)
  }

  async function handleDelete() {
    try {
      const resp = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" })
      const data = await resp.json()
      if (data.success) {
        onLeadDeleted(lead.id)
      } else {
        alert(data.error || "Failed to delete")
      }
    } catch {
      alert("Failed to delete")
    }
  }

  const calculatedMAO =
    arv && repairs ? Number.parseFloat(arv) * 0.7 - Number.parseFloat(repairs) - 10000 : null

  const canSendContract = lead.offer_amount && ["offer_accepted", "qualified"].includes(lead.conversation_state)
  const canMarkSigned = lead.conversation_state === "contract_sent"

  function renderModelBadge(msg: Message) {
    if (msg.direction !== "outbound" || !msg.model_used) return null

    const isAdvanced = msg.model_used === "gpt-5"
    return (
      <Badge
        variant="outline"
        className={cn(
          "ml-2 text-xs",
          isAdvanced
            ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
            : "border-primary/50 text-primary bg-primary/10",
        )}
      >
        {isAdvanced ? (
          <>
            <Brain className="mr-1 h-3 w-3" />
            GPT-5
          </>
        ) : (
          <>
            <Zap className="mr-1 h-3 w-3" />
            GPT-5-mini
          </>
        )}
      </Badge>
    )
  }

  async function handleUpdateLeadMeta(partial: Partial<Lead>) {
    try {
      const resp = await fetch(`/api/leads/${lead.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      })
      const data = await resp.json()
      if (data.success && data.lead) {
        onLeadUpdated(data.lead as Lead)
      }
    } catch {}
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{lead.name}</h2>
            <p className="text-sm text-muted-foreground">{lead.address}</p>
            <p className="text-sm text-muted-foreground">{lead.phone_number}</p>
          </div>
          <div className="flex items-center gap-2">
            {lead.conversation_state === "cold_lead" && (
              <Button onClick={handleSendOutreach} disabled={sendingOutreach}>
                <PlayCircle className="mr-2 h-4 w-4" />
                {sendingOutreach ? "Sending..." : "Start Outreach"}
              </Button>
            )}
            {!sequenceScheduled && (
              <Button onClick={handleScheduleSequence} disabled={schedulingSequence} variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                {schedulingSequence ? "Scheduling..." : "Schedule Sequence"}
              </Button>
            )}
            {!sequenceScheduled && (
              <div className="flex items-center gap-2">
                <Input placeholder="Reason" value={followReason} onChange={(e) => setFollowReason(e.target.value)} />
                <Input
                  placeholder="Next action"
                  value={followNextAction}
                  onChange={(e) => setFollowNextAction(e.target.value)}
                />
              </div>
            )}
            {canSendContract && (
              <>
                <select
                  value={contractRole}
                  onChange={(e) => setContractRole(e.target.value as any)}
                  className="rounded border border-border bg-background p-2 text-sm"
                >
                  <option value="seller">Seller</option>
                  <option value="buyer">Buyer</option>
                </select>
                <Button onClick={handleSendContract} disabled={sendingContract} variant="default">
                  <FileSignature className="mr-2 h-4 w-4" />
                  {sendingContract ? "Sending..." : "Send Contract"}
                </Button>
              </>
            )}
            {canMarkSigned && (
              <Button
                onClick={handleMarkSigned}
                disabled={markingSigned}
                variant="outline"
                className="border-success text-success hover:bg-success/10 bg-transparent"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {markingSigned ? "Marking..." : "Mark Signed"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const resp = await fetch("/api/closer/handoff", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ leadId: lead.id }),
                  })
                  const data = await resp.json()
                  if (data.success) {
                    alert("Handoff initiated")
                  } else {
                    alert(data.error || "Failed to handoff")
                  }
                } catch {
                  alert("Failed to handoff")
                }
              }}
            >
              Handoff to Closer
            </Button>
            <a href={`/deals/summary/${lead.id}`} className="inline-flex items-center">
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Deal Summary PDF
              </Button>
            </a>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this lead? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Property Info Grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Home className="h-4 w-4" />
                Condition
              </div>
              <p className="mt-1 font-medium text-foreground">{lead.property_condition || "Unknown"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                Motivation
              </div>
              <p className="mt-1 font-medium text-foreground">{lead.motivation || "Unknown"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Timeline
              </div>
              <p className="mt-1 font-medium text-foreground">{lead.timeline || "Unknown"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Price Expectation
              </div>
              <p className="mt-1 font-medium text-foreground">
                {lead.price_expectation ? `$${lead.price_expectation.toLocaleString()}` : "Unknown"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex flex-1 flex-col border-r border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-medium text-foreground">Conversation</h3>
            <Button variant="ghost" size="sm" onClick={loadMessages}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <p className="text-center text-muted-foreground">Loading...</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-muted-foreground">No messages yet</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      msg.direction === "outbound"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p
                        className={cn(
                          "text-xs",
                          msg.direction === "outbound" ? "text-primary-foreground/70" : "text-muted-foreground",
                        )}
                      >
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                      {renderModelBadge(msg)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Type a manual message..."
                value={manualMessage}
                onChange={(e) => setManualMessage(e.target.value)}
                className="min-h-[60px] resize-none"
              />
              <Button onClick={handleSendManual} disabled={sendingManual || !manualMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Offer Calculator & Follow-ups */}
        <div className="w-80 overflow-y-auto p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lead Details</CardTitle>
              <CardDescription>Edit status, tags, score</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Tags comma-separated"
                  defaultValue={(lead.tags || []).join(",")}
                  onBlur={(e) =>
                    handleUpdateLeadMeta({
                      tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                    })
                  }
                />
                <Input
                  placeholder="Score 0-5"
                  type="number"
                  defaultValue={lead.score || 0}
                  onBlur={(e) => handleUpdateLeadMeta({ score: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Pipeline Status (NEW/WARM/HOT/DEAD/FOLLOW-UP)"
                  defaultValue={lead.pipeline_status || "NEW"}
                  onBlur={(e) => handleUpdateLeadMeta({ pipeline_status: e.target.value as any })}
                />
                <Input placeholder="Notes" defaultValue={lead.notes || ""} onBlur={(e) => handleUpdateLeadMeta({ notes: e.target.value })} />
              </div>
              <div className="mt-2">
                <iframe
                  title="map"
                  className="h-48 w-full rounded border border-border"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(lead.address)}&output=embed`}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Offer Calculator</CardTitle>
              <CardDescription>MAO = (ARV x 0.7) - Repairs - Fee</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const prevArv = lead.arv
                      const prevOffer = lead.offer_amount
                      const resp = await fetch("/api/property/value/combined", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ address: lead.address }),
                      })
                      const data = await resp.json()
                      if (data.success && typeof data.estimate === "number") {
                        const newArv = Math.round(data.estimate)
                        setArv(String(newArv))
                        const repairsNum = Number.parseFloat(repairs) || 0
                        const offerAmount = newArv * 0.7 - repairsNum - 10000
                        const updateResp = await fetch(`/api/leads/${lead.id}/update`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            arv: newArv,
                            offer_amount: offerAmount,
                          }),
                        })
                        const updateData = await updateResp.json()
                        if (updateData.success && updateData.lead) {
                          onLeadUpdated(updateData.lead as Lead)
                          toast("ARV updated", {
                            action: {
                              label: "Undo",
                              onClick: async () => {
                                const revertResp = await fetch(`/api/leads/${lead.id}/update`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    arv: prevArv,
                                    offer_amount: prevOffer,
                                  }),
                                })
                                const revertData = await revertResp.json()
                                if (revertData.success && revertData.lead) {
                                  onLeadUpdated(revertData.lead as Lead)
                                  setArv(prevArv ? String(prevArv) : "")
                                }
                              },
                            },
                          })
                        }
                      } else {
                        alert(data.error || "Lookup failed")
                      }
                    } catch {
                      alert("Lookup failed")
                    }
                  }}
                >
                  Lookup Value
                </Button>
                <Button variant="outline" onClick={() => setRepairs(String(Math.round(Number(arv || "0") * 0.08)))}>Light</Button>
                <Button variant="outline" onClick={() => setRepairs(String(Math.round(Number(arv || "0") * 0.15)))}>Medium</Button>
                <Button variant="outline" onClick={() => setRepairs(String(Math.round(Number(arv || "0") * 0.25)))}>Heavy</Button>
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">ARV (After Repair Value)</label>
                <Input type="number" placeholder="e.g. 200000" value={arv} onChange={(e) => setArv(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Estimated Repairs</label>
                <Input
                  type="number"
                  placeholder="e.g. 30000"
                  value={repairs}
                  onChange={(e) => setRepairs(e.target.value)}
                />
              </div>
              {calculatedMAO !== null && (
                <div className="rounded-lg bg-primary/10 p-4">
                  <p className="text-sm text-muted-foreground">Calculated MAO</p>
                  <p className="text-2xl font-bold text-primary">${calculatedMAO.toLocaleString()}</p>
                </div>
              )}
              <Button className="w-full" onClick={handleUpdateProperty} disabled={!arv || !repairs}>
                Save & Update Offer
              </Button>
              {lead.offer_amount && (
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">Current Offer</p>
                  <p className="text-xl font-semibold text-foreground">${lead.offer_amount.toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Follow-Up Sequence
              </CardTitle>
              <CardDescription>12-message automated sequence</CardDescription>
            </CardHeader>
            <CardContent>
              <FollowUpSequencesView lead={lead} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Follow-Up Sequences (Builder)
              </CardTitle>
              <CardDescription>Enroll in a custom sequence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <select
                  value={selectedSequenceId}
                  onChange={(e) => setSelectedSequenceId(e.target.value)}
                  className="w-full rounded border border-border bg-background p-2 text-sm"
                >
                  <option value="">Select sequence</option>
                  {allSequences.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!selectedSequenceId) return
                    await fetch(`/api/leads/${lead.id}/sequences`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ sequenceId: selectedSequenceId }),
                    })
                    loadLeadSequences()
                  }}
                >
                  Enroll Lead
                </Button>
              </div>
              {enrollments.length > 0 && (
                <div className="rounded border border-border p-2">
                  <p className="text-xs text-muted-foreground">
                    Active: {enrollments[0].sequence_id} • Step {enrollments[0].current_step_index} • Next{" "}
                    {enrollments[0].next_run_at ? new Date(enrollments[0].next_run_at).toLocaleString() : "-"}
                  </p>
                  <div className="mt-2 space-y-1">
                    {enrollmentSteps.map((st) => (
                      <div key={st.id} className="text-xs text-muted-foreground">
                        Step {st.step_index} • {st.status} • {new Date(st.sent_at).toLocaleString()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="h-4 w-4" />
                Call Summaries
              </CardTitle>
              <CardDescription>Latest recorded calls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingCalls ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : callSummaries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No call summaries</p>
              ) : (
                callSummaries.map((s) => (
                  <div key={s.id} className="rounded border border-border p-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline">{s.sentiment}</Badge>
                      <Badge variant="outline">{s.intent}</Badge>
                      <span>Urgency: {s.urgency ?? 0}</span>
                      {typeof s.motivation === "number" && <span>Motivation: {s.motivation}</span>}
                    </div>
                    {s.summary && <p className="mt-1 text-sm">{s.summary}</p>}
                    <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                      {s.objections && <p>Objections: {s.objections}</p>}
                      {s.pain_points && <p>Pain: {s.pain_points}</p>}
                      {s.decision_maker && <p>Decision Maker: {s.decision_maker}</p>}
                      {s.next_action && <p>Next: {s.next_action}</p>}
                    </div>
                    {s.recording_url && (
                      <a href={s.recording_url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs text-primary">
                        Recording
                      </a>
                    )}
                  </div>
                ))
              )}
              <Button variant="ghost" onClick={loadCallSummaries}>Refresh</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-4 w-4" />
                AI Model Routing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await fetch("/api/conversations/summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: lead.id }) })
                    alert("Summary generated")
                  } catch {
                    alert("Failed to generate summary")
                  }
                }}
              >
                Generate Conversation Summary
              </Button>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10">
                  <Zap className="mr-1 h-3 w-3" />
                  GPT-5-mini
                </Badge>
                <span className="text-muted-foreground">Qualification</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-500/10">
                  <Brain className="mr-1 h-3 w-3" />
                  GPT-5
                </Badge>
                <span className="text-muted-foreground">Negotiation</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Auto-escalates on objections, counteroffers, or agreement signals.
              </p>
            </CardContent>
          </Card>

          {lead.contract_link && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileSignature className="h-4 w-4" />
                  Contract
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-sm text-muted-foreground">
                  Status: {lead.conversation_state === "contract_signed" ? "Signed" : "Sent"}
                </p>
                <a
                  href={lead.contract_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View Contract Link
                </a>
              </CardContent>
            </Card>
          )}

          {lead.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{lead.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
