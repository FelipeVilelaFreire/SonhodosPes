import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { APP_CONFIG } from '@/src/constants/config';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;
  if (!APP_CONFIG.SUPABASE.URL || !APP_CONFIG.SUPABASE.ANON_KEY) {
    return null;
  }
  _client = createClient(APP_CONFIG.SUPABASE.URL, APP_CONFIG.SUPABASE.ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return _client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(APP_CONFIG.SUPABASE.URL && APP_CONFIG.SUPABASE.ANON_KEY);
}
