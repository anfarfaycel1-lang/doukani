import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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

  const [stores, products, orders, contacts, plans, templates, ads, content, reviews] = await Promise.all([
    supabaseAdmin.from("stores").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(12),
    supabaseAdmin.from("products").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("orders").select("id,total,total_cost,status,created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(200),
    supabaseAdmin.from("contact_messages").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(10),
    supabaseAdmin.from("subscription_plans").select("*").order("monthly_price", { ascending: true }),
    supabaseAdmin.from("store_templates").select("*").order("sort_order", { ascending: true }),
    supabaseAdmin.from("platform_ads").select("*").order("created_at", { ascending: false }).limit(10),
    supabaseAdmin.from("platform_content").select("*"),
    supabaseAdmin.from("store_reviews").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(10),
  ]);

  const orderRows = orders.data ?? [];
  const revenue = orderRows.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  const profit = orderRows.reduce((sum, order) => sum + Number(order.total ?? 0) - Number(order.total_cost ?? 0), 0);

  return {
    counts: {
      stores: stores.count ?? stores.data?.length ?? 0,
      products: products.count ?? 0,
      orders: orders.count ?? orderRows.length,
      contacts: contacts.count ?? contacts.data?.length ?? 0,
      reviews: reviews.count ?? reviews.data?.length ?? 0,
    },
    finance: { revenue, profit },
    stores: stores.data ?? [],
    plans: plans.data ?? [],
    templates: templates.data ?? [],
    ads: ads.data ?? [],
    content: content.data ?? [],
    messages: contacts.data ?? [],
    reviews: reviews.data ?? [],
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
    await requireAdminSession();
    const patch = {
      status: data.status,
      rejection_reason: data.status === "rejected" ? data.reason ?? null : null,
      banned_reason: data.status === "suspended" ? data.reason ?? null : null,
      approved_at: data.status === "active" ? new Date().toISOString() : null,
    };
    const { error } = await supabaseAdmin.from("stores").update(patch).eq("id", data.storeId);
    if (error) throw new Error("تعذر تحديث حالة المتجر");
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
        bankTransferEnabled: z.boolean(),
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
        bank_transfer_enabled: data.bankTransferEnabled,
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
      data: data.data ?? {},
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
      placement: "home",
      is_active: data.isActive,
    });
    if (error) throw new Error("تعذر حفظ الإعلان");
    return { ok: true };
  });
