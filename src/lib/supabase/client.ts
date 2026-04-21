import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

let browserClient: SupabaseClient | null = null;
let browserClientKey: string | null = null;

export function getSupabaseBrowserClient() {
  const config = getSupabasePublicConfig();

  if (!config) {
    return null;
  }

  const nextClientKey = `${config.url}::${config.anonKey}`;

  if (!browserClient || browserClientKey !== nextClientKey) {
    browserClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    browserClientKey = nextClientKey;
  }

  return browserClient;
}
