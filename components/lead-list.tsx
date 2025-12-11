"use client"

import type { Lead, ConversationState } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Search, MapPin, Phone } from "lucide-react"

interface LeadListProps {
  leads: Lead[]
  selectedLead: Lead | null
  onSelectLead: (lead: Lead) => void
}

const stateColors: Partial<Record<ConversationState, string>> = {
  cold_lead: "bg-muted text-muted-foreground",
  contacted: "bg-blue-500/10 text-blue-500",
  qualified: "bg-primary/10 text-primary",
  offer_made: "bg-warning/10 text-warning",
  offer_accepted: "bg-success/10 text-success",
  contract_sent: "bg-purple-500/10 text-purple-500",
  contract_signed: "bg-success/10 text-success",
  closed: "bg-success/10 text-success",
  lost: "bg-destructive/10 text-destructive",
  warm_call_requested: "bg-orange-500/10 text-orange-500",
  schedule_call: "bg-teal-500/10 text-teal-500",
  ready_for_offer_call: "bg-emerald-500/10 text-emerald-500",
  text_only: "bg-gray-500/10 text-gray-500",
}

const stateLabels: Partial<Record<ConversationState, string>> = {
  cold_lead: "Cold",
  contacted: "Contacted",
  qualified: "Qualified",
  offer_made: "Offer Made",
  offer_accepted: "Accepted",
  contract_sent: "Contract Sent",
  contract_signed: "Signed",
  closed: "Closed",
  lost: "Lost",
  warm_call_requested: "Call Requested",
  schedule_call: "Scheduled Call",
  ready_for_offer_call: "Offer Call",
  text_only: "Text Only",
}

export function LeadList({ leads, selectedLead, onSelectLead }: LeadListProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [bulkMessage, setBulkMessage] = useState("")

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.address.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone_number.includes(search),
  )

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Pipeline filter: NEW/WARM/HOT/FOLLOW-UP"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredLeads.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No leads found</p>
          </div>
        ) : (
          filteredLeads
            .filter((l) => (statusFilter ? (l.pipeline_status || "").toLowerCase() === statusFilter.toLowerCase() : true))
            .map((lead) => (
            <div
              key={lead.id}
              className={cn(
                "cursor-pointer border-b border-border p-4 transition-colors hover:bg-muted/50",
                selectedLead?.id === lead.id && "bg-muted",
              )}
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!selected[lead.id]}
                    onChange={(e) => setSelected((prev) => ({ ...prev, [lead.id]: e.target.checked }))}
                  />
                  <h3 className="font-medium text-foreground" onClick={() => onSelectLead(lead)}>{lead.name}</h3>
                </div>
                <Badge variant="secondary" className={cn("text-xs", stateColors[lead.conversation_state])}>
                  {stateLabels[lead.conversation_state]}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{lead.address}</span>
                </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <span>{lead.phone_number}</span>
              </div>
              {lead.pipeline_status && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{lead.pipeline_status}</Badge>
                  {typeof lead.score === "number" && <span className="text-xs">Score: {lead.score}</span>}
                </div>
              )}
            </div>
            {lead.last_message_at && (
              <p className="mt-2 text-xs text-muted-foreground">
                Last activity: {new Date(lead.last_message_at).toLocaleDateString()}
              </p>
              )}
            </div>
          ))
        )}
      </div>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <Input placeholder="Bulk message" value={bulkMessage} onChange={(e) => setBulkMessage(e.target.value)} />
          <Button
            variant="outline"
            onClick={async () => {
              const ids = Object.keys(selected).filter((id) => selected[id])
              if (ids.length === 0) return
              await fetch("/api/leads/bulk/actions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "bulk_sms", leadIds: ids, payload: { message: bulkMessage } }),
              })
              setBulkMessage("")
            }}
          >
            Send SMS
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              const ids = Object.keys(selected).filter((id) => selected[id])
              if (ids.length === 0) return
              await fetch("/api/leads/bulk/actions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "assign_closer", leadIds: ids }),
              })
              alert("Assigned to closer")
            }}
          >
            Assign to Closer
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              const ids = Object.keys(selected).filter((id) => selected[id])
              if (ids.length === 0) return
              await fetch("/api/leads/bulk/actions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "schedule_followup", leadIds: ids }),
              })
              alert("Follow-ups scheduled")
            }}
          >
            Schedule Follow-ups
          </Button>
        </div>
      </div>
    </div>
  )
}
