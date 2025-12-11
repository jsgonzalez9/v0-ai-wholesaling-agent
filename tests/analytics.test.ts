import { describe, it, expect, vi, beforeEach } from "vitest"
import * as route from "../app/api/sequences/analytics/route"

type Row = Record<string, any>
const tables: Record<string, Row[]> = {
  lead_sequence_steps: [],
  lead_sequences: [],
  sequences: [],
}

function makeClient() {
  return {
    from(table: string) {
      let rows = tables[table] || []
      let filters: Array<(r: Row) => boolean> = []
      return {
        select() { return this },
        gte(k: string, v: any) { filters.push((r) => r[k] >= v); return this },
        then(resolve: any) { return resolve({ data: rows.filter((r) => filters.every((f) => f(r))) }) },
      }
    },
  } as any
}

describe("analytics", () => {
  beforeEach(() => {
    for (const k of Object.keys(tables)) tables[k] = []
    tables.sequences.push({ id: "seq1", name: "Test" })
    const now = new Date().toISOString()
    tables.lead_sequences.push({ id: "ls1", sequence_id: "seq1", inbound_reply_at: new Date(Date.now() + 10 * 60_000).toISOString() })
    tables.lead_sequence_steps.push({ id: "x1", lead_sequence_id: "ls1", step_index: 0, status: "sent", sent_at: now, metadata: { message: "Hi" }, lead_sequences: { sequence_id: "seq1" } })
  })

  it("computes response rate and avg time", async () => {
    vi.mock("../lib/supabase/server", () => ({ createClient: async () => makeClient() }))
    const res = await route.GET()
    const j = await (res as Response).json()
    const a = j.analytics["seq1"]
    expect(a.responseRate).toBeGreaterThan(0)
    expect(a.avgTimeToFirstResponse).toBe(10)
  })
})
