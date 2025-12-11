import { createClient } from "@/lib/supabase/server"
import type { Lead, Message, AgentConfig, CallIntentAction } from "@/lib/types"
import OpenAI from "openai"

const NODE_A_SYSTEM_PROMPT = `You are the Lead Outreach Agent for a real estate wholesaling company. 
Your goal is to qualify leads via SMS: gather property condition, motivation, timeline, and price expectations. 
You are friendly, polite, and professional. 
Do not handle complex negotiation; if the lead expresses a strong objection or is ready to sign, flag it for escalation to the advanced agent.

OUTPUT: SMS text messages only. Each response should be 1-2 short text messages max.

QUALIFICATION QUESTIONS (ask subtly):
- "Can you tell me about the property condition?"
- "What's your ideal timeline to sell?"
- "Do you have a price in mind?"

IMPORTANT:
- Always write in short SMS-friendly messages
- Do not make phone calls
- Track conversation status
- Flag complex objections or agreement signals for escalation

---

# 📌 **CALL INTENT DETECTION LOGIC**

**Your job is to determine whether a seller is asking for a phone call or would benefit from an immediate call.
When you detect call intent, you MUST return the appropriate call intent JSON.**

## **TRIGGER A CALL WHEN ANY OF THE FOLLOWING ARE TRUE:**

### **1. Direct Call Requests**
If the seller writes: "call me", "can you call me?", "you can call now", "call anytime", "here's my number", "call later", "call tomorrow", "call after 5", "just call", "give me a call", "we can talk on the phone", "call instead"

Return:
{
  "action": "update_lead_status",
  "lead_status": "warm_call_requested"
}

If a time is mentioned (e.g., "call after 5"):
{
  "action": "update_lead_status",
  "lead_status": "schedule_call",
  "call_time": "SELLER PROVIDED TIME"
}

### **2. Indirect Call Intent**
If the seller hints at wanting a more detailed conversation: "I want to talk about this", "we can discuss it", "let's talk", "can you explain how this works?", "I have questions", "I want to hear the offer", "can you walk me through it"

Return:
{
  "action": "update_lead_status",
  "lead_status": "warm_call_requested"
}

### **3. Strategic Call Situations**
Even if not explicitly requested, trigger a call if:
- They are price curious: "what can you offer me?"
- They say: "depends on the price"
- They say: "I'd consider selling"
- They are confused or hesitant but open
- They want details about closing process or timeline info
- They stop responding to text after showing interest

Return:
{
  "action": "update_lead_status",
  "lead_status": "ready_for_offer_call"
}

### **4. Do Not Call Signal**
If they say: "don't call", "text only", "I can't talk on the phone", "don't call this number"

Return:
{
  "action": "update_lead_status",
  "lead_status": "text_only"
}

## **RESPONSE FORMAT**

Always include this JSON at the END of your response:

If call intent detected:
{
  "callIntent": {
    "action": "update_lead_status",
    "lead_status": "warm_call_requested|schedule_call|ready_for_offer_call|text_only",
    "call_time": "OPTIONAL - time if seller specified"
  }
}

If no call intent:
{
  "callIntent": {
    "action": "none"
  }
}`

const NODE_B_SYSTEM_PROMPT = `You are the Advanced Negotiation & Closing Agent for a real estate wholesaling company.
Your goal is to handle complex seller objections, finalize offers, and generate contract-ready messages.
You can reason through multi-step negotiation, suggest counteroffers, and format DocuSign contract messages.
Always maintain a professional, polite tone.

CAPABILITIES:
- Handle complex price objections with reasoning
- Negotiate counteroffers professionally
- Finalize deal terms and prepare contract messaging
- Generate DocuSign-ready instructions

OFFER CALCULATION:
- MAO = (ARV × 0.7) – Repairs – Fee
- Present offers politely with justification

CONTRACT PREPARATION:
- When lead agrees: prepare contract with Name, Address, Offer Amount, Closing Date
- Send link: "Great! I've prepared the contract for [Property Address]. You can review and sign here: [Link]"

OBJECTION HANDLING:
- Price too low → Explain value, ask for their target price, consider counteroffer
- Timeline concerns → "We can close as fast as you need, usually within 7-14 days"
- Trust issues → Provide company credentials, offer references

OUTPUT: SMS text messages only. Keep responses professional but concise.`

const ESCALATION_KEYWORDS = [
  "agree",
  "accept",
  "deal",
  "ready to sell",
  "let's do it",
  "sounds good",
  "too low",
  "not enough",
  "more money",
  "higher",
  "counteroffer",
  "counter offer",
  "my price",
  "i want",
  "need at least",
  "won't accept",
  "can't accept",
  "final offer",
  "best offer",
  "walk away",
  "not interested anymore",
  "lawyer",
  "attorney",
  "legal",
  "contract terms",
  "contingency",
]

function shouldEscalateToNodeB(message: string, conversationState: string): boolean {
  const lowerMessage = message.toLowerCase()

  // Always escalate if in offer_made or later states
  if (["offer_made", "contract_sent", "offer_accepted"].includes(conversationState)) {
    return true
  }

  // Check for escalation keywords
  for (const keyword of ESCALATION_KEYWORDS) {
    if (lowerMessage.includes(keyword)) {
      return true
    }
  }

  // Check for price mentions with disagreement signals
  const pricePattern = /\$[\d,]+|\d+k|\d+\s*(thousand|k)/i
  const disagreementSignals = ["but", "however", "actually", "really", "honestly", "no", "not"]

  if (pricePattern.test(lowerMessage)) {
    for (const signal of disagreementSignals) {
      if (lowerMessage.includes(signal)) {
        return true
      }
    }
  }

  return false
}

export interface AgentResponse {
  message: string
  updatedLead: Partial<Lead>
  newState?: Lead["conversation_state"]
  modelUsed: "gpt-5.1"
  escalated: boolean
  callIntent?: CallIntentAction
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<{ text: string; usage?: any }> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    max_tokens: 800,
    temperature: 0.7,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  })
  const text = response.choices[0]?.message?.content || ""
  return { text, usage: response.usage }
}

export async function getAgentConfig(): Promise<AgentConfig> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("agent_config").select("*").single()

  if (error || !data) {
    // Return defaults if no config exists
    return {
      id: "",
      company_name: "CashBuyer Properties",
      wholesaling_fee: 10000,
      arv_multiplier: 0.7,
      follow_up_hours: 24,
      max_follow_ups: 3,
      followup_backoff_minutes: 15,
      followup_max_attempts: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  return data as AgentConfig
}

export async function getConversationHistory(leadId: string): Promise<Message[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching conversation history:", error)
    return []
  }

  return data as Message[]
}

export function calculateMAO(arv: number, repairs: number, fee: number, multiplier = 0.7): number {
  // MAO = (ARV × multiplier) – Repairs – Fee
  const mao = arv * multiplier - repairs - fee
  return Math.max(0, Math.round(mao))
}

export async function generateAgentResponse(
  lead: Lead,
  incomingMessage: string,
  config: AgentConfig,
): Promise<AgentResponse> {
  const conversationHistory = await getConversationHistory(lead.id)

  const shouldEscalate = shouldEscalateToNodeB(incomingMessage, lead.conversation_state)
  const systemPrompt = shouldEscalate ? NODE_B_SYSTEM_PROMPT : NODE_A_SYSTEM_PROMPT

  const tone = lead.pipeline_status === "HOT" ? "closer, professional, concise" : "friendly, helpful, concise"
  const leadContext = `
LEAD INFORMATION:
- Name: ${lead.name}
- Address: ${lead.address}
- Phone: ${lead.phone_number}
- Current State: ${lead.conversation_state}
- Property Condition: ${lead.property_condition || "Unknown"}
- Motivation: ${lead.motivation || "Unknown"}
- Timeline: ${lead.timeline || "Unknown"}
- Price Expectation: ${lead.price_expectation ? `$${lead.price_expectation.toLocaleString()}` : "Unknown"}
- Mortgage Owed: ${typeof lead.mortgage_owed === "number" ? `$${lead.mortgage_owed.toLocaleString()}` : "Unknown"}
- ARV (if available): ${lead.arv ? `$${lead.arv.toLocaleString()}` : "Not yet determined"}
- Repair Estimate: ${lead.repair_estimate ? `$${lead.repair_estimate.toLocaleString()}` : "Not yet determined"}
- Offer Amount: ${lead.offer_amount ? `$${lead.offer_amount.toLocaleString()}` : "Not yet made"}
- Notes: ${lead.notes || "None"}

COMPANY CONFIG:
- Company Name: ${config.company_name}
- Wholesaling Fee: $${config.wholesaling_fee.toLocaleString()}
- ARV Multiplier: ${config.arv_multiplier}
 
TONE: ${tone}
`

  const conversationContext = conversationHistory
    .map((msg) => `${msg.direction === "inbound" ? "SELLER" : "AGENT"}: ${msg.content}`)
    .join("\n")

  const prompt = shouldEscalate
    ? `${leadContext}

CONVERSATION HISTORY:
${conversationContext || "No previous messages"}

LATEST MESSAGE FROM SELLER (ESCALATED - Complex negotiation/agreement detected):
${incomingMessage}

This conversation has been escalated to you because the seller is either:
- Ready to accept an offer
- Raising complex objections requiring negotiation
- Discussing contract terms

Generate an appropriate SMS response handling this advanced scenario.

Also analyze and extract any new information about:
- Property condition, motivation, timeline, price expectation

Respond in JSON format:
{
  "smsResponse": "Your SMS response (professional, can be slightly longer for complex topics)",
  "callIntent": {
    "action": "update_lead_status|none",
    "lead_status": "warm_call_requested|schedule_call|ready_for_offer_call|text_only|null",
    "call_time": "optional"
  },
  "extractedInfo": {
    "propertyCondition": "extracted or null",
    "motivation": "extracted or null",
    "timeline": "extracted or null",
    "priceExpectation": "number or null"
  },
  "suggestedState": "new state or null",
  "shouldMakeOffer": true/false,
  "offerAccepted": true/false,
  "counterOfferAmount": "number if seller made counter, else null",
  "readyForContract": true/false
}`
    : `${leadContext}

CONVERSATION HISTORY:
${conversationContext || "No previous messages"}

LATEST MESSAGE FROM SELLER:
${incomingMessage}

Generate an appropriate SMS response to qualify this lead. Focus on gathering information about property condition, motivation, timeline, price expectations, and mortgage owed if mentioned.

Also analyze call intent - the seller may be hinting they want to talk on the phone instead of text.

Respond in JSON format:
{
  "smsResponse": "Your SMS response (keep it short, 1-2 messages max)",
  "callIntent": {
    "action": "update_lead_status|none",
    "lead_status": "warm_call_requested|schedule_call|ready_for_offer_call|text_only|null",
    "call_time": "optional"
  },
  "extractedInfo": {
    "propertyCondition": "extracted or null",
    "motivation": "extracted or null",
    "timeline": "extracted or null",
    "priceExpectation": "number or null",
    "mortgageOwed": "number or null"
  },
  "suggestedState": "new state or null",
  "shouldMakeOffer": true/false,
  "needsEscalation": true/false
}`

  const { text } = await callOpenAI(systemPrompt, prompt)

  let parsed
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0])
    } else {
      parsed = { smsResponse: text, callIntent: { action: "none" }, extractedInfo: {} }
    }
  } catch {
    parsed = { smsResponse: text, callIntent: { action: "none" }, extractedInfo: {} }
  }

  const updatedLead: Partial<Lead> = {}

  if (parsed.extractedInfo?.propertyCondition) {
    updatedLead.property_condition = parsed.extractedInfo.propertyCondition
  }
  if (parsed.extractedInfo?.motivation) {
    updatedLead.motivation = parsed.extractedInfo.motivation
  }
  if (parsed.extractedInfo?.timeline) {
    updatedLead.timeline = parsed.extractedInfo.timeline
  }
  if (parsed.extractedInfo?.priceExpectation) {
    updatedLead.price_expectation = Number(parsed.extractedInfo.priceExpectation)
  }
  if (parsed.counterOfferAmount) {
    updatedLead.notes = `${lead.notes || ""}\nSeller counter offer: $${parsed.counterOfferAmount}`.trim()
  }

  let newState: Lead["conversation_state"] | undefined
  if (parsed.offerAccepted || parsed.readyForContract) {
    newState = "offer_accepted"
  } else if (parsed.shouldMakeOffer && lead.conversation_state !== "offer_made") {
    newState = "offer_made"
  } else if (parsed.suggestedState) {
    newState = parsed.suggestedState
  }

  if (parsed.extractedInfo?.mortgageOwed) {
    updatedLead.mortgage_owed = Number(parsed.extractedInfo.mortgageOwed)
  }

  const callIntent: CallIntentAction = parsed.callIntent || { action: "none" }

  if ((parsed.shouldMakeOffer || parsed.readyForContract) && lead.arv && lead.repair_estimate) {
    updatedLead.offer_amount = calculateMAO(lead.arv, lead.repair_estimate, config.wholesaling_fee, config.arv_multiplier)
  }

  return {
    message: parsed.smsResponse,
    updatedLead,
    newState,
    modelUsed: "gpt-5.1",
    escalated: shouldEscalate,
    callIntent,
  }
}

export async function generateInitialOutreach(lead: Lead, config: AgentConfig): Promise<string> {
  return `Hi ${lead.name}, this is ${config.company_name}. Are you still interested in selling ${lead.address}? We make fair cash offers and can close quickly. Reply YES if you'd like to learn more!`
}

export async function generateFollowUp(lead: Lead, config: AgentConfig): Promise<string> {
  switch (lead.conversation_state) {
    case "contacted":
      return `Hi ${lead.name}, just following up on my message about ${lead.address}. We're still interested in making you a fair cash offer. Let me know if you have any questions!`
    case "offer_made":
      return `Hi ${lead.name}, just checking if you had a chance to consider our offer of $${lead.offer_amount?.toLocaleString()} for ${lead.address}. Let me know your thoughts!`
    case "contract_sent":
      return `Hi ${lead.name}, just checking if you had a chance to review the contract for ${lead.address}. Let me know if you have any questions!`
    default:
      return `Hi ${lead.name}, this is ${config.company_name} following up about ${lead.address}. Are you still interested in selling? We'd love to help!`
  }
}
