import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { adminLogin, adminLogout, getAdminDashboard, updateStoreModeration, updatePlanPricing, updateTemplateAccess, upsertPlatformAd } from "@/lib/admin.functions";
import { Shield, Store, Package, ShoppingCart, MessageCircle, CheckCircle2, Ban, Save } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Super Admin — دكاني" }, { name: "description", content: "واجهة إدارة منصة دكاني الشاملة." }] }),
  component: AdminPage,
});

type AdminData = any;

function AdminPage() {
  const loginFn = useServerFn(adminLogin);
  const logoutFn = useServerFn(adminLogout);
  const dashboardFn = useServerFn(getAdminDashboard);
  const moderationFn = useServerFn(updateStoreModeration);
  const planFn = useServerFn(updatePlanPricing);
  const templateFn = useServerFn(updateTemplateAccess);
  const adFn = useServerFn(upsertPlatformAd);
  const [data, setData] = useState<AdminData | null>(null);
  const [username, setUsername] = useState("fayceljojobiso");
  const [password, setPassword] = useState("123123y");
  const [error, setError] = useState("");

  const load = async () => {
    try { setData(await dashboardFn()); setError(""); } catch { setData(null); }
  };
  useEffect(() => { load(); }, []);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    try { await loginFn({ data: { username, password } }); await load(); } catch (err) { setError(err instanceof Error ? err.message : "فشل الدخول"); }
  };

  if (!data) return (
    <main className="grid min-h-screen place-items-center px-4">
      <form onSubmit={login} className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-primary/10">
        <Shield className="h-12 w-12 text-primary" />
        <h1 className="mt-4 text-3xl font-black">Super Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">دخول باسم مستخدم فقط للتحكم الكامل في المنصة.</p>
        <input className="mt-6 h-11 w-full rounded-xl border border-input bg-background px-3" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input type="password" className="mt-3 h-11 w-full rounded-xl border border-input bg-background px-3" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <button className="btn-primary mt-5 w-full justify-center">دخول</button>
      </form>
    </main>
  );

  const cards = [
    ["المتاجر", data.counts.stores, Store], ["المنتجات", data.counts.products, Package], ["الطلبات", data.counts.orders, ShoppingCart], ["رسائل التواصل", data.counts.contacts, MessageCircle],
  ] as const;

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
          <div><h1 className="text-3xl font-black">إدارة منصة دكاني</h1><p className="text-sm text-muted-foreground">قبول المتاجر، الأسعار، القوالب، الإعلانات، والمحتوى.</p></div>
          <button onClick={async () => { await logoutFn(); setData(null); }} className="btn-ghost">خروج</button>
        </header>
        <section className="mt-5 grid gap-4 md:grid-cols-4">{cards.map(([label, value, Icon]) => <div key={label} className="rounded-2xl border border-border bg-card p-5"><Icon className="h-5 w-5 text-primary" /><p className="mt-3 text-sm text-muted-foreground">{label}</p><strong className="text-3xl">{value}</strong></div>)}</section>
        <section className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_.9fr]">
          <div className="rounded-2xl border border-border bg-card p-5"><h2 className="text-xl font-black">المتاجر بانتظار الإدارة</h2><div className="mt-4 space-y-3">{data.stores.map((store: any) => <div key={store.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary p-4"><div><b>{store.name}</b><p className="text-sm text-muted-foreground">/{store.slug} · {store.status} · {store.city}</p></div><div className="flex gap-2"><button onClick={async () => { await moderationFn({ data: { storeId: store.id, status: "active" } }); await load(); }} className="btn-primary py-2"><CheckCircle2 className="h-4 w-4" /> قبول</button><button onClick={async () => { await moderationFn({ data: { storeId: store.id, status: "suspended", reason: "مراجعة إدارية" } }); await load(); }} className="btn-ghost py-2"><Ban className="h-4 w-4" /> حظر</button></div></div>)}</div></div>
          <div className="rounded-2xl border border-border bg-card p-5"><h2 className="text-xl font-black">إعلان الصفحة الرئيسية</h2><button onClick={async () => { await adFn({ data: { title: "عرض جديد للتجار", description: "فعّل متجرك الآن واستفد من أدوات COD والواتساب.", targetUrl: "/pricing", isActive: true } }); await load(); }} className="btn-primary mt-4"><Save className="h-4 w-4" /> إضافة إعلان سريع</button>{data.ads.map((ad: any) => <p key={ad.id} className="mt-3 rounded-xl bg-secondary p-3 text-sm">{ad.title_ar}</p>)}</div>
        </section>
        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5"><h2 className="text-xl font-black">الاشتراكات</h2>{data.plans.map((plan: any) => <div key={plan.id} className="mt-3 rounded-xl bg-secondary p-4"><b>{plan.name_ar}</b><p className="text-sm text-muted-foreground">{plan.monthly_price} د.م · {plan.product_limit} منتج · {plan.ai_credits} AI</p><button onClick={async () => { await planFn({ data: { planId: plan.id, monthlyPrice: Number(plan.monthly_price), productLimit: plan.product_limit, aiCredits: plan.ai_credits, bankTransferEnabled: !plan.bank_transfer_enabled } }); await load(); }} className="mt-2 text-sm font-bold text-primary">تبديل التحويل البنكي</button></div>)}</div>
          <div className="rounded-2xl border border-border bg-card p-5"><h2 className="text-xl font-black">قوالب المتاجر</h2>{data.templates.slice(0, 8).map((template: any) => <div key={template.id} className="mt-3 flex items-center justify-between rounded-xl bg-secondary p-4"><span>{template.name_ar}<small className="block text-muted-foreground">{template.access}</small></span><button onClick={async () => { await templateFn({ data: { templateId: template.id, access: template.access === "free" ? "pro" : "free", isActive: template.is_active } }); await load(); }} className="text-sm font-bold text-primary">تغيير الإتاحة</button></div>)}</div>
        </section>
      </div>
    </main>
  );
}
