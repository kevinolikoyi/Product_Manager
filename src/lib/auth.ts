import { cache } from "react";
import { redirect } from "next/navigation";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { normalizeWorkspaceRole } from "@/lib/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface AuthenticatedCollaborator {
  id: number;
  workspaceId: number;
  authUserId: string | null;
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

  if (!supabase || !config || !user) {
    return null;
  }

  const normalizedUserEmail = user.email?.trim().toLowerCase() ?? null;

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", config.workspaceSlug)
    .maybeSingle();

  if (workspaceError || !workspace) {
    return null;
  }

  const { data: collaboratorByAuthUserId, error: collaboratorByAuthUserIdError } =
    await supabase
      .from("collaborators")
      .select("id, workspace_id, auth_user_id, full_name, email, role")
      .eq("workspace_id", workspace.id)
      .eq("auth_user_id", user.id)
      .maybeSingle();

  if (collaboratorByAuthUserIdError) {
    return null;
  }

  const collaborator = collaboratorByAuthUserId ?? null;

  if (collaborator) {
    return {
      id: collaborator.id,
      workspaceId: collaborator.workspace_id,
      authUserId: collaborator.auth_user_id,
      fullName: collaborator.full_name,
      email: collaborator.email,
      role: normalizeWorkspaceRole(collaborator.role),
    } satisfies AuthenticatedCollaborator;
  }

  if (!normalizedUserEmail) {
    return null;
  }

  const { data: collaborators, error: collaboratorError } = await supabase
    .from("collaborators")
    .select("id, workspace_id, auth_user_id, full_name, email, role")
    .eq("workspace_id", workspace.id)
    .order("id", { ascending: true });

  if (collaboratorError || !collaborators) {
    return null;
  }

  const collaboratorByEmail =
    collaborators.find(
      (candidate) => candidate.email?.trim().toLowerCase() === normalizedUserEmail,
    ) ?? null;

  if (!collaboratorByEmail) {
    return null;
  }

  return {
    id: collaboratorByEmail.id,
    workspaceId: collaboratorByEmail.workspace_id,
    authUserId: collaboratorByEmail.auth_user_id,
    fullName: collaboratorByEmail.full_name,
    email: collaboratorByEmail.email,
    role: normalizeWorkspaceRole(collaboratorByEmail.role),
  } satisfies AuthenticatedCollaborator;
});

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
