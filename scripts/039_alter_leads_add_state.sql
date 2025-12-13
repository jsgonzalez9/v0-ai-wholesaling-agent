alter table if exists public.leads
  add column if not exists state text;

create index if not exists idx_leads_state on public.leads(state);
