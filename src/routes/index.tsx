import { createFileRoute } from "@tanstack/react-router";
import { Star, Package, ShoppingCart, BarChart3, Shield, Link2, Zap, ArrowLeft, Check } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "دكاني — أنشئ متجرك الإلكتروني في دقائق" },
      { name: "description", content: "منصة مغربية متكاملة لإنشاء متجرك الإلكتروني وإدارة منتجاتك وطلباتك وأرباحك بكل سهولة." },
      { property: "og:title", content: "دكاني — منصة التجارة الإلكترونية رقم 1 في المغرب" },
      { property: "og:description", content: "أنشئ متجرك الإلكتروني في دقائق وابدأ البيع مجاناً." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap" },
    ],
  }),
  component: Home,
});

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary-light to-primary text-primary-foreground shadow-md">
        <Star className="h-5 w-5 fill-current" />
      </div>
      <span className="text-xl font-black tracking-tight text-primary">دكاني</span>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-foreground/80 md:flex">
          <a href="#features" className="hover:text-primary">الميزات</a>
          <a href="#pricing" className="hover:text-primary">الأسعار</a>
          <a href="#about" className="hover:text-primary">من نحن</a>
        </nav>
        <div className="flex items-center gap-2">
          <a href="/login" className="hidden btn-ghost text-sm sm:inline-flex">تسجيل الدخول</a>
          <a href="/login" className="btn-primary text-sm">أنشئ متجرك</a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-24 sm:pt-24">
      <div className="mx-auto max-w-4xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-mint/60 px-4 py-1.5 text-xs font-semibold text-primary">
          <Star className="h-3.5 w-3.5 fill-current" />
          المنصة رقم 1 للتجارة الإلكترونية في المغرب
        </span>
        <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight text-foreground sm:text-6xl md:text-7xl">
          أنشئ متجرك الإلكتروني
          <br />
          <span className="bg-gradient-to-l from-gold via-primary-light to-primary bg-clip-text text-transparent">
            في دقائق
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          دكاني منصة مغربية متكاملة تمكنك من إنشاء متجرك الإلكتروني وإدارة منتجاتك وطلباتك وأرباحك بكل سهولة
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href="/login" className="btn-primary">
            <ArrowLeft className="h-4 w-4" />
            ابدأ مجاناً الآن
          </a>
          <a href="#features" className="btn-ghost">شاهد كيف تعمل</a>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          لا حاجة لبطاقة بنكية · مجاناً للأبد في الخطة الأساسية
        </p>
      </div>

      <DashboardMock />
    </section>
  );
}

function DashboardMock() {
  const tabs = [
    { label: "لوحة التحكم", active: true },
    { label: "المنتجات" },
    { label: "الطلبات" },
    { label: "التقارير" },
  ];
  const stats = [
    { label: "إجمالي المبيعات", value: "24,500 د.م", bg: "bg-secondary" },
    { label: "صافي الربح", value: "8,200 د.م", bg: "bg-mint" },
    { label: "الطلبات اليوم", value: "12 طلب", bg: "bg-peach" },
    { label: "المنتجات النشطة", value: "48 منتج", bg: "bg-sky" },
  ];
  return (
    <div className="mx-auto mt-16 max-w-4xl rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-primary/10 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-destructive/70" />
        <span className="h-3 w-3 rounded-full bg-gold" />
        <span className="h-3 w-3 rounded-full bg-primary-light" />
        <div className="mr-3 h-4 flex-1 rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-2">
          {tabs.map((t) => (
            <div
              key={t.label}
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                t.active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70"
              }`}
            >
              {t.label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className={`rounded-xl ${s.bg} p-4`}>
              <div className="text-xs text-foreground/60">{s.label}</div>
              <div className="mt-2 text-xl font-black text-foreground">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Features() {
  const items = [
    { icon: Package, title: "إدارة المنتجات", desc: "رفع الصور، الأوصاف، وتتبع المخزون بسهولة", bg: "bg-mint" },
    { icon: ShoppingCart, title: "إدارة الطلبات", desc: "تتبع الطلبات من الاستلام حتى التوصيل", bg: "bg-peach" },
    { icon: BarChart3, title: "تقارير مالية", desc: "حاسبة آلية للأرباح بعد خصم التكاليف", bg: "bg-sky" },
    { icon: Shield, title: "أمان متكامل", desc: "حماية بيانات متجرك وعملائك", bg: "bg-secondary" },
    { icon: Link2, title: "رابط خاص بك", desc: "متجرك على رابط مخصص يحمل اسمك", bg: "bg-mint" },
    { icon: Zap, title: "سريع وسهل", desc: "أنشئ متجرك في دقائق بدون خبرة تقنية", bg: "bg-peach" },
  ];
  return (
    <section id="features" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">كل ما تحتاجه لمتجرك</h2>
          <p className="mt-4 text-lg text-muted-foreground">أدوات احترافية مصممة خصيصاً للسوق المغربي</p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, desc, bg }) => (
            <div key={title} className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
              <div className={`mb-4 grid h-12 w-12 place-items-center rounded-xl ${bg} text-primary`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "مجاني",
      price: "0",
      period: "دائماً",
      cta: "ابدأ مجاناً",
      features: ["5 منتجات", "20 طلب/شهر", "رابط فرعي", "دعم أساسي"],
    },
    {
      name: "أساسي",
      price: "99",
      period: "/شهر",
      cta: "ابدأ الآن",
      popular: true,
      features: ["100 منتج", "500 طلب/شهر", "رابط فرعي مخصص", "تقارير مالية", "دعم سريع"],
    },
    {
      name: "احترافي",
      price: "299",
      period: "/شهر",
      cta: "تواصل معنا",
      features: ["منتجات غير محدودة", "طلبات غير محدودة", "نطاق خاص", "تقارير متقدمة", "مدير حساب مخصص"],
    },
  ];
  return (
    <section id="pricing" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">خطط بأسعار مناسبة</h2>
          <p className="mt-4 text-lg text-muted-foreground">ابدأ مجاناً وطور خطتك عند الحاجة</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-8 transition ${
                p.popular
                  ? "border-primary bg-card shadow-2xl shadow-primary/20 md:-translate-y-4"
                  : "border-border bg-card"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 right-6 rounded-full bg-gradient-to-l from-gold to-primary-light px-4 py-1 text-xs font-bold text-primary-foreground">
                  الأكثر شيوعاً
                </span>
              )}
              <h3 className="text-2xl font-black">{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-black text-primary">{p.price}</span>
                <span className="text-sm font-semibold text-muted-foreground">د.م {p.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-mint text-primary">
                      <Check className="h-3 w-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/login"
                className={`mt-8 block text-center ${p.popular ? "btn-primary justify-center w-full" : "btn-ghost w-full"}`}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  const stories = ["متاجر أزياء رفعت طلبات واتساب في أول شهر", "حرفيون يبيعون داخل المغرب بخطوة دفع واحدة", "تجار COD يتابعون الأرباح والمخزون يومياً"];
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-4 sm:grid-cols-4">{[["+1200", "متجر"], ["+45K", "طلب"], ["42", "مدينة"], ["96%", "رضا"]].map(([v,l]) => <div key={l} className="rounded-2xl border border-border bg-card p-6 text-center"><strong className="text-4xl text-primary">{v}</strong><p className="mt-2 text-muted-foreground">{l}</p></div>)}</div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">{stories.map((story) => <article key={story} className="rounded-2xl border border-border bg-card p-6"><h3 className="font-black">قصة نجاح</h3><p className="mt-2 text-sm text-muted-foreground">{story}</p></article>)}</div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-light p-12 text-center text-primary-foreground shadow-2xl shadow-primary/30">
        <h2 className="text-3xl font-black sm:text-4xl">جاهز لإطلاق متجرك؟</h2>
        <p className="mt-3 text-primary-foreground/85">انضم لآلاف التجار المغاربة الذين يبيعون بنجاح عبر دكاني</p>
        <a href="/login" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-card px-6 py-3 font-bold text-primary shadow-lg transition hover:-translate-y-1">
          <ArrowLeft className="h-4 w-4" />
          أنشئ متجرك المجاني الآن
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="about" className="border-t border-border px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <Logo />
        <p>© {new Date().getFullYear()} دكاني. جميع الحقوق محفوظة.</p>
      </div>
    </footer>
  );
}

function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <SocialProof />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
