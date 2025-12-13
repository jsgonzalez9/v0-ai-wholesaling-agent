"use server"

import { createClient } from "@/lib/supabase/server"
import type { Lead, Message } from "@/lib/types"
import { revalidatePath } from "next/cache"

export async function createLead(data: {
  name: string
  phone_number: string
  address: string
  state?: string
  notes?: string
  arv?: number
  repair_estimate?: number
}): Promise<{ lead: Lead | null; error: string | null }> {
  const supabase = await createClient()

  // Format phone number (ensure it starts with +1 for US)
  let phone = data.phone_number.replace(/\D/g, "")
  if (phone.length === 10) {
    phone = `+1${phone}`
  } else if (phone.length === 11 && phone.startsWith("1")) {
    phone = `+${phone}`
  } else if (!phone.startsWith("+")) {
    phone = `+${phone}`
  }

  function extractState(addr: string): string | null {
    try {
      const parts = addr.split(",").map((p) => p.trim().toUpperCase())
      for (const p of parts.reverse()) {
        const m = p.match(/\b([A-Z]{2})\b/)
        if (m) return m[1]
      }
      return null
    } catch {
      return null
    }
  }

  const state = data.state || extractState(data.address || "")

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      name: data.name,
      phone_number: phone,
      address: data.address,
      state: state || null,
      notes: data.notes || null,
      arv: data.arv || null,
      repair_estimate: data.repair_estimate || null,
      conversation_state: "cold_lead",
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating lead:", error)
    return { lead: null, error: error.message }
  }

  revalidatePath("/dashboard")
  return { lead: lead as Lead, error: null }
}

export async function updateLead(
  id: string,
  data: Partial<Lead>,
): Promise<{ lead: Lead | null; error: string | null }> {
  const supabase = await createClient()

  const { data: lead, error } = await supabase
    .from("leads")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating lead:", error)
    return { lead: null, error: error.message }
  }

  revalidatePath("/dashboard")
  return { lead: lead as Lead, error: null }
}

export async function getLeadByPhone(phone: string): Promise<Lead | null> {
  const supabase = await createClient()

  // Normalize phone number
  let normalizedPhone = phone.replace(/\D/g, "")
  if (normalizedPhone.length === 10) {
    normalizedPhone = `+1${normalizedPhone}`
  } else if (normalizedPhone.length === 11 && normalizedPhone.startsWith("1")) {
    normalizedPhone = `+${normalizedPhone}`
  } else if (!normalizedPhone.startsWith("+")) {
    normalizedPhone = `+${normalizedPhone}`
  }

  const { data, error } = await supabase.from("leads").select("*").eq("phone_number", normalizedPhone).single()

  if (error || !data) {
    return null
  }

  return data as Lead
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("leads").select("*").eq("id", id).single()

  if (error || !data) {
    return null
  }

  return data as Lead
}

export async function getAllLeads(): Promise<Lead[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("leads").select("*").order("updated_at", { ascending: false })

  if (error) {
    console.error("Error fetching leads:", error)
    return []
  }

  return data as Lead[]
}

export async function saveMessage(data: {
  lead_id: string
  direction: "inbound" | "outbound"
  content: string
  twilio_sid?: string
  model_used?: Message["model_used"]
  was_escalated?: boolean
}): Promise<{ message: Message | null; error: string | null }> {
  const supabase = await createClient()

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      lead_id: data.lead_id,
      direction: data.direction,
      content: data.content,
      twilio_sid: data.twilio_sid || null,
      model_used: data.model_used || null,
      was_escalated: data.was_escalated || false,
    })
    .select()
    .single()

  if (error) {
    console.error("Error saving message:", error)
    return { message: null, error: error.message }
  }

  // Update lead's last_message_at
  await supabase.from("leads").update({ last_message_at: new Date().toISOString() }).eq("id", data.lead_id)

  return { message: message as Message, error: null }
}

export async function getLeadMessages(leadId: string): Promise<Message[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching messages:", error)
    return []
  }

  return data as Message[]
}

export async function deleteLead(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase.from("leads").delete().eq("id", id)

  if (error) {
    console.error("Error deleting lead:", error)
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { error: null }
}

export async function checkDatabaseSetup(): Promise<boolean> {
  const supabase = await createClient()

  try {
    // Try to query the leads table with a minimal query
    const { error } = await supabase.from("leads").select("id").limit(1)
    return !error
  } catch {
    return false
  }
}

export async function bulkImportLeads(
  leads: Array<{
    name: string
    phone_number: string
    address: string
    state?: string
    notes?: string
    arv?: number
    repair_estimate?: number
  }>,
): Promise<{ successCount: number; failedCount: number; errors: string[] }> {
  const supabase = await createClient()
  let successCount = 0
  let failedCount = 0
  const errors: string[] = []

  for (const leadData of leads) {
    // Format phone number
    let phone = leadData.phone_number.replace(/\D/g, "")
    if (phone.length === 10) {
      phone = `+1${phone}`
    } else if (phone.length === 11 && phone.startsWith("1")) {
      phone = `+${phone}`
    } else if (!phone.startsWith("+")) {
      phone = `+${phone}`
    }

    // Check if lead already exists
    const { data: existing } = await supabase.from("leads").select("id").eq("phone_number", phone).single()

    if (existing) {
      errors.push(`Lead with phone ${leadData.phone_number} already exists`)
      failedCount++
      continue
    }

    function extractState(addr: string): string | null {
      try {
        const parts = addr.split(",").map((p) => p.trim().toUpperCase())
        for (const p of parts.reverse()) {
          const m = p.match(/\b([A-Z]{2})\b/)
          if (m) return m[1]
        }
        return null
      } catch {
        return null
      }
    }
    const st = leadData.state || extractState(leadData.address || "")

    const { error } = await supabase.from("leads").insert({
      name: leadData.name,
      phone_number: phone,
      address: leadData.address,
      state: st || null,
      notes: leadData.notes || null,
      arv: leadData.arv || null,
      repair_estimate: leadData.repair_estimate || null,
      conversation_state: "cold_lead",
    })

    if (error) {
      errors.push(`Failed to import ${leadData.name}: ${error.message}`)
      failedCount++
    } else {
      successCount++
    }
  }

  revalidatePath("/dashboard")
  return { successCount, failedCount, errors }
}
