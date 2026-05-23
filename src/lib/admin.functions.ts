import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";

const ADMIN_COOKIE = "doukani_super_admin";
const SESSION_DAYS = 7;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function requireAdminSession() {
  const token = getCookie(ADMIN_COOKIE);
  if (!token) throw new Error("غير مصرح: يرجى تسجيل دخول الأدمين");

  const tokenHash = hashToken(token);
  const { data, error } = await supabaseAdmin
    .from("super_admin_sessions")
    .select("id, admin_id, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) throw new Error("جلسة الأدمين غير صالحة");
  if (new Date(data.expires_at).getTime() < Date.now()) {
    await supabaseAdmin.from("super_admin_sessions").delete().eq("id", data.id);
    deleteCookie(ADMIN_COOKIE, { path: "/" });
    throw new Error("انتهت جلسة الأدمين");
  }
  return data;
}

const couponSchema = z.object({
  id: z.string().uuid().optional(),
  code: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/),
  title: z.string().trim().min(2).max(160),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().min(0).max(100000),
  appliesTo: z.enum(["free", "starter", "pro", "enterprise"]).nullable().optional(),
  maxRedemptions: z.number().int().min(0).max(1000000).nullable().optional(),
  isActive: z.boolean(),
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        username: z.string().trim().min(3).max(80),
        password: z.string().min(6).max(120),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: verified, error } = await supabaseAdmin.rpc("verify_super_admin", {
      _username: data.username,
      _password: data.password,
    });

    if (error) throw new Error("تعذر التحقق من حساب الأدمين");
    const admin = verified?.[0];
    if (!admin) throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseAdmin.from("super_admin_sessions").insert({
      admin_id: admin.admin_id,
      token_hash: hashToken(token),
      expires_at: expiresAt,
    });
    if (insertError) throw new Error("تعذر إنشاء جلسة الأدمين");

    await supabaseAdmin
      .from("super_admin_accounts")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", admin.admin_id);

    setCookie(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    });

    return { admin: { id: admin.admin_id, displayName: admin.display_name } };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const token = getCookie(ADMIN_COOKIE);
  if (token) {
    await supabaseAdmin.from("super_admin_sessions").delete().eq("token_hash", hashToken(token));
  }
  deleteCookie(ADMIN_COOKIE, { path: "/" });
  return { ok: true };
});

export const getAdminDashboard = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();

  const [
    stores,
    products,
    orders,
    contacts,
    plans,
    templates,
    ads,
    content,
    reviews,
    coupons,
    tickets,
    customers,
  ] = await Promise.all([
    supabaseAdmin
      .from("stores")
      .select("*, store_templates(*)", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("products")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(200),
    supabaseAdmin
      .from("orders")
      .select("*, stores(name, slug), order_items(*)", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(300),
    supabaseAdmin
      .from("contact_messages")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .order("monthly_price", { ascending: true }),
    supabaseAdmin.from("store_templates").select("*").order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("platform_ads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin.from("platform_content").select("*"),
    supabaseAdmin
      .from("store_reviews")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("discount_coupons")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("support_tickets")
      .select("*, stores(name, slug)", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin.from("store_customers").select("id", { count: "exact", head: true }),
  ]);

  const orderRows = orders.data ?? [];
  const productRows = products.data ?? [];
  const storeRows = stores.data ?? [];
  const revenue = orderRows.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  const profit = orderRows.reduce(
    (sum, order) => sum + Number(order.total ?? 0) - Number(order.total_cost ?? 0),
    0,
  );
  const monthlyRevenue = orderRows
    .filter((order) => new Date(order.created_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000)
    .reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  const financeByStore = storeRows.map((store) => {
    const storeOrders = orderRows.filter((order) => order.store_id === store.id);
    const sales = storeOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
    const costs = storeOrders.reduce((sum, order) => sum + Number(order.total_cost ?? 0), 0);
    return {
      storeId: store.id,
      name: store.name,
      slug: store.slug,
      status: store.status,
      orders: storeOrders.length,
      sales,
      profit: sales - costs,
      products: productRows.filter((product) => product.store_id === store.id).length,
    };
  });

  const chart = Array.from({ length: 14 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    const key = date.toISOString().slice(0, 10);
    const dayOrders = orderRows.filter((order) => order.created_at?.slice(0, 10) === key);
    const sales = dayOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
    const cost = dayOrders.reduce((sum, order) => sum + Number(order.total_cost ?? 0), 0);
    return { date: key, day: key.slice(5), sales, profit: sales - cost, orders: dayOrders.length };
  });

  return {
    counts: {
      stores: stores.count ?? storeRows.length,
      products: products.count ?? productRows.length,
      orders: orders.count ?? orderRows.length,
      contacts: contacts.count ?? contacts.data?.length ?? 0,
      reviews: reviews.count ?? reviews.data?.length ?? 0,
      tickets: tickets.count ?? tickets.data?.length ?? 0,
      customers: customers.count ?? 0,
      suspended: storeRows.filter((store) => store.status === "suspended").length,
      pending: storeRows.filter((store) => store.status === "pending_verification").length,
    },
    finance: {
      revenue,
      profit,
      monthlyRevenue,
      averageOrder: orderRows.length ? revenue / orderRows.length : 0,
    },
    chart,
    financeByStore,
    stores: storeRows,
    products: productRows,
    orders: orderRows,
    plans: plans.data ?? [],
    templates: templates.data ?? [],
    ads: ads.data ?? [],
    content: content.data ?? [],
    messages: contacts.data ?? [],
    reviews: reviews.data ?? [],
    coupons: coupons.data ?? [],
    tickets: tickets.data ?? [],
  };
});

export const updateStoreModeration = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        storeId: z.string().uuid(),
        status: z.enum(["active", "rejected", "suspended", "pending_verification"]),
        reason: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession();
    const { data: prev } = await supabaseAdmin
      .from("stores")
      .select("status")
      .eq("id", data.storeId)
      .maybeSingle();
    const patch = {
      status: data.status,
      rejection_reason: data.status === "rejected" ? (data.reason ?? null) : null,
      banned_reason:
        data.status === "suspended" ? (data.reason ?? "مخالفة شروط المنصة") : null,
      approved_at: data.status === "active" ? new Date().toISOString() : null,
    };
    const { error } = await supabaseAdmin.from("stores").update(patch).eq("id", data.storeId);
    if (error) throw new Error("تعذر تحديث حالة المتجر");
    await supabaseAdmin.from("store_moderation_logs").insert({
      store_id: data.storeId,
      previous_status: prev?.status ?? null,
      new_status: data.status,
      reason: data.reason ?? null,
      created_by_admin: session.admin_id,
    });
    return { ok: true };
  });

export const getStoreModerationLogs = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ storeId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    await requireAdminSession();
    const { data: logs, error } = await supabaseAdmin
      .from("store_moderation_logs")
      .select("*")
      .eq("store_id", data.storeId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error("تعذر تحميل سجل الإجراءات");
    return { logs: logs ?? [] };
  });


export const updateStoreSubscription = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        storeId: z.string().uuid(),
        tier: z.enum(["free", "starter", "pro", "enterprise"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdminSession();
    const { error } = await supabaseAdmin
      .from("stores")
      .update({ subscription_tier: data.tier })
      .eq("id", data.storeId);
    if (error) throw new Error("تعذر ترقية المتجر");
    return { ok: true };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        orderId: z.string().uuid(),
        status: z.enum([
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "returned",
          "cancelled",
        ]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdminSession();
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.orderId);
    if (error) throw new Error("تعذر تحديث الطلب");
    return { ok: true };
  });

export const toggleProductVisibility = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ productId: z.string().uuid(), isActive: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdminSession();
    const { error } = await supabaseAdmin
      .from("products")
      .update({ is_active: data.isActive })
      .eq("id", data.productId);
    if (error) throw new Error("تعذر تحديث المنتج");
    return { ok: true };
  });

export const updatePlanPricing = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        planId: z.string().uuid(),
        monthlyPrice: z.number().min(0).max(100000),
        productLimit: z.number().int().min(0).max(1000000),
        aiCredits: z.number().int().min(0).max(1000000),
        staffLimit: z.number().int().min(1).max(10000).optional(),
        bankTransferEnabled: z.boolean(),
        advancedAnalytics: z.boolean().optional(),
        customDomain: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdminSession();
    const { error } = await supabaseAdmin
      .from("subscription_plans")
      .update({
        monthly_price: data.monthlyPrice,
        product_limit: data.productLimit,
        ai_credits: data.aiCredits,
        staff_limit: data.staffLimit,
        bank_transfer_enabled: data.bankTransferEnabled,
        advanced_analytics: data.advancedAnalytics,
        custom_domain: data.customDomain,
      })
      .eq("id", data.planId);
    if (error) throw new Error("تعذر تحديث سعر الاشتراك");
    return { ok: true };
  });

export const updateTemplateAccess = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        templateId: z.string().uuid(),
        access: z.enum(["free", "starter", "pro", "enterprise"]),
        isActive: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdminSession();
    const { error } = await supabaseAdmin
      .from("store_templates")
      .update({ access: data.access, is_active: data.isActive })
      .eq("id", data.templateId);
    if (error) throw new Error("تعذر تحديث القالب");
    return { ok: true };
  });

export const updatePlatformContent = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        key: z.string().min(2).max(80),
        title: z.string().min(2).max(160),
        body: z.string().min(2).max(5000),
        data: z.record(z.unknown()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdminSession();
    const { error } = await supabaseAdmin.from("platform_content").upsert({
      key: data.key,
      title_ar: data.title,
      body_ar: data.body,
      data: (data.data ?? {}) as Json,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error("تعذر تحديث محتوى المنصة");
    return { ok: true };
  });

export const upsertPlatformAd = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().min(2).max(160),
        description: z.string().max(500).optional(),
        targetUrl: z.string().url().optional().or(z.literal("")),
        imageUrl: z.string().url().optional().or(z.literal("")),
        placement: z.string().min(2).max(80).optional(),
        isActive: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdminSession();
    const { error } = await supabaseAdmin.from("platform_ads").upsert({
      id: data.id,
      title_ar: data.title,
      description_ar: data.description ?? null,
      target_url: data.targetUrl || null,
      image_url: data.imageUrl || null,
      placement: data.placement ?? "home",
      is_active: data.isActive,
    });
    if (error) throw new Error("تعذر حفظ الإعلان");
    return { ok: true };
  });

export const upsertDiscountCoupon = createServerFn({ method: "POST" })
  .inputValidator((input) => couponSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdminSession();
    const { error } = await supabaseAdmin.from("discount_coupons").upsert({
      id: data.id,
      code: data.code.toUpperCase(),
      title_ar: data.title,
      discount_type: data.discountType,
      discount_value: data.discountValue,
      applies_to: data.appliesTo ?? null,
      max_redemptions: data.maxRedemptions ?? null,
      is_active: data.isActive,
    });
    if (error) throw new Error("تعذر حفظ الكوبون");
    return { ok: true };
  });

export const deleteDiscountCoupon = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ couponId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    await requireAdminSession();
    const { error } = await supabaseAdmin.from("discount_coupons").delete().eq("id", data.couponId);
    if (error) throw new Error("تعذر حذف الكوبون");
    return { ok: true };
  });

export const updateSupportTicket = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        ticketId: z.string().uuid(),
        status: z.enum(["open", "in_progress", "resolved", "closed"]),
        adminNotes: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdminSession();
    const { error } = await supabaseAdmin
      .from("support_tickets")
      .update({ status: data.status, admin_notes: data.adminNotes ?? null })
      .eq("id", data.ticketId);
    if (error) throw new Error("تعذر تحديث تذكرة الدعم");
    return { ok: true };
  });

export const markContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ messageId: z.string().uuid(), isRead: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdminSession();
    const { error } = await supabaseAdmin
      .from("contact_messages")
      .update({ is_read: data.isRead })
      .eq("id", data.messageId);
    if (error) throw new Error("تعذر تحديث رسالة التواصل");
    return { ok: true };
  });
