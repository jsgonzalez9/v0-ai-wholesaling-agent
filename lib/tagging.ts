export function deriveTagsFromMessage(message: string): string[] {
  const m = message.toLowerCase()
  const tags: Set<string> = new Set()
  if (m.includes("vacant") || m.includes("no one living") || m.includes("empty")) tags.add("vacant")
  if (m.includes("absentee") || m.includes("out of state") || m.includes("live elsewhere")) tags.add("absentee")
  if (m.includes("preforeclosure") || m.includes("behind on payments") || m.includes("foreclosure")) tags.add("preforeclosure")
  if (m.includes("tenant issues") || m.includes("late rent") || m.includes("landlord") || m.includes("tired landlord")) tags.add("tired landlord")
  return Array.from(tags)
}
