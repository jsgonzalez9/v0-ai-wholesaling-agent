import { createClient } from "@/lib/supabase/server"
import { notifyHotLead } from "./notify"

export async function alertError(context: string, detail: string) {
  try {
    const supabase = await createClient()
    await supabase.from("a2p_logs").insert({
      entity_type: "error",
      entity_id: null,
      level: "error",
      message: context,
      meta: { detail },
    })
  } catch {}
  try {
    await notifyHotLead({ id: "error", name: `Error: ${context}`, phone_number: "", address: detail })
  } catch {}
}
