import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {},
        },
      },
    )

    const executed: Record<string, boolean> = {}

    const tables = [
      { table: "leads", scriptName: "001_create_leads_table.sql" },
      { table: "messages", scriptName: "002_create_messages_table.sql" },
      { table: "agent_config", scriptName: "003_create_agent_config_table.sql" },
    ]

    for (const { table, scriptName } of tables) {
      try {
        const { data, error } = await supabase.from(table).select("*", { count: "exact", head: true }).limit(1)

        executed[scriptName] = !error
      } catch (err) {
        executed[scriptName] = false
      }
    }

    // Check for model tracking columns only if messages table exists
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("model_used, was_escalated", { count: "exact", head: true })
        .limit(1)

      executed["004_add_model_tracking.sql"] = !error
    } catch (err) {
      executed["004_add_model_tracking.sql"] = false
    }

    return Response.json({ executed })
  } catch (error) {
    console.error("[v0] Setup check error:", error)
    return Response.json({ executed: {} }, { status: 500 })
  }
}
