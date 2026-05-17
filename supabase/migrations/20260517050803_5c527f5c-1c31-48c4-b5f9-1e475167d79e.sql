create table if not exists public.super_admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.super_admin_accounts(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.super_admin_sessions enable row level security;

create or replace function public.verify_super_admin(_username text, _password text)
returns table(admin_id uuid, display_name text)
language sql
security definer
set search_path = public, extensions
as $$
  select id, display_name
  from public.super_admin_accounts
  where username = _username
    and is_active = true
    and password_hash = extensions.crypt(_password, password_hash)
  limit 1;
$$;

revoke execute on function public.verify_super_admin(text, text) from anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from anon;
revoke execute on function public.is_store_owner(uuid, uuid) from anon;
revoke execute on function public.handle_new_user() from anon, authenticated;

drop policy if exists "admin sessions no direct client access" on public.super_admin_sessions;
create policy "admin sessions no direct client access"
on public.super_admin_sessions
for select
to authenticated
using (false);

create index if not exists idx_super_admin_sessions_token on public.super_admin_sessions(token_hash);
create index if not exists idx_super_admin_sessions_expiry on public.super_admin_sessions(expires_at);