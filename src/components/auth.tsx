import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Lock, Mail, ArrowRight, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

export function AuthView() {
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const isTr = typeof navigator !== "undefined" && navigator.language?.startsWith("tr");

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const isNative = Capacitor.isNativePlatform();
      const redirectUrl = isNative
        ? "scoutfit://auth/callback"
        : `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: isNative,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;

      if (data?.url) {
        if (isNative) {
          await Browser.open({ url: data.url, windowName: "_self" });
        } else {
          window.location.href = data.url;
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || (isTr ? "Google ile giriş başlatılamadı." : "Failed to start Google sign-in."));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!email || !password) {
      setErrorMsg(isTr ? "Lütfen e-posta ve şifrenizi girin." : "Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setInfoMsg(
          isTr
            ? "Hesabınız oluşturuldu. E-postanızı doğrulayarak giriş yapabilirsiniz."
            : "Account created. You can log in after verifying your email."
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || (isTr ? "Bir hata oluştu." : "An error occurred."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100 flex flex-col justify-between items-center px-6 py-12 select-none">
      <div className="w-full max-w-sm flex flex-col items-center pt-8">
        {/* Minimal Monogram Logo */}
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-10 shadow-2xl">
          <span className="text-[#121212] font-black tracking-tighter text-2xl font-mono">SF</span>
        </div>

        {/* Tipografi / Slogan */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase font-sans">
            ScoutFit
          </h1>
          <p className="text-sm font-semibold tracking-widest text-zinc-400 uppercase font-mono">
            {isTr ? "BİLİMLE GELİŞTİRİLDİ, SİHİR GİBİ HİSSETTİRİR" : "DRIVEN BY SCIENCE, FEELS LIKE MAGIC"}
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4 pb-4">
        {errorMsg && (
          <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs leading-relaxed">
            {errorMsg}
          </div>
        )}
        {infoMsg && (
          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-xs leading-relaxed">
            {infoMsg}
          </div>
        )}

        {/* Ana Google Giriş Butonu */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full h-14 rounded-2xl bg-white text-black font-semibold text-sm px-5 flex items-center justify-between shadow-lg active:scale-[0.98] transition-all disabled:opacity-60"
        >
          <div className="flex items-center gap-3.5">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-medium text-sm">
              {isTr ? "Google ile Devam Et" : "Continue with Google"}
            </span>
          </div>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-black" />
          ) : (
            <ArrowRight className="w-4 h-4 text-zinc-500" />
          )}
        </button>

        {/* E-posta ile Giriş Opsiyonu */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowEmailAuth(!showEmailAuth)}
            className="w-full h-12 rounded-xl bg-[#1c1c1e] text-zinc-300 font-medium text-xs px-4 flex items-center justify-between border border-zinc-800/80 active:bg-zinc-800/80 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-zinc-400" />
              <span>{isTr ? "E-posta ile Devam Et" : "Continue with Email"}</span>
            </div>
            {showEmailAuth ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </button>

          {showEmailAuth && (
            <div className="mt-3 p-4 rounded-2xl bg-[#1c1c1e] border border-zinc-800/80 space-y-3.5">
              <div className="flex border-b border-zinc-800 pb-2.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`flex-1 text-center py-1 rounded-md transition-colors ${
                    mode === "login" ? "text-white bg-zinc-800" : "text-zinc-500"
                  }`}
                >
                  {isTr ? "Giriş" : "Login"}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`flex-1 text-center py-1 rounded-md transition-colors ${
                    mode === "register" ? "text-white bg-zinc-800" : "text-zinc-500"
                  }`}
                >
                  {isTr ? "Kayıt" : "Register"}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-black/60 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-black/60 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : mode === "login" ? (
                    isTr ? "Giriş Yap" : "Sign In"
                  ) : (
                    isTr ? "Hesap Oluştur" : "Sign Up"
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-[11px] text-center text-zinc-600 pt-2 leading-relaxed">
          {isTr
            ? "Devam ederek Kullanım Şartları ve Gizlilik Politikasını kabul etmiş olursunuz."
            : "By continuing, you agree to our Terms of Service and Privacy Policy."}
        </p>
      </div>
    </div>
  );
}

export default AuthView;