import { NextResponse } from "next/server"
import { scheduleFollowUpSequence } from "@/lib/followup-sequences"

export async function POST(request: Request) {
  try {
    const { leadId, reason, next_action } = await request.json()
    if (!leadId) return NextResponse.json({ success: false, error: "leadId required" }, { status: 400 })
    const result = await scheduleFollowUpSequence(leadId, { reason, next_action })
    if (!result.success) return NextResponse.json(result, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to schedule" }, { status: 500 })
  }
}
