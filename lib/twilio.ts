import twilio from "twilio"

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

// Create Twilio client (only if credentials are available)
export function getTwilioClient() {
  if (!accountSid || !authToken) {
    console.warn("Twilio credentials not configured")
    return null
  }
  return twilio(accountSid, authToken)
}

export async function sendSMS(to: string, body: string): Promise<{ sid: string | null; error: string | null }> {
  const client = getTwilioClient()

  if (!client) {
    console.log(`[MOCK SMS] To: ${to}\nMessage: ${body}`)
    return { sid: `mock_${Date.now()}`, error: null }
  }

  if (!twilioPhoneNumber) {
    return { sid: null, error: "Twilio phone number not configured" }
  }

  try {
    const message = await client.messages.create({
      body,
      from: twilioPhoneNumber,
      to,
    })

    return { sid: message.sid, error: null }
  } catch (error) {
    console.error("Error sending SMS:", error)
    return { sid: null, error: error instanceof Error ? error.message : "Failed to send SMS" }
  }
}

export function validateTwilioRequest(signature: string, url: string, params: Record<string, string>): boolean {
  if (!authToken) {
    // Skip validation in development without credentials
    return true
  }

  return twilio.validateRequest(authToken, signature, url, params)
}
