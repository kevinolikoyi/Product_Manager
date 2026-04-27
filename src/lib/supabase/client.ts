import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
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
    browserClient = createBrowserClient(config.url, config.anonKey, {
      auth: {
        detectSessionInUrl: false,
      },
    });
    browserClientKey = nextClientKey;
  }

  return browserClient;
}
