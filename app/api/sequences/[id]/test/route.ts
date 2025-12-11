import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendSMS, getTwilioClient, chooseCallerId } from "@/lib/twilio"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { phone_number } = await request.json()
    if (!phone_number) return NextResponse.json({ error: "phone_number required" }, { status: 400 })
    const supabase = await createClient()
    const { data: steps } = await supabase
      .from("sequence_steps")
      .select("*")
      .eq("sequence_id", params.id)
      .order("step_index", { ascending: true })
    const first = (steps || [])[0]
    if (first) {
      if ((first as any).type === "sms") {
        await sendSMS(phone_number, (first as any).message || "", { withFooter: false, bypassSuppression: true })
      } else if ((first as any).type === "voicemail") {
        const client = getTwilioClient()
        if (client) {
          const from = chooseCallerId()
          if (from) {
            const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/twilio/sequences/voicemail?recording_url=${encodeURIComponent((first as any).recording_url || "")}`
            await client.calls.create({ to: phone_number, from, url: callbackUrl, machineDetection: "Enable" })
          }
        }
      }
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to test run" }, { status: 500 })
  }
}
