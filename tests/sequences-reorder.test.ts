import { describe, it, expect, vi, beforeEach } from "vitest"
import * as route from "../app/api/sequences/[id]/steps/reorder/route"

type Row = Record<string, any>
const tables: Record<string, Row[]> = { sequence_steps: [] }

function makeClient() {
  return {
    from(table: string) {
      return {
        update(obj: any) {
          return {
            eq(key: string, val: any) {
              const idx = tables[table].findIndex((r) => r[key] === val)
              if (idx >= 0) tables[table][idx] = { ...tables[table][idx], ...obj }
              return Promise.resolve({ data: [tables[table][idx]] })
            },
          }
        },
      }
    },
  } as any
}

describe("steps reorder", () => {
  beforeEach(() => {
    tables.sequence_steps = [
      { id: "a", step_index: 0 },
      { id: "b", step_index: 1 },
      { id: "c", step_index: 2 },
    ]
    vi.mock("../lib/supabase/server", () => ({ createClient: async () => makeClient() }))
  })

  it("updates step_index based on order", async () => {
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ orderedStepIds: ["b", "c", "a"] }),
    })
    const res = await (route as any).PATCH(req, { params: { id: "seq1" } })
    expect((res as Response).ok).toBe(true)
    expect(tables.sequence_steps.find((r) => r.id === "b")!.step_index).toBe(0)
    expect(tables.sequence_steps.find((r) => r.id === "c")!.step_index).toBe(1)
    expect(tables.sequence_steps.find((r) => r.id === "a")!.step_index).toBe(2)
  })
})
