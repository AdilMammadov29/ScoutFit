/**
 * Kullanıcıya özel localStorage anahtarı üretir.
 * Oturum yoksa "guest" kullanılır.
 */
export function kullaniciAnahtari(base: string): string {
  try {
    // Supabase session (tercih edilen)
    const raw =
      localStorage.getItem("sb-auth-token") ||
      Object.keys(localStorage)
        .find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
    if (raw) {
      const key = typeof raw === "string" && raw.startsWith("sb-") ? raw : null;
      const tokenStr = key ? localStorage.getItem(key) : null;
      if (tokenStr) {
        const parsed = JSON.parse(tokenStr);
        const uid = parsed?.user?.id || parsed?.currentSession?.user?.id;
        if (uid) return `${base}_${uid}`;
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const authData = localStorage.getItem("scoutfit-auth");
    if (authData) {
      const parsed = JSON.parse(authData);
      const id = parsed?.state?.currentUser?.id;
      if (id) return `${base}_${id}`;
    }
  } catch {
    /* ignore */
  }

  return `${base}_guest`;
}

/** Aktif Supabase user id (yoksa null) */
export function aktifKullaniciId(): string | null {
  try {
    const key = Object.keys(localStorage).find(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
    );
    if (key) {
      const parsed = JSON.parse(localStorage.getItem(key) || "{}");
      return parsed?.user?.id || parsed?.currentSession?.user?.id || null;
    }
  } catch {
    /* ignore */
  }
  try {
    const authData = localStorage.getItem("scoutfit-auth");
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed?.state?.currentUser?.id || null;
    }
  } catch {
    /* ignore */
  }
  return null;
}
