"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  cookies: {
    getAll: async () => (await cookies()).getAll(),
    setAll: async (cookiesToSet) => {
      const cookieStore = await cookies()
      cookiesToSet.forEach(({ name, value, options }) => {
        cookieStore.set(name, value, options)
      })
    },
  },
})

export interface VoiceCall {
  id: string
  lead_id: string
  call_type: "inbound" | "outbound"
  call_status: string
  twilio_call_sid: string | null
  duration_seconds: number | null
  transcript: string | null
  summary: string | null
  offer_discussed: boolean
  offer_amount: number | null
  next_steps: string | null
  sentiment: string | null
  created_at: string
  updated_at: string
}

export async function createCall(leadId: string, callType: "inbound" | "outbound"): Promise<VoiceCall | null> {
  try {
    const { data, error } = await supabase.from("calls").insert({
      lead_id: leadId,
      call_type: callType,
      call_status: "pending",
    })

    if (error) {
      console.error("[Voice Calls] Create error:", error)
      return null
    }

    return data ? data[0] : null
  } catch (error) {
    console.error("[Voice Calls] Unexpected error:", error)
    return null
  }
}

export async function updateCall(callId: string, updates: Partial<VoiceCall>): Promise<VoiceCall | null> {
  try {
    const { data, error } = await supabase.from("calls").update(updates).eq("id", callId).select()

    if (error) {
      console.error("[Voice Calls] Update error:", error)
      return null
    }

    return data ? data[0] : null
  } catch (error) {
    console.error("[Voice Calls] Unexpected error:", error)
    return null
  }
}

export async function getCallsByLead(leadId: string): Promise<VoiceCall[]> {
  try {
    const { data, error } = await supabase
      .from("calls")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Voice Calls] Get error:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[Voice Calls] Unexpected error:", error)
    return []
  }
}

export async function addCallEvent(callId: string, eventType: string, eventData: any): Promise<void> {
  try {
    await supabase.from("call_events").insert({
      call_id: callId,
      event_type: eventType,
      event_data: eventData,
    })
  } catch (error) {
    console.error("[Call Events] Error:", error)
  }
}

export async function triggerVoiceCall(
  leadId: string,
  callIntentStatus: string,
  scheduledTime?: string,
): Promise<void> {
  try {
    // Create a pending call record
    const call = await createCall(leadId, "outbound")

    if (!call) {
      console.error(`[Voice Call] Failed to create call record for lead: ${leadId}`)
      return
    }

    // Log the call intent event
    await addCallEvent(call.id, "call_intent_detected", {
      intent_status: callIntentStatus,
      scheduled_time: scheduledTime,
      triggered_at: new Date().toISOString(),
    })

    console.log(`[Voice Call Triggered] Call ID: ${call.id}, Lead ID: ${leadId}, Status: ${callIntentStatus}`)

    // If scheduled for later, you could implement a scheduling system here
    // For now, mark as pending and let the voice agent handle the outbound call
    if (scheduledTime) {
      await addCallEvent(call.id, "call_scheduled", {
        scheduled_time: scheduledTime,
      })
    } else if (callIntentStatus === "warm_call_requested" || callIntentStatus === "ready_for_offer_call") {
      // Immediately initiate the call via Twilio
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/twilio/voice/outbound`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              leadId,
              callIntentStatus,
            }),
          },
        )

        if (!response.ok) {
          console.error(`[Voice Call] Outbound call API failed:`, await response.text())
        }
      } catch (error) {
        console.error(`[Voice Call] Error initiating outbound call:`, error)
      }
    }
  } catch (error) {
    console.error(`[Voice Call] Error triggering voice call for lead ${leadId}:`, error)
  }
}
