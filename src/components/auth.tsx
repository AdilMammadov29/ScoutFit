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
          skipBrowserRedirect: true,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;

      if (data?.url) {
        if (isNative) {
          await Browser.open({ url: data.url, windowName: "_system" });
        } else {
          window.location.href = data.url;
        }
      }
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          (isTr ? "Google ile giriş başlatılamadı." : "Failed to start Google sign-in.")
      );
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
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-between items-center px-6 py-12 select-none font-sans transition-colors duration-150">
      <div className="w-full max-w-sm flex flex-col items-center pt-8">
        {/* Monogram Logo */}
        <div className="w-14 h-14 rounded-2xl bg-pine text-paper flex items-center justify-center mb-8 shadow-sm">
          <span className="font-serif font-bold text-2xl tracking-tight">SF</span>
        </div>

        {/* Tipografi & Slogan */}
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">
            ScoutFit
          </h1>
          <p className="text-[13px] text-muted leading-relaxed">
            {isTr ? "Kişisel Antrenman ve Beslenme Günlüğü" : "Personal Training & Nutrition Journal"}
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4 pb-4">
        {errorMsg && (
          <div className="p-3.5 rounded-xl border border-clay/30 bg-clay/5 text-clay text-[13px] leading-relaxed">
            {errorMsg}
          </div>
        )}
        {infoMsg && (
          <div className="p-3.5 rounded-xl border border-pine/30 bg-pine/5 text-pine text-[13px] leading-relaxed">
            {infoMsg}
          </div>
        )}

        {/* Google Giriş Butonu */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full min-h-[48px] rounded-xl border border-line bg-surface text-ink font-medium text-[14px] px-5 flex items-center justify-between shadow-sm active:scale-[0.99] transition-all hover:border-muted/40 disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
            <span>
              {isTr ? "Google ile Devam Et" : "Continue with Google"}
            </span>
          </div>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted" />
          ) : (
            <ArrowRight className="w-4 h-4 text-muted" />
          )}
        </button>

        {/* E-posta ile Giriş Akordeon */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowEmailAuth(!showEmailAuth)}
            className="w-full min-h-[44px] rounded-xl bg-surface text-ink font-medium text-[13px] px-4 flex items-center justify-between border border-line hover:border-muted/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-muted" />
              <span>{isTr ? "E-posta ile Devam Et" : "Continue with Email"}</span>
            </div>
            {showEmailAuth ? (
              <ChevronUp className="w-4 h-4 text-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted" />
            )}
          </button>

          {showEmailAuth && (
            <div className="mt-3 p-4 rounded-xl bg-surface border border-line space-y-4">
              <div className="flex border-b border-line pb-2 text-[13px] font-medium">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`flex-1 text-center py-1.5 rounded-lg transition-colors ${
                    mode === "login"
                      ? "bg-paper text-ink font-semibold"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {isTr ? "Giriş" : "Login"}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`flex-1 text-center py-1.5 rounded-lg transition-colors ${
                    mode === "register"
                      ? "bg-paper text-ink font-semibold"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {isTr ? "Kayıt" : "Register"}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl bg-paper border border-line text-[14px] text-ink placeholder:text-muted/60 outline-none focus:border-muted/60 transition-colors"
                  />
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl bg-paper border border-line text-[14px] text-ink placeholder:text-muted/60 outline-none focus:border-muted/60 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[44px] rounded-xl bg-pine text-paper font-medium text-[13px] flex items-center justify-center gap-2 transition-opacity hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-paper" />
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

        <p className="text-[12px] text-center text-muted pt-2 leading-relaxed">
          {isTr
            ? "Devam ederek Kullanım Şartları ve Gizlilik Politikasını kabul etmiş olursunuz."
            : "By continuing, you agree to our Terms of Service and Privacy Policy."}
        </p>
      </div>
    </div>
  );
}

export default AuthView;