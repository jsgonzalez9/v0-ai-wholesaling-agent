import { createClient } from "@/lib/supabase/server"
import twilio from "twilio"

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) return null
  return twilio(sid, token)
}

export async function notifyHotLead(lead: { id: string; name: string; phone_number: string; address: string }) {
  try {
    const supabase = await createClient()
    await supabase.from("a2p_logs").insert({
      entity_type: "lead",
      entity_id: lead.id,
      level: "info",
      message: "hot_lead",
      meta: { name: lead.name, phone: lead.phone_number, address: lead.address },
    })
  } catch {}

  const text = `HOT Lead: ${lead.name}\n${lead.address}\nPhone: ${lead.phone_number}`

  // SMS admin notify
  try {
    const adminPhone = process.env.ADMIN_NOTIFY_PHONE
    const fromNumber = process.env.TWILIO_PHONE_NUMBER
    const client = getTwilioClient()
    if (client && adminPhone && fromNumber) {
      await client.messages.create({ to: adminPhone, from: fromNumber, body: text })
    }
  } catch {}

  // Telegram notify
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (token && chatId) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      })
    }
  } catch {}
}
