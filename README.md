# AI Wholesaling MVP

## Setup
- Create a Supabase project and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Set Twilio env: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, optional `TWILIO_NUMBER_POOL`.
- Optional A2P: set `TWILIO_A2P_ENABLED=true` to submit Brand/Campaign to Twilio.
- OpenAI for summaries: `OPENAI_API_KEY`.
- Notifications: `ADMIN_NOTIFY_PHONE`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
- Copy `.env.example` to `.env.local` and fill values.

## Migrations
- Visit `/setup` in the app, run migrations via the button.

## Development
- `pnpm dev` to run locally.
- Configure Twilio webhook to `https://your-app/api/twilio/incoming` and status `https://your-app/api/twilio/status`.

## Features
- A2P Brand/Campaign workflow (DB + API + dashboard).
- SMS deliverability: number pooling, rate limiting, quiet hours, status tracking in `sms_events`.
- Compliance: STOP/UNSUBSCRIBE detection and suppression, footer disclosures.
- Health monitor dashboard for per-number sends.
- CRM pipeline fields (`pipeline_status`, `tags`, `score`), CSV export.
- Follow-up sequences with queue retries/backoff; admin dashboard for pending.
- HOT lead notifications (SMS/Telegram), notifications dashboard.
- Real-time message thread UI via Supabase Realtime.
- Deal tools: MAO calculator with presets; conversation summary generation.
- Property photos: table + simple API to attach URLs.

## Testing
- Manual checks:
  - Use dashboard pages to submit A2P brand/campaign.
  - Send inbound SMS to Twilio webhook and observe responses and opt-out handling.
  - Run follow-up batch from dashboard.
  - Generate conversation summary from lead panel.

## Notes
- Avoid sending during quiet hours; rate limit configured via env.
- All tables use permissive RLS for MVP; tighten in production.
