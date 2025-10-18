import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

// ✅ Log to make sure we’re using the anon key, not the service key
console.log("🔑 Supabase client initialized", {
  url: SUPABASE_URL,
  keyPrefix: SUPABASE_ANON_KEY.slice(0, 15),
  keyLength: SUPABASE_ANON_KEY.length,
  keyType: SUPABASE_ANON_KEY.includes("service_role") ? "🚫 SERVICE KEY (wrong)" : "✅ ANON KEY",
});
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
