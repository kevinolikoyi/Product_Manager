export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
  workspaceSlug: string;
}

function readSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  const workspaceSlug =
    process.env.NEXT_PUBLIC_SUPABASE_WORKSPACE_SLUG?.trim() ?? "";

  return {
    url,
    anonKey: publishableKey || anonKey,
    workspaceSlug,
  };
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const { url, anonKey, workspaceSlug } = readSupabasePublicEnv();

  if (!url || !anonKey || !workspaceSlug) {
    return null;
  }

  return {
    url,
    anonKey,
    workspaceSlug,
  };
}

export function isSupabaseConfigured() {
  return getSupabasePublicConfig() !== null;
}
