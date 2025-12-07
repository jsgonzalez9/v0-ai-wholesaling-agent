export type ConversationState =
  | "cold_lead"
  | "contacted"
  | "qualified"
  | "offer_made"
  | "offer_accepted"
  | "contract_sent"
  | "contract_signed"
  | "closed"
  | "lost"
  | "warm_call_requested"
  | "schedule_call"
  | "ready_for_offer_call"
  | "text_only"

export interface Lead {
  id: string
  name: string
  phone_number: string
  address: string
  notes: string | null
  property_condition: string | null
  motivation: string | null
  timeline: string | null
  price_expectation: number | null
  arv: number | null
  repair_estimate: number | null
  offer_amount: number | null
  conversation_state: ConversationState
  contract_link: string | null
  last_message_at: string | null
  follow_up_count: number
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  lead_id: string
  direction: "inbound" | "outbound"
  content: string
  twilio_sid: string | null
  model_used: "gpt-5-mini" | "gpt-5" | null
  was_escalated: boolean | null
  created_at: string
}

export interface AgentConfig {
  id: string
  company_name: string
  wholesaling_fee: number
  arv_multiplier: number
  follow_up_hours: number
  max_follow_ups: number
  created_at: string
  updated_at: string
}

export interface VoiceCall {
  id: string
  lead_id: string
  call_type: "inbound" | "outbound"
  call_status: "pending" | "ringing" | "in_progress" | "completed" | "failed" | "no_answer"
  twilio_call_sid: string | null
  duration_seconds: number | null
  transcript: string | null
  summary: string | null
  offer_discussed: boolean
  offer_amount: number | null
  next_steps: string | null
  model_used: string
  sentiment: "positive" | "neutral" | "negative" | null
  created_at: string
  updated_at: string
}

export interface CallIntentAction {
  action: "none" | "update_lead_status"
  lead_status?: ConversationState
  call_time?: string
}
