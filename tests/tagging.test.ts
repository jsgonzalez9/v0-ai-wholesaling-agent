import { describe, it, expect } from "vitest"
import { deriveTagsFromMessage } from "../lib/tagging"

describe("deriveTagsFromMessage", () => {
  it("detects vacant and absentee", () => {
    const tags = deriveTagsFromMessage("The house is vacant and I live out of state")
    expect(tags).toContain("vacant")
    expect(tags).toContain("absentee")
  })

  it("detects preforeclosure and tired landlord", () => {
    const tags = deriveTagsFromMessage("Behind on payments, tired landlord situation with late rent")
    expect(tags).toContain("preforeclosure")
    expect(tags).toContain("tired landlord")
  })
})
