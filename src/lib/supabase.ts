import { createClient } from "@supabase/supabase-js";

const adres = String(import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const anahtar = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

export const supabaseHazir = Boolean(adres && anahtar);

export const supabase = createClient(adres || "https://yok.invalid", anahtar || "yok", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});