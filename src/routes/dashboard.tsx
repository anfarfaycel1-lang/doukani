import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createStore, deleteProduct, exportMerchantReport, getMerchantDashboard, upsertProduct } from "@/lib/merchant.functions";
import { BarChart3, Box, Download, ExternalLink, PackagePlus, Store, TriangleAlert } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
  },
  head: () => ({ meta: [{ title: "لوحة التاجر — دكاني" }, { name: "description", content: "إدارة المتجر والمنتجات والطلبات والتقارير المالية." }] }),
  component: DashboardPage,
});

type DashboardData = any;

function DashboardPage() {
  const loadFn = useServerFn(getMerchantDashboard);
  const createStoreFn = useServerFn(createStore);
  const productFn = useServerFn(upsertProduct);
  const deleteFn = useServerFn(deleteProduct);
  const exportFn = useServerFn(exportMerchantReport);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [storeForm, setStoreForm] = useState({ name: "", businessType: "", city: "", whatsapp: "", taxNumber: "" });
  const [productForm, setProductForm] = useState({ name: "", price: 0, cost: 0, stock: 0, lowStockThreshold: 5, image: "" });

  const load = async () => setData(await loadFn());
  useEffect(() => { load().catch((err) => setError(err instanceof Error ? err.message : "خطأ في التحميل")); }, []);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    await createStoreFn({ data: { ...storeForm, socialLinks: {}, bankAccount: {} } });
    await load();
  };

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!data?.store) return;
    await productFn({ data: { storeId: data.store.id, name: productForm.name, description: "", price: Number(productForm.price), cost: Number(productForm.cost), stock: Number(productForm.stock), lowStockThreshold: Number(productForm.lowStockThreshold), images: productForm.image ? [productForm.image] : [], isFeatured: true } });
    setProductForm({ name: "", price: 0, cost: 0, stock: 0, lowStockThreshold: 5, image: "" });
    await load();
  };

  const exportCsv = async () => {
    if (!data?.store) return;
    const report = await exportFn({ data: { storeId: data.store.id } });
    const blob = new Blob([report.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = report.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!data) return <main className="grid min-h-screen place-items-center"><p className="rounded-xl bg-card p-6 shadow">جاري تحميل لوحة التحكم...</p></main>;

  if (!data.store) return (
    <main className="min-h-screen px-4 py-8">
      <form onSubmit={create} className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-xl shadow-primary/10">
        <Store className="h-10 w-10 text-primary" />
        <h1 className="mt-4 text-3xl font-black">إنشاء متجرك في أقل من دقيقتين</h1>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <input className="h-11 rounded-xl border border-input bg-background px-3" placeholder="اسم المتجر" value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} required />
          <input className="h-11 rounded-xl border border-input bg-background px-3" placeholder="نوع النشاط" value={storeForm.businessType} onChange={(e) => setStoreForm({ ...storeForm, businessType: e.target.value })} required />
          <input className="h-11 rounded-xl border border-input bg-background px-3" placeholder="المدينة" value={storeForm.city} onChange={(e) => setStoreForm({ ...storeForm, city: e.target.value })} required />
          <input className="h-11 rounded-xl border border-input bg-background px-3" placeholder="واتساب" value={storeForm.whatsapp} onChange={(e) => setStoreForm({ ...storeForm, whatsapp: e.target.value })} required />
          <input className="h-11 rounded-xl border border-input bg-background px-3 sm:col-span-2" placeholder="الرقم الضريبي اختياري" value={storeForm.taxNumber} onChange={(e) => setStoreForm({ ...storeForm, taxNumber: e.target.value })} />
        </div>
        <p className="mt-4 rounded-xl bg-secondary p-3 text-sm text-muted-foreground">بعد الإنشاء سيتم توليد رابط متجرك تلقائياً، ويحتاج المتجر لموافقة الأدمين بعد إرسال وثيقة الهوية من الإعدادات.</p>
        <button className="btn-primary mt-5">إنشاء المتجر</button>
        {error && <p className="mt-3 text-destructive">{error}</p>}
      </form>
    </main>
  );

  const stats = [["المبيعات", data.stats.sales], ["صافي الربح", data.stats.profit], ["الطلبات", data.stats.orders], ["العملاء", data.stats.customers]];

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
          <div><h1 className="text-3xl font-black">{data.store.name}</h1><p className="text-sm text-muted-foreground">رابط المتجر: /store/{data.store.slug} · الحالة: {data.store.status}</p></div>
          <div className="flex gap-2"><a className="btn-ghost" href={`/store/${data.store.slug}`}><ExternalLink className="h-4 w-4" /> عرض المتجر</a><button onClick={exportCsv} className="btn-primary"><Download className="h-4 w-4" /> تصدير التقارير</button></div>
        </header>
        <section className="mt-5 grid gap-4 md:grid-cols-4">{stats.map(([label, value]) => <div key={label} className="rounded-2xl border border-border bg-card p-5"><BarChart3 className="h-5 w-5 text-primary" /><p className="mt-3 text-sm text-muted-foreground">{label}</p><strong className="text-3xl">{Number(value).toLocaleString()} د.م</strong></div>)}</section>
        {data.lowStock.length > 0 && <section className="mt-5 rounded-2xl border border-destructive/30 bg-card p-5"><h2 className="flex items-center gap-2 font-black text-destructive"><TriangleAlert className="h-5 w-5" /> تنبيهات انخفاض المخزون</h2><p className="mt-2 text-sm text-muted-foreground">تم إصلاح loadLowStock: {data.lowStock.map((p: any) => p.name).join("، ")}</p></section>}
        <section className="mt-5 grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
          <form onSubmit={saveProduct} className="rounded-2xl border border-border bg-card p-5"><h2 className="flex items-center gap-2 text-xl font-black"><PackagePlus className="h-5 w-5" /> إضافة منتج</h2><div className="mt-4 grid gap-3"><input className="h-11 rounded-xl border border-input bg-background px-3" placeholder="اسم المنتج" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required /><input className="h-11 rounded-xl border border-input bg-background px-3" placeholder="رابط صورة المنتج" value={productForm.image} onChange={(e) => setProductForm({ ...productForm, image: e.target.value })} /><div className="grid grid-cols-2 gap-3"><input type="number" className="h-11 rounded-xl border border-input bg-background px-3" placeholder="السعر" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} /><input type="number" className="h-11 rounded-xl border border-input bg-background px-3" placeholder="التكلفة" value={productForm.cost} onChange={(e) => setProductForm({ ...productForm, cost: Number(e.target.value) })} /><input type="number" className="h-11 rounded-xl border border-input bg-background px-3" placeholder="المخزون" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} /><input type="number" className="h-11 rounded-xl border border-input bg-background px-3" placeholder="تنبيه المخزون" value={productForm.lowStockThreshold} onChange={(e) => setProductForm({ ...productForm, lowStockThreshold: Number(e.target.value) })} /></div><button className="btn-primary justify-center">حفظ المنتج</button></div></form>
          <div className="rounded-2xl border border-border bg-card p-5"><h2 className="flex items-center gap-2 text-xl font-black"><Box className="h-5 w-5" /> المنتجات</h2><div className="mt-4 space-y-3">{data.products.map((product: any) => <div key={product.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary p-4"><div><b>{product.name}</b><p className="text-sm text-muted-foreground">{product.price} د.م · مخزون {product.stock}</p></div><button onClick={async () => { await deleteFn({ data: { productId: product.id } }); await load(); }} className="text-sm font-bold text-destructive">حذف</button></div>)}</div></div>
        </section>
      </div>
    </main>
  );
}
