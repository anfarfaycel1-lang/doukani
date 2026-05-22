import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || `store-${Date.now()}`;

export const getMerchantDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await Promise.all([
      supabase
        .from("profiles")
        .upsert(
          { user_id: userId, full_name: "تاجر دكاني" },
          { onConflict: "user_id", ignoreDuplicates: true },
        ),
      supabase
        .from("user_roles")
        .upsert(
          { user_id: userId, role: "merchant" },
          { onConflict: "user_id,role", ignoreDuplicates: true },
        ),
    ]);
    const { data: stores } = await supabase
      .from("stores")
      .select("*, store_templates(*)")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: false });

    const store = stores?.[0] ?? null;
    if (!store) {
      const { data: templates } = await supabase
        .from("store_templates")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
        .limit(20);
      return {
        store: null,
        templates: templates ?? [],
        products: [],
        orders: [],
        customers: [],
        lowStock: [],
        stats: { sales: 0, profit: 0, orders: 0, customers: 0 },
        chart: [],
      };
    }

    const [products, orders, customers, templates] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("store_customers")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("store_templates").select("*").eq("is_active", true).order("sort_order"),
    ]);

    const orderRows = orders.data ?? [];
    const sales = orderRows.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
    const profit = orderRows.reduce(
      (sum, order) => sum + Number(order.total ?? 0) - Number(order.total_cost ?? 0),
      0,
    );
    const lowStock = (products.data ?? []).filter(
      (product) => Number(product.stock) <= Number(product.low_stock_threshold),
    );
    const chart = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      const dayOrders = orderRows.filter((order) => order.created_at?.slice(0, 10) === key);
      return {
        date: key,
        sales: dayOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0),
        orders: dayOrders.length,
      };
    });

    return {
      store,
      templates: templates.data ?? [],
      products: products.data ?? [],
      orders: orderRows,
      customers: customers.data ?? [],
      lowStock,
      stats: { sales, profit, orders: orderRows.length, customers: customers.data?.length ?? 0 },
      chart,
    };
  });

export const ensureMerchantAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ fullName: z.string().max(160).optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [profile, role] = await Promise.all([
      supabase
        .from("profiles")
        .upsert(
          { user_id: userId, full_name: data.fullName || "تاجر دكاني" },
          { onConflict: "user_id", ignoreDuplicates: true },
        ),
      supabase
        .from("user_roles")
        .upsert(
          { user_id: userId, role: "merchant" },
          { onConflict: "user_id,role", ignoreDuplicates: true },
        ),
    ]);
    if (profile.error || role.error) throw new Error("تعذر تجهيز حساب التاجر");
    return { ok: true };
  });

export const createStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        name: z.string().trim().min(2).max(120),
        businessType: z.string().trim().min(2).max(80),
        city: z.string().trim().min(2).max(80),
        whatsapp: z.string().trim().min(6).max(40),
        templateId: z.string().uuid().optional(),
        taxNumber: z.string().max(80).optional(),
        socialLinks: z.record(z.string().url().or(z.literal(""))).optional(),
        bankAccount: z.record(z.string()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const baseSlug = slugify(data.name);
    let slug = baseSlug;
    for (let i = 1; i < 8; i += 1) {
      const { data: existing } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${i + 1}`;
    }

    const { data: store, error } = await supabase
      .from("stores")
      .insert({
        owner_user_id: userId,
        name: data.name,
        slug,
        business_type: data.businessType,
        city: data.city,
        whatsapp: data.whatsapp,
        template_id: data.templateId ?? null,
        tax_number: data.taxNumber ?? null,
        social_links: data.socialLinks ?? {},
        bank_account: data.bankAccount ?? {},
        status: "pending_verification",
      })
      .select("*")
      .single();

    if (error) throw new Error("تعذر إنشاء المتجر");
    return { store };
  });

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid().optional(),
        storeId: z.string().uuid(),
        name: z.string().trim().min(2).max(160),
        description: z.string().max(2000).optional(),
        price: z.number().min(0).max(1000000),
        cost: z.number().min(0).max(1000000),
        stock: z.number().int().min(0).max(1000000),
        lowStockThreshold: z.number().int().min(0).max(10000),
        images: z.array(z.string().url()).max(8).optional(),
        isFeatured: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const payload = {
      id: data.id,
      store_id: data.storeId,
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      cost: data.cost,
      stock: data.stock,
      low_stock_threshold: data.lowStockThreshold,
      images: data.images ?? [],
      is_featured: data.isFeatured ?? false,
      is_active: true,
    };
    const { data: product, error } = await supabase
      .from("products")
      .upsert(payload)
      .select("*")
      .single();
    if (error) throw new Error("تعذر حفظ المنتج");
    return { product };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ productId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products").delete().eq("id", data.productId);
    if (error) throw new Error("تعذر حذف المنتج");
    return { ok: true };
  });

export const updateStoreSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        storeId: z.string().uuid(),
        templateId: z.string().uuid().optional(),
        whatsapp: z.string().max(40).optional(),
        taxNumber: z.string().max(80).optional(),
        socialLinks: z.record(z.string().url().or(z.literal(""))).optional(),
        bankAccount: z.record(z.string()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("stores")
      .update({
        template_id: data.templateId ?? null,
        whatsapp: data.whatsapp,
        tax_number: data.taxNumber,
        social_links: data.socialLinks ?? {},
        bank_account: data.bankAccount ?? {},
      })
      .eq("id", data.storeId);
    if (error) throw new Error("تعذر تحديث إعدادات المتجر");
    return { ok: true };
  });

export const exportMerchantReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ storeId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: orders, error } = await context.supabase
      .from("orders")
      .select("order_number,status,total,total_cost,payment_method,city,created_at")
      .eq("store_id", data.storeId)
      .order("created_at", { ascending: false });
    if (error) throw new Error("تعذر تصدير التقرير");
    const rows = ["order_number,status,total,total_cost,profit,payment_method,city,created_at"];
    for (const order of orders ?? []) {
      rows.push(
        [
          order.order_number,
          order.status,
          order.total,
          order.total_cost,
          Number(order.total) - Number(order.total_cost),
          order.payment_method,
          order.city ?? "",
          order.created_at,
        ].join(","),
      );
    }
    return { filename: `doukani-report-${Date.now()}.csv`, csv: rows.join("\n") };
  });

export const generateProductCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ productName: z.string().min(2).max(160), language: z.enum(["darija", "fr"]) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const prompt =
      data.language === "darija"
        ? `كتب وصف قصير وجذاب بالدارجة المغربية لمنتج: ${data.productName}`
        : `Rédige une description courte et vendeuse en français pour: ${data.productName}`;
    const key = process.env.LOVABLE_API_KEY;
    if (!key)
      return {
        text:
          data.language === "darija"
            ? `${data.productName} بجودة مزيانة وثمن مناسب، مثالي للاستعمال اليومي.`
            : `${data.productName} de qualité, pratique et idéal pour un usage quotidien.`,
      };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error("تعذر توليد النص بالذكاء الاصطناعي");
    const json = await res.json();
    return { text: json.choices?.[0]?.message?.content ?? "" };
  });

export const createSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        storeId: z.string().uuid().optional(),
        name: z.string().trim().min(2).max(120),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().max(40).optional(),
        subject: z.string().trim().min(3).max(160),
        message: z.string().trim().min(10).max(2000),
        priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("support_tickets").insert({
      user_id: userId,
      store_id: data.storeId ?? null,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      subject: data.subject,
      message: data.message,
      priority: data.priority,
    });
    if (error) throw new Error("تعذر إرسال تذكرة الدعم");
    return { ok: true };
  });
