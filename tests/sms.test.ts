import { describe, it, expect } from "vitest"
import { sendSMS } from "../lib/twilio"

describe("sendSMS", () => {
  it("returns mock sid when Twilio client missing and appends STOP footer by default", async () => {
    const res = await sendSMS("+15551234567", "Hello there")
    expect(res.sid).toMatch(/^mock_/)
    expect(res.error).toBeNull()
  })

  it("can disable footer explicitly", async () => {
    const res = await sendSMS("+15551234567", "No footer", { withFooter: false })
    expect(res.sid).toMatch(/^mock_/)
    expect(res.error).toBeNull()
  })
})
