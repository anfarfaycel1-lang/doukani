import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useServerFn } from "@tanstack/react-start";
import { ensureMerchantAccount } from "@/lib/merchant.functions";
import { Store, Mail, Lock, User, Chrome } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "تسجيل الدخول — دكاني" }, { name: "description", content: "تسجيل دخول وإنشاء حساب التجار في منصة دكاني." }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const ensureMerchantFn = useServerFn(ensureMerchantAccount);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const result = mode === "signup"
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin + "/dashboard" } })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (result.error) return setMessage(result.error.message);
    if (mode === "signup" && !result.data.session) return setMessage("تم إنشاء الحساب. تحقق من بريدك الإلكتروني ثم سجل الدخول.");
    await ensureMerchantFn({ data: { fullName } });
    navigate({ to: "/dashboard" });
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) setMessage(String(result.error.message ?? result.error));
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 md:grid-cols-[1fr_1.1fr]">
        <section className="bg-primary p-10 text-primary-foreground">
          <Store className="h-12 w-12" />
          <h1 className="mt-8 text-4xl font-black">ادخل إلى دكاني</h1>
          <p className="mt-4 text-primary-foreground/85">أنشئ متجرك، أضف منتجاتك، وتتبع طلبات COD وواتساب من لوحة واحدة.</p>
        </section>
        <section className="p-8">
          <div className="mb-6 flex rounded-xl bg-secondary p-1">
            <button onClick={() => setMode("login")} className={`flex-1 rounded-lg px-4 py-2 font-bold ${mode === "login" ? "bg-card text-primary shadow" : "text-muted-foreground"}`}>دخول</button>
            <button onClick={() => setMode("signup")} className={`flex-1 rounded-lg px-4 py-2 font-bold ${mode === "signup" ? "bg-card text-primary shadow" : "text-muted-foreground"}`}>حساب جديد</button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && <label className="block text-sm font-bold"><User className="mb-2 inline h-4 w-4" /> الاسم<input className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3" value={fullName} onChange={(e) => setFullName(e.target.value)} required /></label>}
            <label className="block text-sm font-bold"><Mail className="mb-2 inline h-4 w-4" /> البريد<input type="email" className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label className="block text-sm font-bold"><Lock className="mb-2 inline h-4 w-4" /> كلمة المرور<input type="password" className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></label>
            {message && <p className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">{message}</p>}
            <button disabled={loading} className="btn-primary w-full justify-center" type="submit">{loading ? "جاري..." : mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}</button>
          </form>
          <button onClick={google} className="btn-ghost mt-4 w-full justify-center"><Chrome className="h-4 w-4" /> الدخول بحساب Google</button>
          <a href="/admin" className="mt-5 block text-center text-sm font-bold text-primary">دخول Super Admin</a>
        </section>
      </div>
    </main>
  );
}
