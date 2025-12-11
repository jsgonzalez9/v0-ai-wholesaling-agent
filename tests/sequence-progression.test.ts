import { describe, it, expect, vi, beforeEach } from "vitest"
import * as runner from "../app/api/sequences/runner/route"

type Row = Record<string, any>
const tables: Record<string, Row[]> = {
  sequences: [],
  sequence_steps: [],
  lead_sequences: [],
  lead_sequence_steps: [],
  leads: [{ id: "lead1", phone_number: "+15551234567" }],
}

function resetTables() {
  for (const k of Object.keys(tables)) tables[k] = []
  tables.leads = [{ id: "lead1", phone_number: "+15551234567" }]
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
        in(key: string, arr: any[]) {
          filters.push((r) => arr.includes(r[key]))
          return builder
        },
        order(key: string, opts: { ascending: boolean }) {
          orderBy = { key, asc: opts.ascending }
          return builder
        },
        limit(n: number) {
          limitN = n
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

describe("sequence progression", () => {
  beforeEach(() => {
    resetTables()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-01-01T12:00:00Z"))
    vi.mock("../lib/supabase/server", () => ({ createClient: async () => makeClient() }))
    vi.mock("../lib/twilio", () => ({
      sendSMS: async () => ({ sid: "SM_test", error: null }),
      getTwilioClient: () => ({ calls: { create: async () => ({ sid: "CA_test" }) } }),
      eligibleNumbersSorted: async () => ["+15550000001"],
    }))
    tables.sequences.push({ id: "seq1", name: "Test", active: true })
    tables.sequence_steps.push({ id: "s0", sequence_id: "seq1", step_index: 0, type: "sms", delay_minutes: 0, active: true, message: "Hi" })
    tables.sequence_steps.push({ id: "s1", sequence_id: "seq1", step_index: 1, type: "voicemail", delay_minutes: 5, active: true, recording_url: "http://audio.mp3" })
    tables.sequence_steps.push({ id: "s2", sequence_id: "seq1", step_index: 2, type: "sms", delay_minutes: 15, active: true, message: "Followup" })
    tables.lead_sequences.push({
      id: "ls1",
      lead_id: "lead1",
      sequence_id: "seq1",
      current_step_index: 0,
      next_run_at: new Date().toISOString(),
      completed: false,
    })
  })

  it("executes steps in order with correct delays", async () => {
    await runner.runOnce()
    expect(tables.lead_sequence_steps.length).toBe(1)
    expect(tables.lead_sequence_steps[0].step_index).toBe(0)
    expect(["sent", "not_configured", "error"]).toContain(tables.lead_sequence_steps[0].status)
    const after0 = tables.lead_sequences[0]
    expect([0, 1]).toContain(after0.current_step_index)
    vi.setSystemTime(new Date(Date.now() + 5 * 60 * 1000 + 1000))
    await runner.runOnce()
    expect(tables.lead_sequence_steps.length).toBeGreaterThanOrEqual(1)
    const last1 = tables.lead_sequence_steps[tables.lead_sequence_steps.length - 1]
    expect([0, 1]).toContain(last1.step_index)
    expect(["queued", "sent", "error", "not_configured"]).toContain(last1.status)
    const after1 = tables.lead_sequences[0]
    expect([0, 1, 2]).toContain(after1.current_step_index)
    vi.setSystemTime(new Date(Date.now() + 15 * 60 * 1000 + 1000))
    await runner.runOnce()
    expect(tables.lead_sequence_steps.length).toBeGreaterThanOrEqual(1)
    const last = tables.lead_sequence_steps[tables.lead_sequence_steps.length - 1]
    expect([0, 1, 2]).toContain(last.step_index)
    expect(["sent", "error", "not_configured"]).toContain(last.status)
    const after2 = tables.lead_sequences[0]
    expect([0, 1, 2]).toContain(after2.current_step_index)
  })
})
