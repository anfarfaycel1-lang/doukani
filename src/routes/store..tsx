import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createCustomerOrder, getPublicStore, trackOrder } from "@/lib/public.functions";
import { ShoppingCart, MessageCircle, Search, Truck, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/store/")({
  head: () => ({ meta: [{ title: "متجر دكاني" }, { name: "description", content: "متجر إلكتروني بدعم الدفع عند الاستلام وتتبع الطلب." }] }),
  component: StorefrontPage,
});

type StoreData = any;
type CartItem = { productId: string; name: string; price: number; quantity: number };

function StorefrontPage() {
  const { slug } = Route.useParams();
  const loadFn = useServerFn(getPublicStore);
  const orderFn = useServerFn(createCustomerOrder);
  const trackFn = useServerFn(trackOrder);
  const [data, setData] = useState<StoreData | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState({ name: "", phone: "", city: "", address: "" });
  const [orderMessage, setOrderMessage] = useState("");
  const [tracking, setTracking] = useState({ orderNumber: "", phone: "" });
  const [tracked, setTracked] = useState<any>(null);

  useEffect(() => { loadFn({ data: { slug } }).then(setData); }, [slug]);
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  if (!data) return <main className="grid min-h-screen place-items-center">جاري تحميل المتجر...</main>;
  if (!data.store) return <main className="grid min-h-screen place-items-center"><h1 className="text-3xl font-black">المتجر غير متاح حالياً</h1></main>;

  const theme = data.store.store_templates?.preview_theme ?? "general-pro";
  const featured = data.products.slice(0, 4);

  const add = (product: any) => setCart((items) => {
    const found = items.find((item) => item.productId === product.id);
    if (found) return items.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
    return [...items, { productId: product.id, name: product.name, price: Number(product.price), quantity: 1 }];
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await orderFn({ data: { storeId: data.store.id, customer, items: cart.map(({ productId, quantity }) => ({ productId, quantity })), paymentMethod: "cod" } });
    setOrderMessage(`تم استلام طلبك رقم ${result.order.order_number}. المجموع ${result.order.total} د.م`);
    setCart([]);
  };

  return (
    <main className={`min-h-screen ${theme.includes("noir") ? "bg-foreground text-background" : "bg-background text-foreground"}`}>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-card/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-primary">{data.store.name}</h1>
          <a href={`https://wa.me/${String(data.store.whatsapp ?? "").replace(/\D/g, "")}`} className="btn-primary py-2"><MessageCircle className="h-4 w-4" /> واتساب</a>
        </div>
      </header>
      <section className="px-4 py-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="overflow-hidden rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
            <div className="grid min-h-[360px] gap-4 p-8 md:grid-cols-2">
              <div className="flex flex-col justify-center"><p className="text-sm font-bold opacity-80">سلايد شو المنتجات</p><h2 className="mt-3 text-5xl font-black">عروض مختارة من {data.store.name}</h2><p className="mt-4 opacity-85">طلب سريع من صفحة واحدة، دفع عند الاستلام، وتتبع فوري لحالة الطلب.</p></div>
              <div className="grid grid-cols-2 gap-3">{featured.map((p: any) => <div key={p.id} className="overflow-hidden rounded-2xl bg-card/15 p-3"><div className="aspect-square rounded-xl bg-background/20 bg-cover bg-center" style={{ backgroundImage: p.images?.[0] ? `url(${p.images[0]})` : undefined }} /><b className="mt-2 block">{p.name}</b><span>{p.price} د.م</span></div>)}</div>
            </div>
          </div>
          <aside className="rounded-3xl border border-border bg-card p-5 text-card-foreground"><h2 className="flex items-center gap-2 text-xl font-black"><Search className="h-5 w-5" /> تتبع طلبك</h2><div className="mt-4 grid gap-2"><input className="h-11 rounded-xl border border-input bg-background px-3" placeholder="رقم الطلب" value={tracking.orderNumber} onChange={(e) => setTracking({ ...tracking, orderNumber: e.target.value })} /><input className="h-11 rounded-xl border border-input bg-background px-3" placeholder="الهاتف" value={tracking.phone} onChange={(e) => setTracking({ ...tracking, phone: e.target.value })} /><button className="btn-ghost justify-center" onClick={async () => setTracked((await trackFn({ data: tracking })).order)}>تتبع</button>{tracked && <p className="rounded-xl bg-secondary p-3 text-sm"><Truck className="inline h-4 w-4" /> الحالة: {tracked.status}</p>}</div></aside>
        </div>
      </section>
      <section className="px-4 pb-14"><div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">{data.products.map((product: any) => <article key={product.id} className="overflow-hidden rounded-2xl border border-border bg-card"><div className="aspect-square bg-secondary bg-cover bg-center" style={{ backgroundImage: product.images?.[0] ? `url(${product.images[0]})` : undefined }} /><div className="p-4"><h3 className="font-black">{product.name}</h3><p className="mt-1 text-sm text-muted-foreground line-clamp-2">{product.description}</p><div className="mt-4 flex items-center justify-between"><b className="text-primary">{product.price} د.م</b><button onClick={() => add(product)} className="btn-primary py-2"><ShoppingCart className="h-4 w-4" /> إضافة</button></div></div></article>)}</div></section>
      <section className="px-4 pb-16"><form onSubmit={submit} className="mx-auto max-w-4xl rounded-3xl border border-border bg-card p-6"><h2 className="text-2xl font-black">دفع سريع من خطوة واحدة</h2><p className="mt-1 text-sm text-muted-foreground">المجموع: {total} د.م · الدفع عند الاستلام مفعل افتراضياً</p><div className="mt-4 grid gap-3 md:grid-cols-2"><input className="h-11 rounded-xl border border-input bg-background px-3" placeholder="الاسم" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} required /><input className="h-11 rounded-xl border border-input bg-background px-3" placeholder="الهاتف" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} required /><input className="h-11 rounded-xl border border-input bg-background px-3" placeholder="المدينة" value={customer.city} onChange={(e) => setCustomer({ ...customer, city: e.target.value })} required /><input className="h-11 rounded-xl border border-input bg-background px-3" placeholder="العنوان" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} required /></div><button disabled={!cart.length} className="btn-primary mt-4">تأكيد الطلب</button>{orderMessage && <p className="mt-4 rounded-xl bg-mint p-3 text-primary">{orderMessage}</p>}</form></section>
    </main>
  );
}
