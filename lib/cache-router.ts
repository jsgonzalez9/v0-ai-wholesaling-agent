import { createClient } from "@/lib/supabase/server"
import { FAQ_DEFAULT } from "@/lib/faq/default"

export type Intent =
  | "FAQ_PROCESS"
  | "FAQ_FEES"
  | "FAQ_TRUST"
  | "FAQ_CONTRACT"
  | "FAQ_GENERAL"
  | "PROPERTY_SPECIFIC"
  | "NEGOTIATION"
  | "EMOTIONAL"
  | "UNKNOWN"

export function normalizeQuestion(raw: string): string {
  return raw.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim()
}

export function classifyIntent(raw: string): Intent {
  const q = raw.toLowerCase()
  const has = (...words: string[]) => words.some((w) => q.includes(w))
  if (has("how does", "how it works", "process", "timeline", "close", "closing", "offer", "cash offer", "sell fast", "same-day", "comps", "valuation")) return "FAQ_PROCESS"
  if (has("fee", "fees", "commission", "commissions", "costs", "closing costs", "assignment fee")) return "FAQ_FEES"
  if (has("scam", "legitimate", "legit", "credentials", "license", "are you real", "wholesaler")) return "FAQ_TRUST"
  if (has("contract", "assignable", "assignability", "cancel", "cancellation", "inspection", "inspection period", "earnest", "valid", "validity", "expires")) return "FAQ_CONTRACT"
  if (has("tenants", "mortgage", "liens", "inherited", "probate", "as-is", "repairs", "access", "lockbox", "opt-out", "unsubscribe", "agent", "broker", "bankruptcy", "multiple properties")) return "FAQ_GENERAL"
  if (has("address", "street", "zip", "city", "state")) return "PROPERTY_SPECIFIC"
  if (has("price", "offer more", "counter", "too low", "higher")) return "NEGOTIATION"
  if (has("stress", "urgent", "emergency", "foreclosure", "behind on payments")) return "EMOTIONAL"
  return "UNKNOWN"
}

export async function lookupCached(intent: Intent, qNorm: string): Promise<{ text: string | null; confidence: number }> {
  try {
    const supabase = await createClient()
    const { data: exact } = await supabase
      .from("cached_responses")
      .select("id,response_text")
      .eq("intent", intent)
      .eq("normalized_question", qNorm)
      .limit(1)
      .maybeSingle()
    if (exact?.response_text) {
      await supabase.from("cached_hits").insert({ cached_response_id: exact.id, question_raw: qNorm, matched_confidence: 1.0 })
      return { text: exact.response_text, confidence: 1.0 }
    }
    const { data: similar } = await supabase
      .from("cached_responses")
      .select("id,response_text,normalized_question")
      .eq("intent", intent)
      .limit(5)
    const s = (similar || []).find((r: any) => String(r.normalized_question || "").includes(qNorm.split(" ").slice(0, 4).join(" ")))
    if (s?.response_text) {
      await supabase.from("cached_hits").insert({ cached_response_id: s.id, question_raw: qNorm, matched_confidence: 0.85 })
      return { text: s.response_text, confidence: 0.85 }
    }
  } catch {}
  const norm = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim()
  const localExact = FAQ_DEFAULT.find((i) => i.intent === intent && norm(i.question) === qNorm)
  if (localExact) return { text: localExact.response, confidence: 0.95 }
  const localSimilar = FAQ_DEFAULT.find((i) => i.intent === intent && norm(i.question).includes(qNorm.split(" ").slice(0, 4).join(" ")))
  if (localSimilar) return { text: localSimilar.response, confidence: 0.9 }
  return { text: null, confidence: 0 }
}

export async function storeCached(intent: Intent, qNorm: string, text: string): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from("cached_responses")
    .upsert({ intent, normalized_question: qNorm, response_text: text, updated_at: new Date().toISOString() }, { onConflict: "intent,normalized_question" })
}
