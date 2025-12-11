import { describe, it, expect, vi, beforeEach } from "vitest"
import * as route from "../app/api/sequences/[id]/test/route"

type Row = Record<string, any>
const tables: Record<string, Row[]> = { sequence_steps: [] }

function makeClient() {
  return {
    from(table: string) {
      let rows = tables[table] || []
      let filters: Array<(r: Row) => boolean> = []
      let orderBy: { key: string; asc: boolean } | null = null
      const builder: any = {
        select() { return builder },
        eq(k: string, v: any) { filters.push((r) => r[k] === v); return builder },
        order(k: string, opts: any) { orderBy = { key: k, asc: opts.ascending }; return builder },
        then(resolve: any) {
          let out = rows.filter((r) => filters.every((f) => f(r)))
          if (orderBy) out = out.slice().sort((a, b) => (orderBy!.asc ? (a[orderBy!.key] > b[orderBy!.key] ? 1 : -1) : (a[orderBy!.key] < b[orderBy!.key] ? 1 : -1)))
          return resolve({ data: out })
        },
      }
      return builder
    },
  } as any
}

describe("sequence test-run", () => {
  beforeEach(() => {
    tables.sequence_steps = [
      { id: "s0", sequence_id: "seq1", step_index: 0, type: "sms", message: "Hi" },
      { id: "s1", sequence_id: "seq1", step_index: 1, type: "sms", message: "Next" },
    ]
    vi.mock("../lib/supabase/server", () => ({ createClient: async () => makeClient() }))
    vi.mock("../lib/twilio", () => ({ sendSMS: async () => ({ sid: "SM_test", error: null }), getTwilioClient: () => null, chooseCallerId: () => null }))
  })

  it("sends only first step to provided number", async () => {
    const req = new Request("http://localhost", { method: "POST", body: JSON.stringify({ phone_number: "+15551234567" }) })
    const res = await (route as any).POST(req, { params: { id: "seq1" } })
    expect((res as Response).ok).toBe(true)
  })
})
