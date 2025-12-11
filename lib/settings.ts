import { createClient } from "@/lib/supabase/server"

export type RuntimeSettings = {
  maxCallMinutes: number
  vadEnabled: boolean
  audioQuality: "low" | "medium" | "high"
  concurrencyLimit: number
  senderMonthlyLimit: number
}

const defaults: RuntimeSettings = {
  maxCallMinutes: Number(process.env.MAX_CALL_MINUTES || 10),
  vadEnabled: String(process.env.VOICE_VAD_ENABLED || "false").toLowerCase() === "true",
  audioQuality: "medium",
  concurrencyLimit: 3,
  senderMonthlyLimit: Number(process.env.SENDER_MONTHLY_LIMIT || 2000),
}

export async function getRuntimeSettings(): Promise<RuntimeSettings> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("call_events")
      .select("event_data, created_at")
      .eq("event_type", "settings_update")
      .order("created_at", { ascending: false })
      .limit(1)

    const ed = (data?.[0] as any)?.event_data || {}
    return {
      maxCallMinutes: typeof ed.maxCallMinutes === "number" ? ed.maxCallMinutes : defaults.maxCallMinutes,
      vadEnabled: typeof ed.vadEnabled === "boolean" ? ed.vadEnabled : defaults.vadEnabled,
      audioQuality: (ed.audioQuality as any) || defaults.audioQuality,
      concurrencyLimit: typeof ed.concurrencyLimit === "number" ? ed.concurrencyLimit : defaults.concurrencyLimit,
      senderMonthlyLimit:
        typeof ed.senderMonthlyLimit === "number" ? ed.senderMonthlyLimit : defaults.senderMonthlyLimit,
    }
  } catch {
    return defaults
  }
}
