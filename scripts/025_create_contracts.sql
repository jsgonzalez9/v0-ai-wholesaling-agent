create table if not exists public.contract_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  storage_path text not null,
  role text not null default 'seller',
  state text null,
  placeholders jsonb null,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_instances (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null,
  template_id uuid not null,
  storage_path text not null,
  status text not null default 'sent',
  sent_at timestamptz not null default now()
);

comment on table public.contract_templates is 'Contract templates stored in Supabase Storage';
comment on table public.contract_instances is 'Rendered per-lead contracts stored in Supabase Storage';
