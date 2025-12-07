"use client"

import { useState, useEffect } from "react"
import type { Lead, Message } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"
import { getLeadMessages, updateLead, deleteLead } from "@/lib/lead-actions"
import { calculateMAO } from "@/lib/wholesaling-agent"
import { scheduleFollowUpSequence } from "@/lib/followup-sequences"
import { FollowUpSequencesView } from "@/components/followup-sequences-view"

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
  const [markingSigned, setMarkingSigned] = useState(false)
  const [schedulingSequence, setSchedulingSequence] = useState(false)
  const [sequenceScheduled, setSequenceScheduled] = useState(false)

  useEffect(() => {
    loadMessages()
    setArv(lead.arv?.toString() || "")
    setRepairs(lead.repair_estimate?.toString() || "")
  }, [lead.id, lead.arv, lead.repair_estimate])

  async function loadMessages() {
    setLoading(true)
    const msgs = await getLeadMessages(lead.id)
    setMessages(msgs)
    setLoading(false)
  }

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
      offerAmount = calculateMAO(arvNum, repairsNum, 10000, 0.7)
    }

    const { lead: updatedLead, error } = await updateLead(lead.id, {
      arv: arvNum,
      repair_estimate: repairsNum,
      offer_amount: offerAmount,
    })

    if (updatedLead) {
      onLeadUpdated(updatedLead)
    } else {
      alert(error || "Failed to update")
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
        body: JSON.stringify({ leadId: lead.id }),
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
      const result = await scheduleFollowUpSequence(lead.id)
      if (result.success) {
        setSequenceScheduled(true)
        alert("12-message follow-up sequence scheduled!")
      } else {
        alert(result.error || "Failed to schedule sequence")
      }
    } catch (error) {
      console.error("Error scheduling sequence:", error)
      alert("Failed to schedule sequence")
    }
    setSchedulingSequence(false)
  }

  async function handleDelete() {
    const { error } = await deleteLead(lead.id)
    if (!error) {
      onLeadDeleted(lead.id)
    } else {
      alert(error)
    }
  }

  const calculatedMAO =
    arv && repairs ? calculateMAO(Number.parseFloat(arv), Number.parseFloat(repairs), 10000, 0.7) : null

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
            {canSendContract && (
              <Button onClick={handleSendContract} disabled={sendingContract} variant="default">
                <FileSignature className="mr-2 h-4 w-4" />
                {sendingContract ? "Sending..." : "Send Contract"}
              </Button>
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
              <CardTitle className="text-base">Offer Calculator</CardTitle>
              <CardDescription>MAO = (ARV x 0.7) - Repairs - Fee</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Brain className="h-4 w-4" />
                AI Model Routing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
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
