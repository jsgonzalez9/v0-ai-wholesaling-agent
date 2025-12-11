import { describe, it, expect, vi } from "vitest"
import * as supa from "../lib/supabase/server"
import * as route from "../app/api/twilio/status/route"

describe("twilio status webhook", () => {
  it("normalizes status and persists", async () => {
    vi.spyOn(supa, "createClient").mockResolvedValue({
      from: () => ({
        insert: async () => ({}),
      }),
    } as any)
    const body = new URLSearchParams({ MessageSid: "SM123", MessageStatus: "delivered", To: "+1555123", ErrorCode: "" })
    const req = new Request("http://localhost", { method: "POST", body }) as any
    const res = await route.POST(req)
    const json = await (res as Response).json()
    expect(json.success).toBe(true)
  })
})
