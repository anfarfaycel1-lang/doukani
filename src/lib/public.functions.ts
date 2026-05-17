import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getLandingData = createServerFn({ method: "GET" }).handler(async () => {
  const [plans, templates, ads, content, stores, reviews] = await Promise.all([
    supabaseAdmin.from("subscription_plans").select("*").eq("is_active", true).order("monthly_price"),
    supabaseAdmin.from("store_templates").select("*").eq("is_active", true).order("sort_order").limit(20),
    supabaseAdmin.from("platform_ads").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(4),
    supabaseAdmin.from("platform_content").select("*"),
    supabaseAdmin.from("stores").select("id,name,slug,business_type,city,logo_url,subscription_tier").eq("status", "active").order("created_at", { ascending: false }).limit(8),
    supabaseAdmin.from("store_reviews").select("*").eq("is_approved", true).order("created_at", { ascending: false }).limit(8),
  ]);

  return {
    plans: plans.data ?? [],
    templates: templates.data ?? [],
    ads: ads.data ?? [],
    content: content.data ?? [],
    stores: stores.data ?? [],
    reviews: reviews.data ?? [],
  };
});

export const sendContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        name: z.string().trim().min(2).max(100),
        email: z.string().trim().email().max(255).optional().or(z.literal("")),
        phone: z.string().trim().max(40).optional(),
        message: z.string().trim().min(10).max(1200),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      message: data.message,
      source: "website",
    });
    if (error) throw new Error("تعذر إرسال الرسالة حالياً");
    return { ok: true };
  });

export const getPublicStore = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: z.string().min(2).max(80) }).parse(input))
  .handler(async ({ data }) => {
    const { data: store, error } = await supabaseAdmin
      .from("stores")
      .select("*, store_templates(*)")
      .eq("slug", data.slug)
      .in("status", ["active"])
      .maybeSingle();
    if (error || !store) return { store: null, products: [], categories: [] };

    const [products, categories, reviews] = await Promise.all([
      supabaseAdmin.from("products").select("*").eq("store_id", store.id).eq("is_active", true).order("is_featured", { ascending: false }).order("created_at", { ascending: false }),
      supabaseAdmin.from("product_categories").select("*").eq("store_id", store.id).order("sort_order"),
      supabaseAdmin.from("store_reviews").select("*").eq("store_id", store.id).eq("is_approved", true).limit(6),
    ]);
    return { store, products: products.data ?? [], categories: categories.data ?? [], reviews: reviews.data ?? [] };
  });

export const createCustomerOrder = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        storeId: z.string().uuid(),
        customer: z.object({
          name: z.string().trim().min(2).max(120),
          phone: z.string().trim().min(6).max(40),
          city: z.string().trim().min(2).max(80),
          address: z.string().trim().min(5).max(300),
        }),
        items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).min(1).max(20),
        paymentMethod: z.enum(["cod", "bank_transfer", "card"]).default("cod"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: existingCustomer } = await supabaseAdmin
      .from("store_customers")
      .select("id,is_blacklisted")
      .eq("store_id", data.storeId)
      .eq("phone", data.customer.phone)
      .maybeSingle();

    if (existingCustomer?.is_blacklisted) throw new Error("لا يمكن إتمام الطلب لهذا الرقم");

    const customerId = existingCustomer?.id ??
      (
        await supabaseAdmin
          .from("store_customers")
          .insert({ store_id: data.storeId, name: data.customer.name, phone: data.customer.phone, city: data.customer.city })
          .select("id")
          .single()
      ).data?.id;

    if (!customerId) throw new Error("تعذر إنشاء العميل");

    const productIds = data.items.map((item) => item.productId);
    const { data: products, error: productError } = await supabaseAdmin.from("products").select("id,name,price,cost,stock").in("id", productIds).eq("store_id", data.storeId);
    if (productError || !products?.length) throw new Error("المنتجات غير متاحة");

    const items = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error("منتج غير موجود");
      return {
        product,
        quantity: item.quantity,
        lineTotal: Number(product.price) * item.quantity,
        lineCost: Number(product.cost) * item.quantity,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const totalCost = items.reduce((sum, item) => sum + item.lineCost, 0);
    const orderNumber = `DK-${Date.now().toString().slice(-8)}`;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        store_id: data.storeId,
        customer_id: customerId,
        order_number: orderNumber,
        payment_method: data.paymentMethod,
        subtotal,
        total: subtotal,
        total_cost: totalCost,
        city: data.customer.city,
        shipping_address: data.customer.address,
        cod_risk_score: data.paymentMethod === "cod" ? 12 : 0,
      })
      .select("id,order_number,status,total")
      .single();
    if (orderError || !order) throw new Error("تعذر إنشاء الطلب");

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        unit_cost: item.product.cost,
      })),
    );
    if (itemsError) throw new Error("تعذر حفظ تفاصيل الطلب");

    return { order };
  });

export const trackOrder = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ orderNumber: z.string().min(4).max(40), phone: z.string().min(6).max(40) }).parse(input))
  .handler(async ({ data }) => {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("order_number,status,total,shipping_company,tracking_code,created_at,store_customers!inner(phone,name)")
      .eq("order_number", data.orderNumber)
      .eq("store_customers.phone", data.phone)
      .maybeSingle();
    return { order };
  });
