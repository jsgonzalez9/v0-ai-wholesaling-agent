"use client"

import type { VoiceCall } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, PhoneOutgoing } from "lucide-react"

interface CallHistoryProps {
  calls: VoiceCall[]
}

export function CallHistory({ calls }: CallHistoryProps) {
  if (calls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Call History</CardTitle>
          <CardDescription>No voice calls yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call History</CardTitle>
        <CardDescription>{calls.length} call(s)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {calls.map((call) => (
          <div key={call.id} className="flex items-start justify-between border-b pb-3 last:border-0">
            <div className="flex items-start gap-3">
              {call.call_type === "inbound" ? (
                <Phone className="w-5 h-5 text-blue-500 mt-1" />
              ) : (
                <PhoneOutgoing className="w-5 h-5 text-green-500 mt-1" />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm">{call.call_type === "inbound" ? "Inbound" : "Outbound"} Call</p>
                {call.summary && <p className="text-xs text-gray-500 mt-1">{call.summary}</p>}
                {call.transcript && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{call.transcript}</p>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge
                variant={
                  call.call_status === "completed"
                    ? "default"
                    : call.call_status === "failed" || call.call_status === "no_answer"
                      ? "destructive"
                      : "secondary"
                }
              >
                {call.call_status}
              </Badge>
              {call.sentiment && (
                <Badge
                  variant={
                    call.sentiment === "positive"
                      ? "default"
                      : call.sentiment === "negative"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {call.sentiment}
                </Badge>
              )}
              <p className="text-xs text-gray-500">{new Date(call.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
