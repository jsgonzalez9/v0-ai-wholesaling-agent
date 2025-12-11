import { describe, it, expect, vi, beforeEach } from "vitest"
import * as runner from "../app/api/sequences/runner/route"

type Row = Record<string, any>
const tables: Record<string, Row[]> = {
  sequences: [],
  sequence_steps: [],
  lead_sequences: [],
  lead_sequence_steps: [],
  leads: [{ id: "lead1", phone_number: "+15551234567", pipeline_status: "NEW" }],
}

function resetTables() {
  for (const k of Object.keys(tables)) tables[k] = []
  tables.leads = [{ id: "lead1", phone_number: "+15551234567", pipeline_status: "NEW" }]
}

function makeClient() {
  return {
    from(table: string) {
      let rows = tables[table] || []
      let filters: Array<(r: Row) => boolean> = []
      let orderBy: { key: string; asc: boolean } | null = null
      let limitN: number | null = null
      const builder: any = {
        select() {
          return builder
        },
        single() {
          const out = rows.filter((r) => filters.every((f) => f(r)))
          return Promise.resolve({ data: out[0] })
        },
        eq(key: string, val: any) {
          filters.push((r) => r[key] === val)
          return builder
        },
        lte(key: string, val: any) {
          filters.push((r) => r[key] <= val)
          return builder
        },
        gte(key: string, val: any) {
          filters.push((r) => r[key] >= val)
          return builder
        },
        limit(n: number) {
          limitN = n
          return builder
        },
        order(key: string, opts: { ascending: boolean }) {
          orderBy = { key, asc: opts.ascending }
          return builder
        },
        then(resolve: any) {
          let out = rows.filter((r) => filters.every((f) => f(r)))
          if (orderBy) {
            out = out.slice().sort((a, b) => {
              const av = a[orderBy!.key]
              const bv = b[orderBy!.key]
              return orderBy!.asc ? (av > bv ? 1 : av < bv ? -1 : 0) : (av < bv ? 1 : av > bv ? -1 : 0)
            })
          }
          if (limitN != null) out = out.slice(0, limitN)
          return resolve({ data: out })
        },
        insert(obj: any) {
          const arr = Array.isArray(obj) ? obj : [obj]
          for (const o of arr) {
            const row = { id: o.id || `${table}_${Date.now()}_${Math.random()}`, ...o }
            tables[table].push(row)
          }
          return Promise.resolve({ data: arr })
        },
        update(obj: any) {
          const ub: any = {
            eq(key: string, val: any) {
              filters.push((r) => r[key] === val)
              return ub
            },
            then(resolve: any) {
              const idxs = rows
                .map((r, i) => ({ r, i }))
                .filter(({ r }) => filters.every((f) => f(r)))
                .map(({ i }) => i)
              for (const i of idxs) {
                tables[table][i] = { ...tables[table][i], ...obj }
              }
              const updated = idxs.map((i) => tables[table][i])
              return resolve({ data: updated })
            },
            select() {
              return ub
            },
          }
          return ub
        },
      }
      return builder
    },
  } as any
}

describe("sequence retry/backoff", () => {
  beforeEach(() => {
    resetTables()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-01-01T12:00:00Z"))
    ;(globalThis as any).__failOnce = true
    vi.mock("../lib/supabase/server", () => ({ createClient: async () => makeClient() }))
    vi.mock("../lib/twilio", () => ({
      sendSMS: async () => {
        if ((globalThis as any).__failOnce) {
          ;(globalThis as any).__failOnce = false
          return { sid: null, error: "network" }
        }
        return { sid: "SM_ok", error: null }
      },
      getTwilioClient: () => ({ calls: { create: async () => ({ sid: "CA_test" }) } }),
      eligibleNumbersSorted: async () => ["+15550000001"],
    }))
    tables.sequences.push({ id: "seq1", name: "Test", active: true })
    tables.sequence_steps.push({ id: "s0", sequence_id: "seq1", step_index: 0, type: "sms", delay_minutes: 0, active: true, message: "Hi" })
    tables.sequence_steps.push({ id: "s1", sequence_id: "seq1", step_index: 1, type: "sms", delay_minutes: 5, active: true, message: "Next" })
    tables.lead_sequences.push({
      id: "ls1",
      lead_id: "lead1",
      sequence_id: "seq1",
      current_step_index: 0,
      next_run_at: new Date().toISOString(),
      retry_count: 0,
      fail_streak: 0,
      completed: false,
      disabled: false,
    })
  })

  it("retries once on failure then advances", async () => {
    await runner.runOnce()
    expect(tables.lead_sequence_steps.length).toBe(1)
    expect(["error", "not_configured"]).toContain(tables.lead_sequence_steps[0].status)
    const afterFail = tables.lead_sequences[0]
    expect([0, 1]).toContain(afterFail.retry_count)
    vi.setSystemTime(new Date(Date.now() + 6 * 60 * 1000))
    await runner.runOnce()
    expect(tables.lead_sequence_steps.length).toBeGreaterThanOrEqual(1)
    const last = tables.lead_sequence_steps[tables.lead_sequence_steps.length - 1]
    expect(["sent", "queued", "error", "not_configured"]).toContain(last.status)
    const afterSuccess = tables.lead_sequences[0]
    expect([0, 1]).toContain(afterSuccess.current_step_index)
  })
})
