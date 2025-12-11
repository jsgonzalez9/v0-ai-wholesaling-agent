import { describe, it, expect, vi, beforeEach } from "vitest"
import * as runner from "../app/api/sequences/runner/route"

type Row = Record<string, any>
const tables: Record<string, Row[]> = {
  sequence_steps: [],
  lead_sequences: [],
  lead_sequence_steps: [],
  leads: [{ id: "lead1", phone_number: "+15551234567", pipeline_status: "NEW", is_opted_out: false }],
  messages: [],
}

function makeClient() {
  return {
    from(table: string) {
      let rows = tables[table] || []
      let filters: Array<(r: Row) => boolean> = []
      let orderBy: { key: string; asc: boolean } | null = null
      let limitN: number | null = null
      const builder: any = {
        select() { return builder },
        single() { const out = rows.filter((r) => filters.every((f) => f(r))); return Promise.resolve({ data: out[0] }) },
        eq(k: string, v: any) { filters.push((r) => r[k] === v); return builder },
        lte(k: string, v: any) { filters.push((r) => r[k] <= v); return builder },
        gte(k: string, v: any) { filters.push((r) => r[k] >= v); return builder },
        order(k: string, opts: any) { orderBy = { key: k, asc: opts.ascending }; return builder },
        limit(n: number) { limitN = n; return builder },
        then(resolve: any) {
          let out = rows.filter((r) => filters.every((f) => f(r)))
          if (orderBy) out = out.slice().sort((a, b) => (orderBy!.asc ? (a[orderBy!.key] > b[orderBy!.key] ? 1 : -1) : (a[orderBy!.key] < b[orderBy!.key] ? 1 : -1)))
          if (limitN != null) out = out.slice(0, limitN)
          return resolve({ data: out })
        },
        insert(obj: any) { const arr = Array.isArray(obj) ? obj : [obj]; for (const o of arr) tables[table].push({ id: `${table}_${Date.now()}_${Math.random()}`, ...o }); return Promise.resolve({ data: arr }) },
        update(obj: any) {
          const ub: any = {
            eq(k: string, v: any) { filters.push((r) => r[k] === v); return ub },
            then(resolve: any) { const idxs = rows.map((r, i) => ({ r, i })).filter(({ r }) => filters.every((f) => f(r))).map(({ i }) => i); for (const i of idxs) tables[table][i] = { ...tables[table][i], ...obj }; const updated = idxs.map((i) => tables[table][i]); return resolve({ data: updated }) },
            select() { return ub },
          }
          return ub
        },
      }
      return builder
    },
  } as any
}

describe("rules evaluation", () => {
  beforeEach(() => {
    for (const k of Object.keys(tables)) tables[k] = []
    tables.leads = [{ id: "lead1", phone_number: "+15551234567", pipeline_status: "NEW", is_opted_out: false }]
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-01-01T12:00:00Z"))
    process.env.TWILIO_ACCOUNT_SID = "test"
    process.env.TWILIO_AUTH_TOKEN = "test"
    process.env.TWILIO_PHONE_NUMBER = "+15550000001"
    vi.mock("../lib/supabase/server", () => ({ createClient: async () => makeClient() }))
    vi.mock("../lib/twilio", () => ({
      sendSMS: async () => ({ sid: "SM_ok", error: null }),
      getTwilioClient: () => ({ calls: { create: async () => ({ sid: "CA_test" }) } }),
      eligibleNumbersSorted: async () => ["+15550000001"],
      chooseCallerId: () => "+15550000001",
    }))
    tables.sequence_steps.push({ id: "s0", sequence_id: "seq1", step_index: 0, type: "sms", delay_minutes: 0, active: true, message: "Hi", rules: { action: "skip", conditions: [{ type: "inbound_reply_within", minutes: 10 }] } })
    tables.sequence_steps.push({ id: "s1", sequence_id: "seq1", step_index: 1, type: "sms", delay_minutes: 0, active: true, message: "Next" })
    tables.lead_sequences.push({ id: "ls1", lead_id: "lead1", sequence_id: "seq1", current_step_index: 0, next_run_at: new Date().toISOString(), completed: false })
    tables.messages.push({ id: "m1", lead_id: "lead1", direction: "inbound", created_at: new Date().toISOString(), content: "ok" })
  })

  it("skips current step and advances when inbound reply condition met", async () => {
    await runner.runOnce()
    expect(["rule_action", "skipped"]).toContain(tables.lead_sequence_steps[0].status)
    const ls = tables.lead_sequences[0]
    expect(ls.current_step_index).toBe(1)
  })
})
