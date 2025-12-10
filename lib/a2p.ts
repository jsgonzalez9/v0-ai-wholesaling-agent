const TWILIO_MESSAGING_API = "https://messaging.twilio.com/v1"

function twilioAuthHeader() {
  const sid = process.env.TWILIO_ACCOUNT_SID || ""
  const token = process.env.TWILIO_AUTH_TOKEN || ""
  const basic = Buffer.from(`${sid}:${token}`).toString("base64")
  return `Basic ${basic}`
}

export async function submitBrandToTwilio(payload: {
  business_name: string
  ein?: string
  contact_email?: string
  contact_phone?: string
  address?: string
  use_case?: string
}): Promise<{ provider_id?: string; status?: string; error?: string }> {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return { error: "Twilio credentials missing" }
    }
    const url = `${TWILIO_MESSAGING_API}/BrandRegistrations`
    const params = new URLSearchParams()
    params.append("BrandName", payload.business_name)
    if (payload.ein) params.append("TaxId", payload.ein)
    if (payload.contact_email) params.append("Email", payload.contact_email)
    if (payload.contact_phone) params.append("Phone", payload.contact_phone)
    if (payload.address) params.append("Address", payload.address)
    params.append("UseCase", payload.use_case || "real_estate_lead_generation")

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: twilioAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    })
    const data = await resp.json()
    if (!resp.ok) return { error: data.message || "Brand submission failed" }
    return { provider_id: data.sid || data.id || data.BrandRegistrationSid, status: data.status || "submitted" }
  } catch (e: any) {
    return { error: e?.message || "Brand submission error" }
  }
}

export async function submitCampaignToTwilio(payload: {
  brand_provider_id: string
  campaign_name: string
  description?: string
  sample_messages?: string
}): Promise<{ provider_id?: string; status?: string; error?: string }> {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return { error: "Twilio credentials missing" }
    }
    const url = `${TWILIO_MESSAGING_API}/A2P/Campaigns`
    const params = new URLSearchParams()
    params.append("BrandRegistrationSid", payload.brand_provider_id)
    params.append("FriendlyName", payload.campaign_name)
    if (payload.description) params.append("Description", payload.description)
    if (payload.sample_messages) params.append("SampleMessages", payload.sample_messages)

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: twilioAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    })
    const data = await resp.json()
    if (!resp.ok) return { error: data.message || "Campaign submission failed" }
    return { provider_id: data.sid || data.id || data.CampaignSid, status: data.status || "submitted" }
  } catch (e: any) {
    return { error: e?.message || "Campaign submission error" }
  }
}

export async function getCampaignStatusFromTwilio(provider_id: string): Promise<{ status?: string; error?: string }> {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return { error: "Twilio credentials missing" }
    }
    const url = `${TWILIO_MESSAGING_API}/A2P/Campaigns/${provider_id}`
    const resp = await fetch(url, {
      headers: { Authorization: twilioAuthHeader() },
    })
    const data = await resp.json()
    if (!resp.ok) return { error: data.message || "Status fetch failed" }
    return { status: data.status || data.State || "unknown" }
  } catch (e: any) {
    return { error: e?.message || "Campaign status error" }
  }
}
