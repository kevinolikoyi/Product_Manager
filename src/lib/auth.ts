import { cache } from "react";
import { redirect } from "next/navigation";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { normalizeWorkspaceRole } from "@/lib/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface AuthenticatedCollaborator {
  id: number;
  workspaceId: number;
  fullName: string;
  email: string | null;
  role: ReturnType<typeof normalizeWorkspaceRole>;
}

export const getAuthenticatedUser = cache(async () => {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
});

export const getAuthenticatedCollaborator = cache(async () => {
  const [supabase, user] = await Promise.all([
    getSupabaseServerClient(),
    getAuthenticatedUser(),
  ]);
  const config = getSupabasePublicConfig();

  if (!supabase || !config || !user?.email) {
    return null;
  }

  const normalizedUserEmail = user.email.trim().toLowerCase();

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", config.workspaceSlug)
    .maybeSingle();

  if (workspaceError || !workspace) {
    return null;
  }

  const { data: collaborators, error: collaboratorError } = await supabase
    .from("collaborators")
    .select("id, workspace_id, full_name, email, role")
    .eq("workspace_id", workspace.id)
    .order("id", { ascending: true });

  if (collaboratorError || !collaborators) {
    return null;
  }

  const collaborator =
    collaborators.find(
      (candidate) => candidate.email?.trim().toLowerCase() === normalizedUserEmail,
    ) ?? null;

  if (!collaborator) {
    return null;
  }

  return {
    id: collaborator.id,
    workspaceId: collaborator.workspace_id,
    fullName: collaborator.full_name,
    email: collaborator.email,
    role: normalizeWorkspaceRole(collaborator.role),
  } satisfies AuthenticatedCollaborator;
});

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
