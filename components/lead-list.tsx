"use client"

import type { Lead, ConversationState } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Search, MapPin, Phone } from "lucide-react"

interface LeadListProps {
  leads: Lead[]
  selectedLead: Lead | null
  onSelectLead: (lead: Lead) => void
}

const stateColors: Record<ConversationState, string> = {
  cold_lead: "bg-muted text-muted-foreground",
  contacted: "bg-blue-500/10 text-blue-500",
  qualified: "bg-primary/10 text-primary",
  offer_made: "bg-warning/10 text-warning",
  offer_accepted: "bg-success/10 text-success",
  contract_sent: "bg-purple-500/10 text-purple-500",
  contract_signed: "bg-success/10 text-success",
  closed: "bg-success/10 text-success",
  lost: "bg-destructive/10 text-destructive",
}

const stateLabels: Record<ConversationState, string> = {
  cold_lead: "Cold",
  contacted: "Contacted",
  qualified: "Qualified",
  offer_made: "Offer Made",
  offer_accepted: "Accepted",
  contract_sent: "Contract Sent",
  contract_signed: "Signed",
  closed: "Closed",
  lost: "Lost",
}

export function LeadList({ leads, selectedLead, onSelectLead }: LeadListProps) {
  const [search, setSearch] = useState("")

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
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredLeads.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No leads found</p>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => onSelectLead(lead)}
              className={cn(
                "cursor-pointer border-b border-border p-4 transition-colors hover:bg-muted/50",
                selectedLead?.id === lead.id && "bg-muted",
              )}
            >
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-medium text-foreground">{lead.name}</h3>
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
    </div>
  )
}
