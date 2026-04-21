export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
  workspaceSlug: string;
}

function readEnv(
  name:
    | "NEXT_PUBLIC_SUPABASE_URL"
    | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    | "NEXT_PUBLIC_SUPABASE_WORKSPACE_SLUG",
) {
  return process.env[name]?.trim() ?? "";
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey =
    readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ||
    readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const workspaceSlug = readEnv("NEXT_PUBLIC_SUPABASE_WORKSPACE_SLUG");

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
