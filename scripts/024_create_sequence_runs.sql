create table if not exists public.sequence_runs (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid null,
  step_id uuid null,
  rule_action text null,
  status text not null,
  error text null,
  created_at timestamptz not null default now()
);

comment on table public.sequence_runs is 'Logs for sequence runner executions and rule actions';
comment on column public.sequence_runs.sequence_id is 'Sequence identifier';
comment on column public.sequence_runs.step_id is 'Step identifier';
comment on column public.sequence_runs.rule_action is 'skip/pause/jump/complete when rules trigger';
comment on column public.sequence_runs.status is 'sent/queued/error/not_configured/ok';
