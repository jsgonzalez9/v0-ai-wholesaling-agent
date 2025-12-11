"use client"

import { useEffect, useState } from "react"
 
import type { Lead } from "@/lib/types"

interface FollowUpItem {
  id: string
  lead_id: string
  sequence_number: number
  status: "pending" | "sent" | "skipped" | "completed"
  scheduled_for: string
  sent_at: string | null
}

const FOLLOWUP_MESSAGES = [
  "Hey! Quick question — are you open to an offer on your property?",
  "Just making sure this reached the right person.",
  "No rush — just curious if you'd consider selling?",
  "I can usually give a rough estimate in under 60 seconds.",
  "Have you gotten any offers recently?",
  "Still thinking about selling the place?",
  "Hey, just checking back in — any chance you'd consider an offer?",
  "We've got a few buyers looking in your area.",
  "We're short on properties right now.",
  "We're locking in offers for this month.",
  "If you did sell, what price would make you consider it?",
  "Should I close your file or keep you on the list?",
]

export function FollowUpSequencesView({ lead }: { lead: Lead }) {
  const [sequences, setSequences] = useState<FollowUpItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSequences() {
      try {
        const resp = await fetch(`/api/leads/${lead.id}/followup-sequences`)
        const data = await resp.json()
        setSequences((data.sequences || []) as FollowUpItem[])
      } catch {}
      setLoading(false)
    }

    loadSequences()
  }, [lead.id])

  if (loading) {
    return <div className="text-gray-400">Loading follow-up sequence...</div>
  }

  if (sequences.length === 0) {
    return <div className="text-gray-400 text-sm">No follow-up sequence scheduled</div>
  }

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-foreground">Follow-Up Sequence</h4>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sequences.map((seq) => {
          const message = FOLLOWUP_MESSAGES[seq.sequence_number - 1]
          const scheduledDate = new Date(seq.scheduled_for)
          const statusColor =
            seq.status === "sent"
              ? "bg-green-900 text-green-200"
              : seq.status === "skipped"
                ? "bg-gray-800 text-gray-300"
                : "bg-blue-900 text-blue-200"

          return (
            <div key={seq.id} className="bg-background border border-border rounded p-3 text-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-medium">Message {seq.sequence_number}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>{seq.status}</span>
              </div>
              <p className="text-gray-300 text-xs mb-2">{message}</p>
              <div className="text-xs text-gray-500">
                {seq.status === "sent"
                  ? `Sent: ${new Date(seq.sent_at!).toLocaleDateString()}`
                  : `Scheduled: ${scheduledDate.toLocaleDateString()}`}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
