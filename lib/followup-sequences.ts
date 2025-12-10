"use server"

import { createClient } from "@/lib/supabase/server"

// 12-message SMS follow-up sequence for wholesaling
const FOLLOWUP_MESSAGES = [
  {
    day: 0,
    message: "Hey! Quick question — are you open to an offer on your property at [ADDRESS]?",
  },
  {
    day: 1,
    message: "Just making sure this reached the right person. If not, sorry about that!",
  },
  {
    day: 2,
    message: "No rush — just curious if you'd consider selling if the price made sense?",
  },
  {
    day: 4,
    message: "I can usually give a rough estimate in under 60 seconds if you want one.",
  },
  {
    day: 7,
    message: "Have you gotten any offers recently? Just trying to see where things stand.",
  },
  {
    day: 10,
    message: "Still thinking about selling the place? Totally fine either way.",
  },
  {
    day: 15,
    message: "Hey, just checking back in — any chance you'd consider an offer this month?",
  },
  {
    day: 21,
    message: "We've got a few buyers looking in your area specifically — want me to see what they'd pay?",
  },
  {
    day: 30,
    message: "Just a heads up: we're short on properties right now. Could move fast if you're interested.",
  },
  {
    day: 38,
    message: "We're locking in offers for this month. Want me to run your place through?",
  },
  {
    day: 45,
    message: "Out of curiosity… if you did sell, what price would make you consider it?",
  },
  {
    day: 52,
    message: "Should I close your file or keep you on the list in case something opens up? Either is fine.",
  },
]

export async function scheduleFollowUpSequence(leadId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // Get the lead
    const { data: lead, error: leadError } = await supabase.from("leads").select("*").eq("id", leadId).single()

    if (leadError || !lead) {
      return { success: false, error: "Lead not found" }
    }

    // Create follow-up sequence entries for all 12 messages
    const sequenceEntries = FOLLOWUP_MESSAGES.map((msg, index) => {
      const scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + msg.day)
      scheduledDate.setHours(9, 0, 0, 0) // Schedule for 9 AM

      return {
        lead_id: leadId,
        sequence_number: index + 1,
        scheduled_for: scheduledDate.toISOString(),
        status: "pending",
        attempts: 0,
        next_attempt_at: null,
      }
    })

    const { error: insertError } = await supabase.from("follow_up_sequences").insert(sequenceEntries)

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function getPendingFollowUps(limit = 50): Promise<
  Array<{
    id: string
    lead_id: string
    lead_name: string
    phone_number: string
    address: string
    sequence_number: number
    message: string
    scheduled_for: string
    attempts: number
  }>
> {
  const supabase = await createClient()

  const now = new Date().toISOString()
  const maxAttempts = Number(process.env.FOLLOWUP_MAX_ATTEMPTS || 3)

  const { data, error } = await supabase
    .from("follow_up_sequences")
    .select(
      `
      id,
      lead_id,
      sequence_number,
      scheduled_for,
      attempts,
      next_attempt_at,
      leads(name, phone_number, address)
    `,
    )
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .lt("attempts", maxAttempts)
    .or(`next_attempt_at.is.null,next_attempt_at.lte.${now}`)
    .limit(limit)
    .order("scheduled_for", { ascending: true })

  if (error) {
    console.error("Error fetching pending follow-ups:", error)
    return []
  }

  // Map the response to include message content
  return (data || []).map((item: any) => ({
    id: item.id,
    lead_id: item.lead_id,
    lead_name: item.leads?.name || "Unknown",
    phone_number: item.leads?.phone_number || "",
    address: item.leads?.address || "",
    sequence_number: item.sequence_number,
    message: FOLLOWUP_MESSAGES[item.sequence_number - 1].message.replace("[ADDRESS]", item.leads?.address || ""),
    scheduled_for: item.scheduled_for,
    attempts: item.attempts || 0,
  }))
}

export async function markFollowUpAsSent(sequenceId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("follow_up_sequences")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", sequenceId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function skipFollowUp(sequenceId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.from("follow_up_sequences").update({ status: "skipped" }).eq("id", sequenceId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getLeadFollowUpSequence(leadId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("follow_up_sequences")
    .select("*")
    .eq("lead_id", leadId)
    .order("sequence_number", { ascending: true })

  if (error) {
    console.error("Error fetching follow-up sequence:", error)
    return []
  }

  return data || []
}

export async function markFollowUpFailed(sequenceId: string, errMsg: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const backoffMinutes = 15
  const next = new Date()
  next.setMinutes(next.getMinutes() + backoffMinutes)
  const { error } = await supabase
    .from("follow_up_sequences")
    .update({
      attempts: (supabase as any).rpc ? undefined : undefined, // placeholder, we will increment via fetch-update
      next_attempt_at: next.toISOString(),
      error_last: errMsg,
    })
    .eq("id", sequenceId)
  if (error) {
    // Fallback: read and update attempts manually
    const { data } = await supabase.from("follow_up_sequences").select("attempts").eq("id", sequenceId).single()
    const attempts = ((data as any)?.attempts || 0) + 1
    const { error: e2 } = await supabase
      .from("follow_up_sequences")
      .update({ attempts, next_attempt_at: next.toISOString(), error_last: errMsg })
      .eq("id", sequenceId)
    if (e2) return { success: false, error: e2.message }
    return { success: true }
  }
  return { success: true }
}
