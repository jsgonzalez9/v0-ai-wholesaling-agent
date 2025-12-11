import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ success: false, error: "Missing Supabase credentials" }, { status: 400 })
    }

    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    })

    const sqlFiles = [
      "001_create_leads_table.sql",
      "002_create_messages_table.sql",
      "003_create_agent_config_table.sql",
      "004_add_model_tracking.sql",
      "005_create_call_tracking.sql",
      "006_create_followup_sequences.sql",
      "007_create_sms_events.sql",
      "008_alter_leads_optout.sql",
      "009_create_a2p_tables.sql",
      "010_alter_followup_queue.sql",
      "011_alter_agent_config_followup.sql",
      "012_alter_leads_mortgage.sql",
      "013_create_conversation_summaries.sql",
      "014_create_property_photos.sql",
      "015_alter_followup_reason_next.sql",
      "016_create_consents.sql",
      "017_alter_leads_consent.sql",
      "018_create_call_summaries.sql",
      "019_alter_call_summaries_details.sql",
      "020_create_sequences.sql",
      "021_alter_lead_sequences_retry.sql",
    ]

    const executed: Record<string, boolean> = {}

    for (const file of sqlFiles) {
      const filePath = path.join(process.cwd(), "scripts", file)
      if (!fs.existsSync(filePath)) {
        console.error(`[v0] SQL file not found: ${filePath}`)
        executed[file] = false
        continue
      }

      const sql = fs.readFileSync(filePath, "utf-8")

      try {
        const { error } = await supabase.rpc("exec", {
          sql_query: sql,
        })

        if (error) {
          console.error(`[v0] Error executing ${file}:`, error)
          executed[file] = false
        } else {
          executed[file] = true
        }
      } catch (err) {
        console.error(`[v0] Exception executing ${file}:`, err)
        executed[file] = false
      }
    }

    return NextResponse.json({ success: true, executed })
  } catch (error) {
    console.error("[v0] Migration error:", error)
    return NextResponse.json({ success: false, error: "Failed to run migrations", executed: {} }, { status: 500 })
  }
}
