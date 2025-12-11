import { describe, it, expect, vi, beforeEach } from "vitest"
import * as supa from "../lib/supabase/server"
import * as leadActions from "../lib/lead-actions"
import * as route from "../app/api/twilio/voice/recording/route"

describe("voice recording route", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ arrayBuffer: async () => new ArrayBuffer(8) } as any)))
    vi.mock("openai", () => {
      return {
        default: class {
          audio = {
            transcriptions: {
              create: async () => ({ text: "Test transcript" }),
            },
          }
          chat = {
            completions: {
              create: async () => ({
                choices: [
                  {
                    message: {
                      content:
                        '{"summary":"Caller wants quick sale","sentiment":"positive","intent":"motivated","urgency":5,"objections":"price","pain_points":"vacancy","decision_maker":"owner","motivation":5,"next_action":"schedule walkthrough"}',
                    },
                  },
                ],
              }),
            },
          }
        },
      }
    })
    vi.spyOn(leadActions, "getLeadByPhone").mockResolvedValue({ id: "lead1" } as any)
    vi.spyOn(supa, "createClient").mockResolvedValue({
      from: () => ({
        insert: async () => ({}),
      }),
    } as any)
  })

  it("processes recording and stores summary", async () => {
    const body = new URLSearchParams({ RecordingUrl: "http://example.com/rec", From: "+15551234567" })
    const req = new Request("http://localhost", { method: "POST", body })
    const res = await route.POST(req)
    const json = await (res as Response).json()
    expect(json.success).toBe(true)
  })
})
