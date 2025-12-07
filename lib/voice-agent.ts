import OpenAI from "openai"
import type { Lead } from "./types"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface VoiceAgentConfig {
  leadId: string
  phone: string
  companyName: string
  agentName: string
  mode: "inbound" | "outbound"
}

// Voice Agent System Prompt for OpenAI Realtime API
const VOICE_AGENT_SYSTEM_PROMPT = `You are an AI voice agent for a real estate wholesaling company. Your job is to have natural, professional conversations with property owners via phone calls.

YOUR ROLE:
- For OUTBOUND calls: Introduce yourself professionally and ask if they're interested in selling their property
- For INBOUND calls: Answer warmly and confirm they're open to discussing a sale
- Qualify the lead through natural conversation
- Discuss property details, condition, timeline, and motivation
- Present fair cash offers based on data
- Schedule follow-ups or next steps
- Always be respectful of their time

CRITICAL RULES:
1. Keep responses SHORT and conversational (1-2 sentences max for voice)
2. Use simple, clear language - no jargon
3. Ask open-ended questions to understand their situation
4. Be ready to handle objections gracefully
5. If they say "no" or "not interested", thank them and end the call professionally
6. Never pressure or be pushy
7. For offers: Frame as "fair cash offer" not "low ball"
8. If call gets technical: Explain in simple terms or offer callback
9. Track timeline, motivation, property condition through conversation
10. Offer contract link or next call as close

CONVERSATION FLOW:
- Greeting & Introduction (5-10 seconds)
- Quick Qualification (property details, timeline, condition)
- Offer Presentation (if qualified)
- Close (next steps, follow-up, or contract)

Keep the conversation natural and human-like. Don't sound robotic.`

export async function generateVoiceResponse(
  lead: Lead,
  transcript: string,
  config: VoiceAgentConfig,
): Promise<{
  message: string
  shouldEndCall: boolean
  updatedLead: Partial<Lead>
  nextAction: string
}> {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-5",
      max_tokens: 150,
      system: VOICE_AGENT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Lead: ${lead.name}
Property: ${lead.address}
Current State: ${lead.conversation_state}
Property Condition: ${lead.property_condition || "Unknown"}
Timeline: ${lead.timeline || "Unknown"}
Motivation: ${lead.motivation || "Unknown"}
Price Expectation: ${lead.price_expectation || "Unknown"}

Call Context: ${transcript}

Generate a natural, short voice response. Keep it conversational and friendly.`,
        },
      ],
    })

    const message = response.choices[0].message.content || ""

    // Determine if call should end
    const shouldEndCall =
      message.toLowerCase().includes("thank you") ||
      message.toLowerCase().includes("goodbye") ||
      message.toLowerCase().includes("take care")

    // Parse for extraction hints in the response
    const updatedLead: Partial<Lead> = {}

    // Check for new conversation state
    let newState = lead.conversation_state
    if (transcript.toLowerCase().includes("qualified")) {
      newState = "qualified"
    } else if (transcript.toLowerCase().includes("offer")) {
      newState = "offer_made"
    }

    if (newState !== lead.conversation_state) {
      updatedLead.conversation_state = newState as any
    }

    return {
      message,
      shouldEndCall,
      updatedLead,
      nextAction: shouldEndCall ? "end_call" : "continue",
    }
  } catch (error) {
    console.error("[Voice Agent] Error generating response:", error)
    throw error
  }
}

export async function extractCallInsights(
  transcript: string,
  lead: Lead,
): Promise<{
  summary: string
  sentiment: "positive" | "neutral" | "negative"
  offerDiscussed: boolean
  nextSteps: string
  leadUpdates: Partial<Lead>
}> {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-5",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Analyze this call transcript between an AI agent and a property owner:

TRANSCRIPT:
${transcript}

LEAD INFO:
Name: ${lead.name}
Property: ${lead.address}

Extract and provide:
1. A brief summary of the call (2-3 sentences)
2. Sentiment (positive/neutral/negative)
3. Was an offer discussed? (yes/no)
4. Next steps discussed
5. Any new information about: property condition, timeline, motivation, or price expectations

Format your response as JSON.`,
        },
      ],
    })

    const content = response.choices[0].message.content || "{}"

    // Try to parse JSON from response
    let insights
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      insights = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    } catch {
      insights = {
        summary: content,
        sentiment: "neutral",
        offerDiscussed: false,
        nextSteps: "Follow up required",
      }
    }

    const leadUpdates: Partial<Lead> = {}

    // Update lead based on insights
    if (insights.propertyCondition) {
      leadUpdates.property_condition = insights.propertyCondition
    }
    if (insights.timeline) {
      leadUpdates.timeline = insights.timeline
    }
    if (insights.motivation) {
      leadUpdates.motivation = insights.motivation
    }

    return {
      summary: insights.summary || "Call completed",
      sentiment: insights.sentiment || "neutral",
      offerDiscussed: insights.offerDiscussed || false,
      nextSteps: insights.nextSteps || "Follow up required",
      leadUpdates,
    }
  } catch (error) {
    console.error("[Voice Agent] Error extracting insights:", error)
    return {
      summary: "Call completed",
      sentiment: "neutral",
      offerDiscussed: false,
      nextSteps: "Follow up required",
      leadUpdates: {},
    }
  }
}
