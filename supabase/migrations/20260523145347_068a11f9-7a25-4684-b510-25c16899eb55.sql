
create table if not exists public.store_moderation_logs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null,
  previous_status text,
  new_status text not null,
  reason text,
  created_by_admin uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_moderation_logs_store on public.store_moderation_logs(store_id, created_at desc);

alter table public.store_moderation_logs enable row level security;

create policy "moderation logs admin read"
on public.store_moderation_logs for select
to authenticated
using (public.has_role(auth.uid(), 'super_admin'));

create policy "moderation logs admin insert"
on public.store_moderation_logs for insert
to authenticated
with check (public.has_role(auth.uid(), 'super_admin'));
