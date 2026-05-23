import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  adminLogin,
  adminLogout,
  deleteDiscountCoupon,
  getAdminDashboard,
  getStoreModerationLogs,
  markContactMessage,
  toggleProductVisibility,
  updateOrderStatus,
  updatePlanPricing,
  updatePlatformContent,
  updateStoreModeration,
  updateStoreSubscription,
  updateSupportTicket,
  updateTemplateAccess,
  upsertDiscountCoupon,
  upsertPlatformAd,
} from "@/lib/admin.functions";

import {
  BadgePercent,
  Ban,
  BarChart3,
  CheckCircle2,
  Coins,
  Eye,
  EyeOff,
  Headphones,
  Mail,
  Megaphone,
  MessageCircle,
  Package,
  PhoneCall,
  Save,
  Shield,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Super Admin — دكاني" },
      { name: "description", content: "واجهة إدارة منصة دكاني الشاملة." },
    ],
  }),
  component: AdminPage,
});

type AdminData = any;
type Tab =
  | "overview"
  | "stores"
  | "finance"
  | "orders"
  | "products"
  | "plans"
  | "coupons"
  | "ads"
  | "contact"
  | "support";

const tabs: Array<[Tab, string]> = [
  ["overview", "الرئيسية"],
  ["stores", "المتاجر"],
  ["finance", "التقارير المالية"],
  ["orders", "الطلبات"],
  ["products", "المنتجات"],
  ["plans", "الاشتراكات"],
  ["coupons", "الكوبونات"],
  ["ads", "الإعلانات"],
  ["contact", "الاتصال"],
  ["support", "الدعم الفني"],
];

const orderStatuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
] as const;
const storeStatuses = ["active", "pending_verification", "suspended", "rejected"] as const;
const tiers = ["free", "starter", "pro", "enterprise"] as const;

function AdminPage() {
  const loginFn = useServerFn(adminLogin);
  const logoutFn = useServerFn(adminLogout);
  const dashboardFn = useServerFn(getAdminDashboard);
  const moderationFn = useServerFn(updateStoreModeration);
  const subscriptionFn = useServerFn(updateStoreSubscription);
  const orderStatusFn = useServerFn(updateOrderStatus);
  const productVisibilityFn = useServerFn(toggleProductVisibility);
  const planFn = useServerFn(updatePlanPricing);
  const templateFn = useServerFn(updateTemplateAccess);
  const adFn = useServerFn(upsertPlatformAd);
  const couponFn = useServerFn(upsertDiscountCoupon);
  const deleteCouponFn = useServerFn(deleteDiscountCoupon);
  const supportFn = useServerFn(updateSupportTicket);
  const messageFn = useServerFn(markContactMessage);
  const contentFn = useServerFn(updatePlatformContent);
  const logsFn = useServerFn(getStoreModerationLogs);

  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<Record<string, any[]>>({});
  const [expandedStore, setExpandedStore] = useState<string | null>(null);

  const toggleLogs = async (storeId: string) => {
    if (expandedStore === storeId) {
      setExpandedStore(null);
      return;
    }
    if (!logs[storeId]) {
      const { logs: rows } = await logsFn({ data: { storeId } });
      setLogs((prev) => ({ ...prev, [storeId]: rows }));
    }
    setExpandedStore(storeId);
  };


  const [data, setData] = useState<AdminData | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [username, setUsername] = useState("fayceljojobiso");
  const [password, setPassword] = useState("123123y");
  const [error, setError] = useState("");
  const [coupon, setCoupon] = useState({
    id: "",
    code: "",
    title: "",
    discountType: "percentage",
    discountValue: 10,
    appliesTo: "pro",
    maxRedemptions: 100,
    isActive: true,
  });
  const [ad, setAd] = useState({
    id: "",
    title: "",
    description: "",
    targetUrl: "",
    imageUrl: "",
    placement: "home",
    isActive: true,
  });

  const load = async () => {
    try {
      setData(await dashboardFn());
      setError("");
    } catch {
      setData(null);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await loginFn({ data: { username, password } });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الدخول");
    }
  };

  const saveCoupon = async (event: FormEvent) => {
    event.preventDefault();
    await couponFn({
      data: {
        id: coupon.id || undefined,
        code: coupon.code,
        title: coupon.title,
        discountType: coupon.discountType as "percentage" | "fixed",
        discountValue: Number(coupon.discountValue),
        appliesTo:
          coupon.appliesTo === "all"
            ? null
            : (coupon.appliesTo as "free" | "starter" | "pro" | "enterprise"),
        maxRedemptions: Number(coupon.maxRedemptions) || null,
        isActive: coupon.isActive,
      },
    });
    setCoupon({
      id: "",
      code: "",
      title: "",
      discountType: "percentage",
      discountValue: 10,
      appliesTo: "pro",
      maxRedemptions: 100,
      isActive: true,
    });
    await load();
  };

  const saveAd = async (event: FormEvent) => {
    event.preventDefault();
    await adFn({
      data: {
        id: ad.id || undefined,
        title: ad.title,
        description: ad.description,
        targetUrl: ad.targetUrl,
        imageUrl: ad.imageUrl,
        placement: ad.placement,
        isActive: ad.isActive,
      },
    });
    setAd({
      id: "",
      title: "",
      description: "",
      targetUrl: "",
      imageUrl: "",
      placement: "home",
      isActive: true,
    });
    await load();
  };

  if (!data)
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <form
          onSubmit={login}
          className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-primary/10"
        >
          <Shield className="h-12 w-12 text-primary" />
          <h1 className="mt-4 text-3xl font-black">Super Admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            دخول مدير النظام للتحكم في المتاجر والطلبات والاشتراكات.
          </p>
          <input
            className="mt-6 h-11 w-full rounded-xl border border-input bg-background px-3"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            className="mt-3 h-11 w-full rounded-xl border border-input bg-background px-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <button className="btn-primary mt-5 w-full justify-center">دخول</button>
        </form>
      </main>
    );

  const contactContent = data.content.find((item: any) => item.key === "contact");
  const cards = [
    ["المتاجر", data.counts.stores, Store],
    ["الطلبات", data.counts.orders, ShoppingCart],
    ["المبيعات", `${Number(data.finance.revenue).toLocaleString()} د.م`, Coins],
    ["صافي الربح", `${Number(data.finance.profit).toLocaleString()} د.م`, BarChart3],
    ["المنتجات", data.counts.products, Package],
    ["العملاء", data.counts.customers, Users],
    ["المعلقة", data.counts.pending, Shield],
    ["الدعم", data.counts.tickets, Headphones],
  ] as const;

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
          <div>
            <h1 className="text-3xl font-black">إدارة منصة دكاني</h1>
            <p className="text-sm text-muted-foreground">
              متابعة المتاجر، الحسابات المالية، الطلبات، المنتجات، الإعلانات، التواصل والدعم الفني.
            </p>
          </div>
          <button
            onClick={async () => {
              await logoutFn();
              setData(null);
            }}
            className="btn-ghost"
          >
            خروج
          </button>
        </header>

        <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-2">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition ${tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === "overview" && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map(([label, value, Icon]) => (
                <div key={label} className="rounded-2xl border border-border bg-card p-5">
                  <Icon className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">{label}</p>
                  <strong className="text-3xl">{value}</strong>
                </div>
              ))}
            </section>
            <section className="grid gap-5 lg:grid-cols-[1.3fr_.9fr]">
              <FinanceCharts data={data} />
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-xl font-black">إجراءات سريعة</h2>
                <div className="mt-4 grid gap-3">
                  {data.stores
                    .filter((store: any) => store.status === "pending_verification")
                    .slice(0, 5)
                    .map((store: any) => (
                      <div key={store.id} className="rounded-xl bg-secondary p-4">
                        <b>{store.name}</b>
                        <p className="text-sm text-muted-foreground">
                          /{store.slug} · {store.city ?? "بدون مدينة"}
                        </p>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={async () => {
                              await moderationFn({ data: { storeId: store.id, status: "active" } });
                              await load();
                            }}
                            className="btn-primary py-2"
                          >
                            <CheckCircle2 className="h-4 w-4" /> قبول
                          </button>
                          <button
                            onClick={async () => {
                              await moderationFn({
                                data: {
                                  storeId: store.id,
                                  status: "suspended",
                                  reason: "مراجعة إدارية",
                                },
                              });
                              await load();
                            }}
                            className="btn-ghost py-2"
                          >
                            <Ban className="h-4 w-4" /> حظر
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </section>
          </>
        )}

        {tab === "stores" && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xl font-black">التحكم في المتاجر وحساب كل متجر</h2>
            <DataTable
              headers={[
                "المتجر",
                "المالك",
                "الحالة",
                "الخطة",
                "الطلبات",
                "المبيعات",
                "الربح",
                "إجراءات",
              ]}
            >
              {data.financeByStore.map((row: any) => {
                const store = data.stores.find((item: any) => item.id === row.storeId);
                return (
                  <tr key={row.storeId} className="border-t border-border">
                    <td className="p-2">
                      <b>{row.name}</b>
                      <small className="block text-muted-foreground">/{row.slug}</small>
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {store?.owner_user_id?.slice(0, 8)}...
                    </td>
                    <td className="p-2">
                      <select
                        className="h-9 rounded-lg border border-input bg-background px-2"
                        value={row.status}
                        onChange={async (e) => {
                          await moderationFn({
                            data: {
                              storeId: row.storeId,
                              status: e.target.value as any,
                              reason:
                                e.target.value === "suspended" ? "مخالفة شروط المنصة" : undefined,
                            },
                          });
                          await load();
                        }}
                      >
                        {storeStatuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <select
                        className="h-9 rounded-lg border border-input bg-background px-2"
                        value={store?.subscription_tier}
                        onChange={async (e) => {
                          await subscriptionFn({
                            data: { storeId: row.storeId, tier: e.target.value as any },
                          });
                          await load();
                        }}
                      >
                        {tiers.map((tier) => (
                          <option key={tier}>{tier}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">{row.orders}</td>
                    <td className="p-2">{Number(row.sales).toLocaleString()} د.م</td>
                    <td className="p-2 font-bold text-primary">
                      {Number(row.profit).toLocaleString()} د.م
                    </td>
                    <td className="p-2">
                      <a
                        className="text-sm font-bold text-primary"
                        href={`/store/${row.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        معاينة
                      </a>
                    </td>
                  </tr>
                );
              })}
            </DataTable>
          </section>
        )}

        {tab === "finance" && (
          <section className="space-y-5">
            <FinanceCharts data={data} />
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-xl font-black">التقديرات المالية لكل متجر</h2>
              <DataTable
                headers={["المتجر", "الطلبات", "المنتجات", "المبيعات", "صافي الربح", "متوسط الطلب"]}
              >
                {data.financeByStore.map((row: any) => (
                  <tr key={row.storeId} className="border-t border-border">
                    <td className="p-2 font-bold">{row.name}</td>
                    <td className="p-2">{row.orders}</td>
                    <td className="p-2">{row.products}</td>
                    <td className="p-2">{Number(row.sales).toLocaleString()} د.م</td>
                    <td className="p-2 font-bold text-primary">
                      {Number(row.profit).toLocaleString()} د.م
                    </td>
                    <td className="p-2">
                      {row.orders ? Math.round(row.sales / row.orders).toLocaleString() : 0} د.م
                    </td>
                  </tr>
                ))}
              </DataTable>
            </div>
          </section>
        )}

        {tab === "orders" && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xl font-black">طلبات المتاجر للرقابة والمتابعة</h2>
            <DataTable
              headers={["الطلب", "المتجر", "الحالة", "المدينة", "المجموع", "الربح", "التاريخ"]}
            >
              {data.orders.map((order: any) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="p-2 font-bold">{order.order_number}</td>
                  <td className="p-2">{order.stores?.name ?? "—"}</td>
                  <td className="p-2">
                    <select
                      className="h-9 rounded-lg border border-input bg-background px-2"
                      value={order.status}
                      onChange={async (e) => {
                        await orderStatusFn({
                          data: { orderId: order.id, status: e.target.value as any },
                        });
                        await load();
                      }}
                    >
                      {orderStatuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">{order.city ?? "—"}</td>
                  <td className="p-2">{Number(order.total).toLocaleString()} د.م</td>
                  <td className="p-2 font-bold text-primary">
                    {(Number(order.total) - Number(order.total_cost)).toLocaleString()} د.م
                  </td>
                  <td className="p-2 text-muted-foreground">{order.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </DataTable>
          </section>
        )}

        {tab === "products" && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xl font-black">منتجات المتاجر للرقابة</h2>
            <DataTable
              headers={["المنتج", "المتجر", "السعر", "المخزون", "مميز", "الحالة", "إجراء"]}
            >
              {data.products.map((product: any) => {
                const store = data.stores.find((item: any) => item.id === product.store_id);
                return (
                  <tr key={product.id} className="border-t border-border">
                    <td className="p-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-12 w-12 rounded-lg bg-secondary bg-cover bg-center"
                          style={{
                            backgroundImage: product.images?.[0]
                              ? `url(${product.images[0]})`
                              : undefined,
                          }}
                        />
                        <b>{product.name}</b>
                      </div>
                    </td>
                    <td className="p-2">{store?.name ?? "—"}</td>
                    <td className="p-2">{Number(product.price).toLocaleString()} د.م</td>
                    <td className="p-2">{product.stock}</td>
                    <td className="p-2">{product.is_featured ? "نعم" : "لا"}</td>
                    <td className="p-2">{product.is_active ? "ظاهر" : "مخفي"}</td>
                    <td className="p-2">
                      <button
                        className="btn-ghost py-2"
                        onClick={async () => {
                          await productVisibilityFn({
                            data: { productId: product.id, isActive: !product.is_active },
                          });
                          await load();
                        }}
                      >
                        {product.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}{" "}
                        {product.is_active ? "إخفاء" : "إظهار"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </DataTable>
          </section>
        )}

        {tab === "plans" && (
          <section className="grid gap-5 lg:grid-cols-[1fr_.9fr]">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-xl font-black">تغيير أسعار الاشتراكات</h2>
              <div className="mt-4 grid gap-4">
                {data.plans.map((plan: any) => (
                  <PlanForm
                    key={plan.id}
                    plan={plan}
                    onSave={async (payload) => {
                      await planFn({ data: payload });
                      await load();
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-xl font-black">قوالب المتاجر</h2>
              {data.templates.map((template: any) => (
                <div
                  key={template.id}
                  className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-secondary p-4"
                >
                  <span>
                    {template.name_ar}
                    <small className="block text-muted-foreground">
                      {template.category} · {template.access} ·{" "}
                      {template.is_active ? "مفعل" : "موقف"}
                    </small>
                  </span>
                  <button
                    onClick={async () => {
                      await templateFn({
                        data: {
                          templateId: template.id,
                          access: template.access === "free" ? "pro" : "free",
                          isActive: !template.is_active,
                        },
                      });
                      await load();
                    }}
                    className="text-sm font-bold text-primary"
                  >
                    تبديل
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "coupons" && (
          <section className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
            <form onSubmit={saveCoupon} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <BadgePercent className="h-5 w-5" /> {coupon.id ? "تعديل كوبون" : "إضافة كوبون"}
              </h2>
              <div className="mt-4 grid gap-3">
                <input
                  className="h-11 rounded-xl border border-input bg-background px-3"
                  placeholder="الكود مثل WELCOME20"
                  value={coupon.code}
                  onChange={(e) => setCoupon({ ...coupon, code: e.target.value })}
                  required
                />
                <input
                  className="h-11 rounded-xl border border-input bg-background px-3"
                  placeholder="عنوان التخفيض"
                  value={coupon.title}
                  onChange={(e) => setCoupon({ ...coupon, title: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    className="h-11 rounded-xl border border-input bg-background px-3"
                    value={coupon.discountType}
                    onChange={(e) => setCoupon({ ...coupon, discountType: e.target.value })}
                  >
                    <option value="percentage">نسبة %</option>
                    <option value="fixed">مبلغ ثابت</option>
                  </select>
                  <input
                    type="number"
                    className="h-11 rounded-xl border border-input bg-background px-3"
                    value={coupon.discountValue}
                    onChange={(e) =>
                      setCoupon({ ...coupon, discountValue: Number(e.target.value) })
                    }
                  />
                  <select
                    className="h-11 rounded-xl border border-input bg-background px-3"
                    value={coupon.appliesTo}
                    onChange={(e) => setCoupon({ ...coupon, appliesTo: e.target.value })}
                  >
                    <option value="all">كل الخطط</option>
                    {tiers.map((tier) => (
                      <option key={tier}>{tier}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="h-11 rounded-xl border border-input bg-background px-3"
                    value={coupon.maxRedemptions}
                    onChange={(e) =>
                      setCoupon({ ...coupon, maxRedemptions: Number(e.target.value) })
                    }
                    placeholder="حد الاستخدام"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={coupon.isActive}
                    onChange={(e) => setCoupon({ ...coupon, isActive: e.target.checked })}
                  />{" "}
                  مفعل
                </label>
                <button className="btn-primary justify-center">
                  <Save className="h-4 w-4" /> حفظ الكوبون
                </button>
              </div>
            </form>
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-xl font-black">الكوبونات والتخفيضات</h2>
              {data.coupons.map((item: any) => (
                <div
                  key={item.id}
                  className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-secondary p-4"
                >
                  <span>
                    <b>{item.code}</b>
                    <small className="block text-muted-foreground">
                      {item.title_ar} · {item.discount_value}
                      {item.discount_type === "percentage" ? "%" : " د.م"} · استعمل{" "}
                      {item.redeemed_count}
                    </small>
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="text-sm font-bold text-primary"
                      onClick={() =>
                        setCoupon({
                          id: item.id,
                          code: item.code,
                          title: item.title_ar,
                          discountType: item.discount_type,
                          discountValue: Number(item.discount_value),
                          appliesTo: item.applies_to ?? "all",
                          maxRedemptions: item.max_redemptions ?? 0,
                          isActive: item.is_active,
                        })
                      }
                    >
                      تعديل
                    </button>
                    <button
                      className="text-sm font-bold text-destructive"
                      onClick={async () => {
                        await deleteCouponFn({ data: { couponId: item.id } });
                        await load();
                      }}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "ads" && (
          <section className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
            <form onSubmit={saveAd} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <Megaphone className="h-5 w-5" /> صفحة الإعلانات
              </h2>
              <div className="mt-4 grid gap-3">
                <input
                  className="h-11 rounded-xl border border-input bg-background px-3"
                  placeholder="عنوان الإعلان"
                  value={ad.title}
                  onChange={(e) => setAd({ ...ad, title: e.target.value })}
                  required
                />
                <textarea
                  className="min-h-[88px] rounded-xl border border-input bg-background p-3"
                  placeholder="وصف الإعلان"
                  value={ad.description}
                  onChange={(e) => setAd({ ...ad, description: e.target.value })}
                />
                <input
                  className="h-11 rounded-xl border border-input bg-background px-3"
                  placeholder="الرابط"
                  value={ad.targetUrl}
                  onChange={(e) => setAd({ ...ad, targetUrl: e.target.value })}
                />
                <input
                  className="h-11 rounded-xl border border-input bg-background px-3"
                  placeholder="رابط الصورة"
                  value={ad.imageUrl}
                  onChange={(e) => setAd({ ...ad, imageUrl: e.target.value })}
                />
                <input
                  className="h-11 rounded-xl border border-input bg-background px-3"
                  placeholder="الموضع home/dashboard"
                  value={ad.placement}
                  onChange={(e) => setAd({ ...ad, placement: e.target.value })}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={ad.isActive}
                    onChange={(e) => setAd({ ...ad, isActive: e.target.checked })}
                  />{" "}
                  مفعل
                </label>
                <button className="btn-primary justify-center">
                  <Save className="h-4 w-4" /> حفظ الإعلان
                </button>
              </div>
            </form>
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-xl font-black">الإعلانات الحالية</h2>
              {data.ads.map((item: any) => (
                <div
                  key={item.id}
                  className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-secondary p-4"
                >
                  <span>
                    <b>{item.title_ar}</b>
                    <small className="block text-muted-foreground">
                      {item.placement} · {item.is_active ? "مفعل" : "متوقف"}
                    </small>
                  </span>
                  <button
                    className="text-sm font-bold text-primary"
                    onClick={() =>
                      setAd({
                        id: item.id,
                        title: item.title_ar,
                        description: item.description_ar ?? "",
                        targetUrl: item.target_url ?? "",
                        imageUrl: item.image_url ?? "",
                        placement: item.placement,
                        isActive: item.is_active,
                      })
                    }
                  >
                    تعديل
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "contact" && (
          <section className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const fd = new FormData(event.currentTarget);
                await contentFn({
                  data: {
                    key: "contact",
                    title: "تواصل معنا",
                    body: String(fd.get("body") ?? ""),
                    data: {
                      phone: fd.get("phone"),
                      whatsapp: fd.get("whatsapp"),
                      email: fd.get("email"),
                      facebook: fd.get("facebook"),
                      instagram: fd.get("instagram"),
                    },
                  },
                });
                await load();
              }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <h2 className="flex items-center gap-2 text-xl font-black">
                <PhoneCall className="h-5 w-5" /> وسائل التواصل وأرقام الهواتف
              </h2>
              <div className="mt-4 grid gap-3">
                <input
                  name="phone"
                  className="h-11 rounded-xl border border-input bg-background px-3"
                  placeholder="الهاتف"
                  defaultValue={contactContent?.data?.phone ?? ""}
                />
                <input
                  name="whatsapp"
                  className="h-11 rounded-xl border border-input bg-background px-3"
                  placeholder="واتساب"
                  defaultValue={contactContent?.data?.whatsapp ?? ""}
                />
                <input
                  name="email"
                  className="h-11 rounded-xl border border-input bg-background px-3"
                  placeholder="البريد"
                  defaultValue={contactContent?.data?.email ?? ""}
                />
                <input
                  name="facebook"
                  className="h-11 rounded-xl border border-input bg-background px-3"
                  placeholder="Facebook"
                  defaultValue={contactContent?.data?.facebook ?? ""}
                />
                <input
                  name="instagram"
                  className="h-11 rounded-xl border border-input bg-background px-3"
                  placeholder="Instagram"
                  defaultValue={contactContent?.data?.instagram ?? ""}
                />
                <textarea
                  name="body"
                  className="min-h-[100px] rounded-xl border border-input bg-background p-3"
                  defaultValue={contactContent?.body_ar ?? ""}
                />
                <button className="btn-primary justify-center">
                  <Save className="h-4 w-4" /> حفظ بيانات التواصل
                </button>
              </div>
            </form>
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <Mail className="h-5 w-5" /> رسائل الاتصال بالإدارة
              </h2>
              {data.messages.map((message: any) => (
                <div key={message.id} className="mt-3 rounded-xl bg-secondary p-4">
                  <div className="flex items-start justify-between gap-3">
                    <b>{message.name}</b>
                    <button
                      className="text-sm font-bold text-primary"
                      onClick={async () => {
                        await messageFn({
                          data: { messageId: message.id, isRead: !message.is_read },
                        });
                        await load();
                      }}
                    >
                      {message.is_read ? "غير مقروءة" : "تمت القراءة"}
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {message.phone ?? message.email ?? "بدون وسيلة"}
                  </p>
                  <p className="mt-2 text-sm">{message.message}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "support" && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-xl font-black">
              <Headphones className="h-5 w-5" /> صفحة الدعم الفني
            </h2>
            <DataTable
              headers={["التذكرة", "المتجر", "الأولوية", "الحالة", "التواصل", "الرسالة", "تحديث"]}
            >
              {data.tickets.map((ticket: any) => (
                <tr key={ticket.id} className="border-t border-border">
                  <td className="p-2">
                    <b>{ticket.subject}</b>
                    <small className="block text-muted-foreground">{ticket.name}</small>
                  </td>
                  <td className="p-2">{ticket.stores?.name ?? "—"}</td>
                  <td className="p-2">{ticket.priority}</td>
                  <td className="p-2">
                    <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                      {ticket.status}
                    </span>
                  </td>
                  <td className="p-2 text-xs">{ticket.phone ?? ticket.email ?? "—"}</td>
                  <td className="p-2 max-w-xs truncate">{ticket.message}</td>
                  <td className="p-2">
                    <select
                      className="h-9 rounded-lg border border-input bg-background px-2"
                      value={ticket.status}
                      onChange={async (e) => {
                        await supportFn({
                          data: { ticketId: ticket.id, status: e.target.value as any },
                        });
                        await load();
                      }}
                    >
                      <option value="open">open</option>
                      <option value="in_progress">in_progress</option>
                      <option value="resolved">resolved</option>
                      <option value="closed">closed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </DataTable>
          </section>
        )}
      </div>
    </main>
  );
}

function FinanceCharts({ data }: { data: AdminData }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-black">مبيعات وصافي الربح — آخر 14 يوم</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data.chart}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="day" reversed />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="sales"
              name="المبيعات"
              stroke="var(--primary)"
              fill="var(--primary)"
              fillOpacity={0.18}
            />
            <Area
              type="monotone"
              dataKey="profit"
              name="صافي الربح"
              stroke="var(--gold)"
              fill="var(--gold)"
              fillOpacity={0.18}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-black">عدد الطلبات اليومية</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.chart}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="day" reversed />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar
              dataKey="orders"
              name="الطلبات"
              fill="var(--primary-light)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="text-right text-muted-foreground">
          <tr>
            {headers.map((header) => (
              <th key={header} className="p-2 font-bold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function PlanForm({ plan, onSave }: { plan: any; onSave: (payload: any) => Promise<void> }) {
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    await onSave({
      planId: plan.id,
      monthlyPrice: Number(fd.get("price")),
      productLimit: Number(fd.get("products")),
      aiCredits: Number(fd.get("ai")),
      staffLimit: Number(fd.get("staff")),
      bankTransferEnabled: fd.has("bank"),
      advancedAnalytics: fd.has("analytics"),
      customDomain: fd.has("domain"),
    });
  };

  return (
    <form onSubmit={submit} className="rounded-xl bg-secondary p-4">
      <b>{plan.name_ar}</b>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <label className="text-xs text-muted-foreground">
          السعر
          <input
            name="price"
            type="number"
            className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-2"
            defaultValue={Number(plan.monthly_price)}
          />
        </label>
        <label className="text-xs text-muted-foreground">
          حد المنتجات
          <input
            name="products"
            type="number"
            className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-2"
            defaultValue={plan.product_limit}
          />
        </label>
        <label className="text-xs text-muted-foreground">
          AI Credits
          <input
            name="ai"
            type="number"
            className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-2"
            defaultValue={plan.ai_credits}
          />
        </label>
        <label className="text-xs text-muted-foreground">
          الموظفون
          <input
            name="staff"
            type="number"
            className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-2"
            defaultValue={plan.staff_limit}
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <label>
          <input name="bank" type="checkbox" defaultChecked={plan.bank_transfer_enabled} /> تحويل
          بنكي
        </label>
        <label>
          <input name="analytics" type="checkbox" defaultChecked={plan.advanced_analytics} />{" "}
          تحليلات متقدمة
        </label>
        <label>
          <input name="domain" type="checkbox" defaultChecked={plan.custom_domain} /> نطاق خاص
        </label>
      </div>
      <button className="btn-primary mt-3 py-2">
        <Save className="h-4 w-4" /> حفظ الخطة
      </button>
    </form>
  );
}
