// src/lib/supabase.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

// Lazy initialization to avoid build-time errors
let _supabase: SupabaseClient | null = null;

export const supabase = (() => {
  if (_supabase) return _supabase;

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build, return a mock that will error at runtime
    console.warn('[Supabase] Credentials not found - will fail at runtime if used');
    return null as unknown as SupabaseClient;
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return _supabase;
})();