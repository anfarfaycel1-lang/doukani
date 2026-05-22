import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import {
  createSupportTicket,
  createStore,
  deleteProduct,
  exportMerchantReport,
  getMerchantDashboard,
  upsertProduct,
} from "@/lib/merchant.functions";
import {
  BarChart3,
  Box,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Pencil,
  PackagePlus,
  Plus,
  Save,
  Store,
  Trash2,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "لوحة التاجر — دكاني" },
      { name: "description", content: "تقارير مالية حقيقية، إدارة المنتجات، ورفع صور المتجر." },
    ],
  }),
  component: DashboardPage,
});

type ProductForm = {
  id?: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  lowStockThreshold: number;
  images: string[];
  isFeatured: boolean;
};

const emptyProduct = (): ProductForm => ({
  name: "",
  description: "",
  price: 0,
  cost: 0,
  stock: 0,
  lowStockThreshold: 5,
  images: [],
  isFeatured: true,
});

function DashboardPage() {
  const loadFn = useServerFn(getMerchantDashboard);
  const createStoreFn = useServerFn(createStore);
  const productFn = useServerFn(upsertProduct);
  const deleteFn = useServerFn(deleteProduct);
  const exportFn = useServerFn(exportMerchantReport);
  const supportFn = useServerFn(createSupportTicket);

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [storeForm, setStoreForm] = useState({ name: "", businessType: "", city: "", whatsapp: "", taxNumber: "" });
  const [product, setProduct] = useState<ProductForm>(emptyProduct());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<"overview" | "products" | "reports" | "support">("overview");
  const [support, setSupport] = useState({ name: "", email: "", phone: "", subject: "", message: "", priority: "normal" });

  const load = async () => setData(await loadFn());
  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "خطأ في التحميل"));
  }, []);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    await createStoreFn({ data: { ...storeForm, socialLinks: {}, bankAccount: {} } });
    await load();
  };

  const resetProduct = () => {
    setProduct(emptyProduct());
    setEditingId(null);
  };

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setProduct({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      price: Number(p.price),
      cost: Number(p.cost),
      stock: Number(p.stock),
      lowStockThreshold: Number(p.low_stock_threshold ?? 5),
      images: Array.isArray(p.images) ? p.images : [],
      isFeatured: !!p.is_featured,
    });
    setTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("غير مصرح");
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 6)) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
        urls.push(pub.publicUrl);
      }
      setProduct((p) => ({ ...p, images: [...p.images, ...urls].slice(0, 8) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url: string) => setProduct((p) => ({ ...p, images: p.images.filter((u) => u !== url) }));

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!data?.store) return;
    await productFn({
      data: {
        id: product.id,
        storeId: data.store.id,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        cost: Number(product.cost),
        stock: Number(product.stock),
        lowStockThreshold: Number(product.lowStockThreshold),
        images: product.images,
        isFeatured: product.isFeatured,
      },
    });
    resetProduct();
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("تأكيد حذف المنتج؟")) return;
    await deleteFn({ data: { productId: id } });
    if (editingId === id) resetProduct();
    await load();
  };

  const exportCsv = async () => {
    if (!data?.store) return;
    const report = await exportFn({ data: { storeId: data.store.id } });
    const blob = new Blob(["\ufeff" + report.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = report.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendSupport = async (event: FormEvent) => {
    event.preventDefault();
    await supportFn({ data: { ...support, storeId: data.store.id, priority: support.priority as "low" | "normal" | "high" | "urgent" } });
    setSupport({ name: "", email: "", phone: "", subject: "", message: "", priority: "normal" });
    setError("تم إرسال طلب الدعم الفني بنجاح");
  };

  const chartData = useMemo(() => {
    if (!data?.chart) return [];
    return data.chart.map((row: any) => {
      const dayOrders = (data.orders ?? []).filter((o: any) => o.created_at?.slice(0, 10) === row.date);
      const profit = dayOrders.reduce((s: number, o: any) => s + Number(o.total ?? 0) - Number(o.total_cost ?? 0), 0);
      return { ...row, profit, day: row.date.slice(5) };
    });
  }, [data]);

  if (!data)
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="rounded-xl bg-card p-6 shadow">جاري تحميل لوحة التحكم...</p>
      </main>
    );

  if (!data.store)
    return (
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
          <button className="btn-primary mt-5">إنشاء المتجر</button>
          {error && <p className="mt-3 text-destructive">{error}</p>}
        </form>
      </main>
    );

  const stats: Array<[string, number, string]> = [
    ["إجمالي المبيعات", data.stats.sales, "primary"],
    ["صافي الربح", data.stats.profit, "gold"],
    ["عدد الطلبات", data.stats.orders, "sky"],
    ["العملاء", data.stats.customers, "mint"],
  ];

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
          <div>
            <h1 className="text-3xl font-black">{data.store.name}</h1>
            <p className="text-sm text-muted-foreground">رابط المتجر: /store/{data.store.slug} · الحالة: {data.store.status}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="btn-ghost" href={`/store/${data.store.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> عرض المتجر
            </a>
            <button onClick={exportCsv} className="btn-primary">
              <Download className="h-4 w-4" /> تصدير CSV
            </button>
          </div>
        </header>

        <nav className="flex gap-2 rounded-2xl border border-border bg-card p-2">
          {([
            ["overview", "نظرة عامة"],
            ["products", "إدارة المنتجات"],
            ["reports", "التقارير المالية"],
            ["support", "الدعم الفني"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold transition ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
            >
              {label}
            </button>
          ))}
        </nav>

        {(tab === "overview" || tab === "reports") && (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              {stats.map(([label, value, tone]) => (
                <div key={label} className="rounded-2xl border border-border bg-card p-5">
                  <BarChart3 className={`h-5 w-5 text-${tone}`} />
                  <p className="mt-3 text-sm text-muted-foreground">{label}</p>
                  <strong className="text-3xl">{Number(value).toLocaleString()} {label.includes("عدد") || label === "العملاء" ? "" : "د.م"}</strong>
                </div>
              ))}
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-4 text-lg font-black">المبيعات وصافي الربح — آخر 7 أيام</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="day" reversed />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="sales" name="المبيعات" stroke="var(--primary)" fill="url(#g1)" />
                    <Area type="monotone" dataKey="profit" name="صافي الربح" stroke="var(--gold)" fill="url(#g2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-4 text-lg font-black">عدد الطلبات اليومية</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="day" reversed />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="orders" name="الطلبات" fill="var(--primary-light)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {data.lowStock.length > 0 && (
              <section className="rounded-2xl border border-destructive/30 bg-card p-5">
                <h2 className="flex items-center gap-2 font-black text-destructive">
                  <TriangleAlert className="h-5 w-5" /> تنبيهات انخفاض المخزون
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  منتجات بحاجة لإعادة التموين: {data.lowStock.map((p: any) => `${p.name} (${p.stock})`).join("، ")}
                </p>
              </section>
            )}
          </>
        )}

        {tab === "reports" && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-lg font-black">آخر الطلبات</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-right text-muted-foreground">
                  <tr>
                    <th className="p-2">رقم الطلب</th>
                    <th className="p-2">المدينة</th>
                    <th className="p-2">المجموع</th>
                    <th className="p-2">التكلفة</th>
                    <th className="p-2">الربح</th>
                    <th className="p-2">الحالة</th>
                    <th className="p-2">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.slice(0, 25).map((o: any) => (
                    <tr key={o.id} className="border-t border-border">
                      <td className="p-2 font-bold">{o.order_number}</td>
                      <td className="p-2">{o.city ?? "—"}</td>
                      <td className="p-2">{Number(o.total).toLocaleString()} د.م</td>
                      <td className="p-2 text-muted-foreground">{Number(o.total_cost).toLocaleString()} د.م</td>
                      <td className="p-2 text-primary font-bold">{(Number(o.total) - Number(o.total_cost)).toLocaleString()} د.م</td>
                      <td className="p-2"><span className="rounded-full bg-secondary px-2 py-1 text-xs">{o.status}</span></td>
                      <td className="p-2 text-muted-foreground">{o.created_at?.slice(0, 10)}</td>
                    </tr>
                  ))}
                  {data.orders.length === 0 && (
                    <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">لا توجد طلبات بعد</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "products" && (
          <section className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
            <form onSubmit={saveProduct} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 text-xl font-black">
                {editingId ? <Pencil className="h-5 w-5" /> : <PackagePlus className="h-5 w-5" />}
                {editingId ? "تعديل منتج" : "إضافة منتج جديد"}
              </h2>

              <div className="mt-4 grid gap-3">
                <input className="h-11 rounded-xl border border-input bg-background px-3" placeholder="اسم المنتج" value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} required />
                <textarea className="min-h-[90px] rounded-xl border border-input bg-background p-3" placeholder="وصف المنتج" value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} />

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm">السعر (د.م)
                    <input type="number" step="0.01" className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3" value={product.price} onChange={(e) => setProduct({ ...product, price: Number(e.target.value) })} />
                  </label>
                  <label className="text-sm">التكلفة (د.م)
                    <input type="number" step="0.01" className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3" value={product.cost} onChange={(e) => setProduct({ ...product, cost: Number(e.target.value) })} />
                  </label>
                  <label className="text-sm">المخزون
                    <input type="number" className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3" value={product.stock} onChange={(e) => setProduct({ ...product, stock: Number(e.target.value) })} />
                  </label>
                  <label className="text-sm">تنبيه عند المخزون
                    <input type="number" className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3" value={product.lowStockThreshold} onChange={(e) => setProduct({ ...product, lowStockThreshold: Number(e.target.value) })} />
                  </label>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={product.isFeatured} onChange={(e) => setProduct({ ...product, isFeatured: e.target.checked })} />
                  ضمن السلايد شو في القالب
                </label>

                <div className="rounded-xl border border-dashed border-border bg-secondary/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-bold"><ImageIcon className="h-4 w-4" /> صور المنتج ({product.images.length}/8)</span>
                    <label className={`btn-ghost cursor-pointer py-2 text-sm ${uploading ? "opacity-50" : ""}`}>
                      <Upload className="h-4 w-4" /> {uploading ? "يتم الرفع..." : "رفع صور"}
                      <input type="file" accept="image/*" multiple hidden onChange={(e) => uploadImages(e.target.files)} disabled={uploading} />
                    </label>
                  </div>
                  {product.images.length > 0 && (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {product.images.map((url) => (
                        <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                          <img src={url} alt="" className="h-full w-full object-cover" />
                          <button type="button" onClick={() => removeImage(url)} className="absolute top-1 left-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition group-hover:opacity-100">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">تظهر الصورة الأولى في بطاقة المنتج وكل الصور تعمل كسلايد شو في القالب.</p>
                </div>

                <div className="flex gap-2">
                  <button className="btn-primary flex-1 justify-center">
                    {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {editingId ? "حفظ التعديلات" : "إضافة المنتج"}
                  </button>
                  {editingId && (
                    <button type="button" onClick={resetProduct} className="btn-ghost">إلغاء</button>
                  )}
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            </form>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 text-xl font-black"><Box className="h-5 w-5" /> منتجاتك ({data.products.length})</h2>
              <div className="mt-4 space-y-3">
                {data.products.length === 0 && <p className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">لم تضف أي منتج بعد. أضف أول منتج من النموذج بالجانب.</p>}
                {data.products.map((p: any) => (
                  <div key={p.id} className={`flex items-center gap-3 rounded-xl border p-3 transition ${editingId === p.id ? "border-primary bg-primary/5" : "border-border bg-secondary/40"}`}>
                    <div className="h-16 w-16 flex-none overflow-hidden rounded-lg bg-muted bg-cover bg-center" style={{ backgroundImage: p.images?.[0] ? `url(${p.images[0]})` : undefined }}>
                      {!p.images?.[0] && <div className="grid h-full w-full place-items-center text-muted-foreground"><ImageIcon className="h-5 w-5" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <b className="block truncate">{p.name}</b>
                      <p className="text-xs text-muted-foreground">{Number(p.price).toLocaleString()} د.م · مخزون {p.stock} · {p.images?.length ?? 0} صورة{p.is_featured ? " · مميز" : ""}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(p)} className="rounded-lg p-2 text-primary hover:bg-primary/10" title="تعديل"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => remove(p.id)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10" title="حذف"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
