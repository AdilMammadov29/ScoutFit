import { createClient } from "@supabase/supabase-js";

// Supabase bilgilerini doğrudan buraya ekliyoruz:
const adres = "https://bxccqrncfqbelcqeqogw.supabase.co"; 
const anahtar = "sb_publishable_pZiAyqCod_AEhME4vgke-g_B8z16rGX"; // Az önceki ekrandan kopyaladığın uzun anahtar

export const supabaseHazir = Boolean(adres && anahtar);

export const supabase = createClient(adres, anahtar, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});