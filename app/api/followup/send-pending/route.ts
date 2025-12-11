import { getPendingFollowUps, markFollowUpAsSent, markFollowUpFailed } from "@/lib/followup-sequences"
import { sendSMS } from "@/lib/twilio"
import { NextResponse } from "next/server"

// This endpoint should be called by a cron job every hour
export async function POST() {
  try {
    const pendingFollowUps = await getPendingFollowUps(50)

    let sentCount = 0
    let failedCount = 0

    for (const followUp of pendingFollowUps) {
      try {
        // Send SMS
        const result = await sendSMS(followUp.phone_number, followUp.message)

        const ok = !result.error && !!result.sid
        if (ok) {
          // Mark as sent
          await markFollowUpAsSent(followUp.id)
          sentCount++
          console.log(`[v0] Sent follow-up ${followUp.sequence_number} to ${followUp.lead_name}`)
        } else {
          failedCount++
          console.log(`[v0] Failed to send SMS: ${result.error}`)
          await markFollowUpFailed(followUp.id, String(result.error || "unknown error"))
        }
      } catch (error) {
        failedCount++
        console.error(`[v0] Error sending follow-up to ${followUp.lead_name}:`, error)
        await markFollowUpFailed(followUp.id, String(error))
      }

      // Add small delay between messages to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      message: `Sent ${sentCount} follow-ups, ${failedCount} failed`,
    })
  } catch (error) {
    console.error("Error in send-pending follow-ups:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
