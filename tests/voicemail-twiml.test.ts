import { describe, it, expect } from "vitest"
import * as route from "../app/api/twilio/sequences/voicemail/route"

describe("voicemail TwiML", () => {
  it("plays recording when AnsweredBy contains machine", async () => {
    const body = new URLSearchParams({ AnsweredBy: "machine" })
    const req = new Request("http://localhost/api/twilio/sequences/voicemail?recording_url=http://audio.mp3", { method: "POST", body })
    const res = await route.POST(req)
    const text = await (res as Response).text()
    expect(text).toContain("<Play>http://audio.mp3</Play>")
  })
  it("hangs up for non-machine", async () => {
    const body = new URLSearchParams({ AnsweredBy: "human" })
    const req = new Request("http://localhost/api/twilio/sequences/voicemail?recording_url=http://audio.mp3", { method: "POST", body })
    const res = await route.POST(req)
    const text = await (res as Response).text()
    expect(text).toContain("<Hangup/>")
  })
})
