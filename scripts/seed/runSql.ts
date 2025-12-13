import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

async function run() {
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }
  const supabase = createClient(url, key)
  const files = [
    "027_create_cached_responses.sql",
    "030_alter_cached_responses_embeddings.sql",
    "031_alter_agent_config_llm_cache.sql",
    "032_alter_agent_config_llm_cache_policy.sql",
    "033_alter_agent_config_market_overrides.sql",
    "034_alter_leads_dispo_fields.sql",
    "035_alter_agent_config_auto_dispo.sql",
    "036_create_buyer_broadcasts.sql",
    "037_create_buyer_offers.sql",
    "038_alter_leads_assignment.sql",
  ]
  for (const f of files) {
    const p = path.join(process.cwd(), "scripts", f)
    if (!fs.existsSync(p)) {
      console.log(`Skip missing: ${f}`)
      continue
    }
    const sql = fs.readFileSync(p, "utf-8")
    console.log(`Executing ${f}...`)
    const { error } = await supabase.rpc("exec", { sql_query: sql } as any)
    if (error) console.error(`Error ${f}:`, error)
    else console.log(`Done ${f}`)
  }
  console.log("SQL execution finished")
}

run().catch((e) => {
  console.error("Run failed:", e)
  process.exit(1)
})
