create extension if not exists pgcrypto;

create type public.app_role as enum ('super_admin', 'merchant', 'customer');
create type public.store_status as enum ('draft', 'pending_verification', 'active', 'rejected', 'suspended');
create type public.subscription_tier as enum ('free', 'starter', 'pro', 'enterprise');
create type public.order_status as enum ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'returned', 'cancelled');
create type public.payment_method as enum ('cod', 'bank_transfer', 'card', 'paypal', 'moroccan_gateway');
create type public.template_access as enum ('free', 'starter', 'pro', 'enterprise');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  full_name text,
  phone text,
  preferred_language text not null default 'ar',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table public.super_admin_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  display_name text not null default 'مدير المنصة',
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  tier public.subscription_tier not null unique,
  name_ar text not null,
  monthly_price numeric(12,2) not null default 0,
  product_limit integer not null default 0,
  ai_credits integer not null default 0,
  staff_limit integer not null default 1,
  custom_domain boolean not null default false,
  advanced_analytics boolean not null default false,
  bank_transfer_enabled boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_templates (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  category text not null,
  description_ar text not null,
  access public.template_access not null default 'free',
  layout jsonb not null default '{}'::jsonb,
  preview_theme text not null default 'classic',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  template_id uuid references public.store_templates(id) on delete set null,
  name text not null,
  slug text not null unique,
  business_type text,
  city text,
  logo_url text,
  whatsapp text,
  tax_number text,
  status public.store_status not null default 'pending_verification',
  subscription_tier public.subscription_tier not null default 'free',
  brand_colors jsonb not null default '{"primary":"#0f7a4f","accent":"#d5a84f"}'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  custom_domain text,
  bank_account jsonb not null default '{}'::jsonb,
  identity_document_url text,
  rejection_reason text,
  approved_at timestamptz,
  banned_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.product_categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  cost numeric(12,2) not null default 0,
  stock integer not null default 0,
  low_stock_threshold integer not null default 5,
  images text[] not null default '{}',
  variants jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid,
  name text not null,
  phone text not null,
  city text,
  email text,
  is_blacklisted boolean not null default false,
  blacklist_reason text,
  created_at timestamptz not null default now(),
  unique (store_id, phone)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid references public.store_customers(id) on delete set null,
  order_number text not null unique,
  status public.order_status not null default 'pending',
  payment_method public.payment_method not null default 'cod',
  subtotal numeric(12,2) not null default 0,
  shipping_fee numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  total_cost numeric(12,2) not null default 0,
  city text,
  shipping_company text,
  tracking_code text,
  shipping_address text,
  cod_risk_score integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0,
  unit_cost numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.store_reviews (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade,
  customer_name text not null,
  rating integer not null default 5,
  comment text not null,
  is_featured boolean not null default false,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.platform_content (
  key text primary key,
  title_ar text not null,
  body_ar text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.platform_ads (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  description_ar text,
  image_url text,
  target_url text,
  placement text not null default 'home',
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  message text not null,
  source text not null default 'website',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.shipping_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  api_endpoint text,
  is_active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create or replace function public.is_store_owner(_store_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.stores
    where id = _store_id and owner_user_id = _user_id
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), new.raw_user_meta_data ->> 'phone')
  on conflict (user_id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, 'merchant')
  on conflict (user_id, role) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger update_profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at_column();
create trigger update_subscription_plans_updated_at before update on public.subscription_plans for each row execute function public.update_updated_at_column();
create trigger update_store_templates_updated_at before update on public.store_templates for each row execute function public.update_updated_at_column();
create trigger update_stores_updated_at before update on public.stores for each row execute function public.update_updated_at_column();
create trigger update_products_updated_at before update on public.products for each row execute function public.update_updated_at_column();
create trigger update_orders_updated_at before update on public.orders for each row execute function public.update_updated_at_column();
create trigger update_platform_ads_updated_at before update on public.platform_ads for each row execute function public.update_updated_at_column();
create trigger update_shipping_providers_updated_at before update on public.shipping_providers for each row execute function public.update_updated_at_column();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.super_admin_accounts enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.store_templates enable row level security;
alter table public.stores enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.store_customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.store_reviews enable row level security;
alter table public.platform_content enable row level security;
alter table public.platform_ads enable row level security;
alter table public.contact_messages enable row level security;
alter table public.shipping_providers enable row level security;

create policy "profiles own read" on public.profiles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'super_admin'));
create policy "profiles own update" on public.profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "roles own read" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'super_admin'));

create policy "plans public read" on public.subscription_plans for select using (is_active = true or public.has_role(auth.uid(), 'super_admin'));
create policy "plans admin manage" on public.subscription_plans for all to authenticated using (public.has_role(auth.uid(), 'super_admin')) with check (public.has_role(auth.uid(), 'super_admin'));

create policy "templates public read" on public.store_templates for select using (is_active = true or public.has_role(auth.uid(), 'super_admin'));
create policy "templates admin manage" on public.store_templates for all to authenticated using (public.has_role(auth.uid(), 'super_admin')) with check (public.has_role(auth.uid(), 'super_admin'));

create policy "stores public active read" on public.stores for select using (status = 'active' or owner_user_id = auth.uid() or public.has_role(auth.uid(), 'super_admin'));
create policy "stores owner insert" on public.stores for insert to authenticated with check (owner_user_id = auth.uid());
create policy "stores owner update" on public.stores for update to authenticated using (owner_user_id = auth.uid() or public.has_role(auth.uid(), 'super_admin')) with check (owner_user_id = auth.uid() or public.has_role(auth.uid(), 'super_admin'));
create policy "stores owner delete" on public.stores for delete to authenticated using (owner_user_id = auth.uid() or public.has_role(auth.uid(), 'super_admin'));

create policy "categories public read" on public.product_categories for select using (exists (select 1 from public.stores s where s.id = store_id and (s.status = 'active' or s.owner_user_id = auth.uid() or public.has_role(auth.uid(), 'super_admin'))));
create policy "categories owner manage" on public.product_categories for all to authenticated using (public.is_store_owner(store_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin')) with check (public.is_store_owner(store_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin'));

create policy "products public read" on public.products for select using (is_active = true or public.is_store_owner(store_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin'));
create policy "products owner manage" on public.products for all to authenticated using (public.is_store_owner(store_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin')) with check (public.is_store_owner(store_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin'));

create policy "customers owner manage" on public.store_customers for all to authenticated using (public.is_store_owner(store_id, auth.uid()) or user_id = auth.uid() or public.has_role(auth.uid(), 'super_admin')) with check (public.is_store_owner(store_id, auth.uid()) or user_id = auth.uid() or public.has_role(auth.uid(), 'super_admin'));

create policy "orders owner customer read" on public.orders for select to authenticated using (public.is_store_owner(store_id, auth.uid()) or exists (select 1 from public.store_customers c where c.id = customer_id and c.user_id = auth.uid()) or public.has_role(auth.uid(), 'super_admin'));
create policy "orders owner manage" on public.orders for all to authenticated using (public.is_store_owner(store_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin')) with check (public.is_store_owner(store_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin'));

create policy "order items related read" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (public.is_store_owner(o.store_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin'))));
create policy "order items owner manage" on public.order_items for all to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (public.is_store_owner(o.store_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin')))) with check (exists (select 1 from public.orders o where o.id = order_id and (public.is_store_owner(o.store_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin'))));

create policy "reviews public approved read" on public.store_reviews for select using (is_approved = true or public.has_role(auth.uid(), 'super_admin'));
create policy "reviews admin manage" on public.store_reviews for all to authenticated using (public.has_role(auth.uid(), 'super_admin')) with check (public.has_role(auth.uid(), 'super_admin'));

create policy "content public read" on public.platform_content for select using (true);
create policy "content admin manage" on public.platform_content for all to authenticated using (public.has_role(auth.uid(), 'super_admin')) with check (public.has_role(auth.uid(), 'super_admin'));

create policy "ads public active read" on public.platform_ads for select using (is_active = true or public.has_role(auth.uid(), 'super_admin'));
create policy "ads admin manage" on public.platform_ads for all to authenticated using (public.has_role(auth.uid(), 'super_admin')) with check (public.has_role(auth.uid(), 'super_admin'));

create policy "contact public create" on public.contact_messages for insert with check (true);
create policy "contact admin read" on public.contact_messages for select to authenticated using (public.has_role(auth.uid(), 'super_admin'));
create policy "contact admin update" on public.contact_messages for update to authenticated using (public.has_role(auth.uid(), 'super_admin')) with check (public.has_role(auth.uid(), 'super_admin'));

create policy "shipping public read" on public.shipping_providers for select using (is_active = true or public.has_role(auth.uid(), 'super_admin'));
create policy "shipping admin manage" on public.shipping_providers for all to authenticated using (public.has_role(auth.uid(), 'super_admin')) with check (public.has_role(auth.uid(), 'super_admin'));

insert into public.super_admin_accounts (username, password_hash, display_name)
values ('fayceljojobiso', crypt('123123y', gen_salt('bf')), 'Faycel Super Admin')
on conflict (username) do nothing;

insert into public.subscription_plans (tier, name_ar, monthly_price, product_limit, ai_credits, staff_limit, custom_domain, advanced_analytics, bank_transfer_enabled) values
('free', 'مجانية', 0, 10, 20, 1, false, false, true),
('starter', 'Starter', 99, 100, 500, 2, false, false, true),
('pro', 'Pro', 299, 1000, 3000, 8, true, true, true),
('enterprise', 'Enterprise', 999, 100000, 20000, 50, true, true, true)
on conflict (tier) do nothing;

insert into public.store_templates (name_ar, category, description_ar, access, preview_theme, sort_order, layout) values
('أزياء مغربية فاخرة', 'fashion', 'واجهة موضة مع سلايد شو واسع وأقسام مجموعات', 'free', 'fashion-luxe', 1, '{"hero":"slideshow","sections":["collections","featured","testimonials"]}'),
('إلكترونيات سريعة', 'electronics', 'شبكة منتجات تقنية مع عروض وسلايدر مواصفات', 'starter', 'tech-grid', 2, '{"hero":"product-slider","sections":["deals","categories","reviews"]}'),
('منتجات يدوية دافئة', 'handmade', 'تصميم حرفي بقصص المنتج وصور كبيرة', 'free', 'artisan', 3, '{"hero":"story-slider","sections":["craft","featured","instagram"]}'),
('متجر فاخر بسيط', 'luxury', 'واجهة راقية ومساحات بيضاء وكتالوج أنيق', 'pro', 'minimal-luxury', 4, '{"hero":"editorial","sections":["lookbook","best-sellers","brand-story"]}'),
('جمال وعناية', 'beauty', 'سلايدر قبل/بعد وأقسام روتين العناية', 'starter', 'beauty-soft', 5, '{"hero":"slideshow","sections":["routine","bundles","reviews"]}'),
('أكل منزلي', 'food', 'قائمة مصورة مع عروض يومية وواتساب بارز', 'starter', 'food-market', 6, '{"hero":"daily-offer","sections":["menu","combos","delivery"]}'),
('أطفال وألعاب', 'kids', 'تصميم مرح مع تصنيفات عمرية وسلايدر منتجات', 'starter', 'kids-play', 7, '{"hero":"playful-slider","sections":["ages","featured","safety"]}'),
('رياضة ولياقة', 'sports', 'واجهة حماسية للعروض والباقات الرياضية', 'pro', 'sports-bold', 8, '{"hero":"action-slider","sections":["gear","programs","reviews"]}'),
('ديكور منزلي', 'home', 'سلايدر غرف وأقسام حسب المساحات', 'starter', 'home-studio', 9, '{"hero":"room-slider","sections":["rooms","sets","inspiration"]}'),
('كتب وتعليم', 'books', 'واجهة هادئة للكتب والدورات الرقمية', 'free', 'book-shelf', 10, '{"hero":"featured-books","sections":["categories","authors","bundles"]}'),
('مجوهرات', 'jewelry', 'تصميم داكن ذهبي مع صور قريبة وكتالوج فاخر', 'pro', 'jewel-noir', 11, '{"hero":"lux-slider","sections":["collections","craft","trust"]}'),
('عطور', 'perfume', 'واجهة حسية مع مجموعات وروائح مميزة', 'pro', 'perfume-atelier', 12, '{"hero":"mood-slider","sections":["notes","sets","reviews"]}'),
('مستلزمات سيارات', 'auto', 'كتالوج عملي مع بحث وتصنيفات واضحة', 'starter', 'auto-parts', 13, '{"hero":"parts-search","sections":["categories","deals","compatibility"]}'),
('منتجات رقمية', 'digital', 'واجهة SaaS للملفات والدورات والخدمات', 'pro', 'digital-clean', 14, '{"hero":"digital-offer","sections":["features","pricing","faq"]}'),
('هدايا ومناسبات', 'gifts', 'سلايدر مناسبات وباقات جاهزة', 'starter', 'gift-moments', 15, '{"hero":"occasion-slider","sections":["occasions","bundles","delivery"]}'),
('زراعة ونباتات', 'plants', 'تصميم أخضر مع دليل عناية وتصنيفات نباتات', 'starter', 'plant-care', 16, '{"hero":"green-slider","sections":["care","categories","tips"]}'),
('أثاث', 'furniture', 'عرض غرف واسع مع قياسات وتنسيقات', 'pro', 'furniture-gallery', 17, '{"hero":"interior-slider","sections":["rooms","materials","delivery"]}'),
('حرف تقليدية', 'craft', 'قصة الحرفي وسلايد شو للمنتجات التراثية', 'free', 'moroccan-craft', 18, '{"hero":"heritage-slider","sections":["story","collections","reviews"]}'),
('ملابس رياضية', 'activewear', 'صور حركة وأقسام رجالي/نسائي', 'starter', 'active-motion', 19, '{"hero":"motion-slider","sections":["men","women","performance"]}'),
('متجر شامل', 'general', 'قالب مرن متعدد الأقسام لأي نشاط', 'free', 'general-pro', 20, '{"hero":"multi-slider","sections":["categories","featured","offers","reviews"]}')
on conflict do nothing;

insert into public.shipping_providers (name, api_endpoint, config) values
('Amana', null, '{"country":"MA","cod":true}'::jsonb),
('Jibli', null, '{"country":"MA","cod":true}'::jsonb),
('Cathedis', null, '{"country":"MA","cod":true}'::jsonb),
('Chrono Diali', null, '{"country":"MA","cod":true}'::jsonb)
on conflict (name) do nothing;

insert into public.platform_content (key, title_ar, body_ar, data) values
('terms', 'شروط الاشتراك', 'يلتزم التجار بعدم مخالفة قوانين الدولة وعدم بيع المنتجات المحظورة مثل الأدوية الطبية بدون ترخيص، المخدرات، الأسلحة، الخمور والمسكرات، وأي منتجات ممنوعة قانونياً.', '{}'::jsonb),
('privacy', 'سياسة الخصوصية', 'نحمي بيانات التجار والعملاء ونستخدمها فقط لتشغيل المتاجر وتحسين الخدمة والتواصل عند الحاجة.', '{}'::jsonb),
('contact', 'تواصل معنا', 'الهاتف: +212600000000 — واتساب: +212600000000 — البريد: contact@doukani.ma', '{"phone":"+212600000000","whatsapp":"+212600000000","email":"contact@doukani.ma"}'::jsonb),
('success_numbers', 'أرقام المنصة', 'أرقام قابلة للتعديل من إدارة المنصة.', '{"stores":1280,"orders":45000,"cities":42,"satisfaction":96}'::jsonb)
on conflict (key) do nothing;

insert into public.platform_ads (title_ar, description_ar, placement, is_active) values
('عرض إطلاق دكاني', 'شهر Pro مجاناً لأول 100 متجر موثق.', 'home', true)
on conflict do nothing;

insert into storage.buckets (id, name, public) values
('product-images', 'product-images', true),
('store-assets', 'store-assets', true),
('identity-documents', 'identity-documents', false)
on conflict (id) do nothing;

create policy "product images public read" on storage.objects for select using (bucket_id = 'product-images');
create policy "store assets public read" on storage.objects for select using (bucket_id = 'store-assets');
create policy "users upload product images" on storage.objects for insert to authenticated with check (bucket_id in ('product-images','store-assets') and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users manage product images" on storage.objects for update to authenticated using (bucket_id in ('product-images','store-assets') and auth.uid()::text = (storage.foldername(name))[1]);
create policy "identity docs owner read" on storage.objects for select to authenticated using (bucket_id = 'identity-documents' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "identity docs owner upload" on storage.objects for insert to authenticated with check (bucket_id = 'identity-documents' and auth.uid()::text = (storage.foldername(name))[1]);

create index idx_stores_owner on public.stores(owner_user_id);
create index idx_stores_slug on public.stores(slug);
create index idx_products_store on public.products(store_id);
create index idx_orders_store_created on public.orders(store_id, created_at desc);
create index idx_orders_status on public.orders(status);
create index idx_customers_store_phone on public.store_customers(store_id, phone);