"use server";

import "server-only";

import { randomBytes } from "crypto";
import { getAuthenticatedCollaborator, getAuthenticatedUser } from "@/lib/auth";
import { getDepartmentById } from "@/lib/departments";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type RequestedCollaboratorRole = "collaborator" | "manager";
type DatabaseCollaboratorRole = "member" | "manager";

export interface CreateCollaboratorActionState {
  error?: string;
  success?: {
    fullName: string;
    email: string;
    roleLabel: string;
    temporaryPassword: string;
  };
}

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  let body = "";

  for (const byte of bytes) {
    body += alphabet[byte % alphabet.length];
  }

  return `Temp-${body}`;
}

function mapRequestedRoleToDatabaseRole(
  role: RequestedCollaboratorRole,
): DatabaseCollaboratorRole {
  return role === "manager" ? "manager" : "member";
}

function getRoleLabel(role: RequestedCollaboratorRole) {
  return role === "manager" ? "Manager" : "Collaborateur";
}

export async function createCollaborator(
  _previousState: CreateCollaboratorActionState | undefined,
  formData: FormData,
): Promise<CreateCollaboratorActionState> {
  const [user, actor] = await Promise.all([
    getAuthenticatedUser(),
    getAuthenticatedCollaborator(),
  ]);

  if (!user?.email) {
    return {
      error: "Session utilisateur introuvable. Réconnectez-vous puis réessayez.",
    };
  }

  if (!actor) {
    return {
      error:
        "Le compte connecté n'est pas relié à un collaborateur du workspace avec un role exploitable.",
    };
  }

  if (actor.role !== "owner" && actor.role !== "manager") {
    return {
      error: `Accès reservé aux managers et owners. Rôle détecté : ${actor.role}.`,
    };
  }

  const fullName = readField(formData, "fullName");
  const email = readField(formData, "email").toLowerCase();
  const departmentId = readField(formData, "departmentId");
  const requestedRole = readField(formData, "role") as RequestedCollaboratorRole;
  const config = getSupabasePublicConfig();
  const adminClient = getSupabaseAdminClient();

  if (!config || !adminClient) {
    return {
      error: "Configuration admin Supabase incomplète. Ajoutez SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  if (!fullName || !email || !departmentId) {
    return {
      error: "Nom, e-mail et departement sont requis.",
    };
  }

  if (!["collaborator", "manager"].includes(requestedRole)) {
    return {
      error: "Role invalide.",
    };
  }

  if (requestedRole === "manager" && actor.role !== "owner") {
    return {
      error: "Seul un owner peut creer un manager.",
    };
  }

  const department = getDepartmentById(departmentId);
  if (!department) {
    return {
      error: "Departement introuvable.",
    };
  }

  const { data: workspace, error: workspaceError } = await adminClient
    .from("workspaces")
    .select("id")
    .eq("slug", config.workspaceSlug)
    .maybeSingle();

  if (workspaceError || !workspace) {
    return {
      error: "Workspace introuvable pour la creation du collaborateur.",
    };
  }

  const { data: databaseDepartment, error: departmentError } = await adminClient
    .from("departments")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("slug", department.slug)
    .maybeSingle();

  if (departmentError || !databaseDepartment) {
    return {
      error: "Departement base de donnees introuvable.",
    };
  }

  const { data: existingCollaborator, error: existingCollaboratorError } = await adminClient
    .from("collaborators")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("email", email)
    .maybeSingle();

  if (existingCollaboratorError) {
    return {
      error: "Verification des collaborateurs impossible.",
    };
  }

  if (existingCollaborator) {
    return {
      error: "Un collaborateur existe deja avec cet e-mail dans ce workspace.",
    };
  }

  const temporaryPassword = generateTemporaryPassword();
  const databaseRole = mapRequestedRoleToDatabaseRole(requestedRole);

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      workspace_slug: config.workspaceSlug,
      role: requestedRole,
    },
  });

  if (authError || !authData.user) {
    return {
      error: authError?.message ?? "Creation du compte Auth impossible.",
    };
  }

  const { error: collaboratorError } = await adminClient.from("collaborators").insert({
    workspace_id: workspace.id,
    department_id: databaseDepartment.id,
    full_name: fullName,
    email,
    role: databaseRole,
  });

  if (collaboratorError) {
    await adminClient.auth.admin.deleteUser(authData.user.id);

    return {
      error: collaboratorError.message,
    };
  }

  return {
    success: {
      fullName,
      email,
      roleLabel: getRoleLabel(requestedRole),
      temporaryPassword,
    },
  };
}
