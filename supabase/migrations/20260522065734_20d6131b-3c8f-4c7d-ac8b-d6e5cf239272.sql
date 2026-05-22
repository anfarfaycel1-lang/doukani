create table if not exists public.discount_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title_ar text not null,
  discount_type text not null default 'percentage',
  discount_value numeric(12,2) not null default 0,
  applies_to public.subscription_tier,
  max_redemptions integer,
  redeemed_count integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discount_coupons_type_check check (discount_type in ('percentage', 'fixed')),
  constraint discount_coupons_value_check check (discount_value >= 0)
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  store_id uuid references public.stores(id) on delete set null,
  name text not null,
  email text,
  phone text,
  subject text not null,
  message text not null,
  priority text not null default 'normal',
  status text not null default 'open',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_tickets_priority_check check (priority in ('low', 'normal', 'high', 'urgent')),
  constraint support_tickets_status_check check (status in ('open', 'in_progress', 'resolved', 'closed'))
);

alter table public.discount_coupons enable row level security;
alter table public.support_tickets enable row level security;

create policy "profiles own insert" on public.profiles
for insert to authenticated
with check (auth.uid() = user_id);

create policy "roles own merchant insert" on public.user_roles
for insert to authenticated
with check (auth.uid() = user_id and role = 'merchant'::public.app_role);

create policy "coupons admin manage" on public.discount_coupons
for all to authenticated
using (public.has_role(auth.uid(), 'super_admin'))
with check (public.has_role(auth.uid(), 'super_admin'));

create policy "support own create" on public.support_tickets
for insert to authenticated
with check (auth.uid() = user_id);

create policy "support own read" on public.support_tickets
for select to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'super_admin'));

create policy "support admin update" on public.support_tickets
for update to authenticated
using (public.has_role(auth.uid(), 'super_admin'))
with check (public.has_role(auth.uid(), 'super_admin'));

create policy "support admin delete" on public.support_tickets
for delete to authenticated
using (public.has_role(auth.uid(), 'super_admin'));

drop trigger if exists update_discount_coupons_updated_at on public.discount_coupons;
create trigger update_discount_coupons_updated_at
before update on public.discount_coupons
for each row execute function public.update_updated_at_column();

drop trigger if exists update_support_tickets_updated_at on public.support_tickets;
create trigger update_support_tickets_updated_at
before update on public.support_tickets
for each row execute function public.update_updated_at_column();

create index if not exists idx_discount_coupons_active on public.discount_coupons(is_active, code);
create index if not exists idx_support_tickets_status on public.support_tickets(status, created_at desc);
create index if not exists idx_support_tickets_user on public.support_tickets(user_id, created_at desc);
create index if not exists idx_products_store_active on public.products(store_id, is_active);
create index if not exists idx_orders_created_status on public.orders(created_at desc, status);

insert into public.discount_coupons (code, title_ar, discount_type, discount_value, applies_to, max_redemptions, is_active)
values ('WELCOME20', 'خصم ترحيبي 20%', 'percentage', 20, 'pro', 100, true)
on conflict (code) do nothing;