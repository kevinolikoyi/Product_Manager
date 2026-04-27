import type { WorkspaceRole } from "@/lib/types";

export type LegacyWorkspaceRole = WorkspaceRole | "member";

const roleRank: Record<WorkspaceRole, number> = {
  collaborator: 1,
  manager: 2,
  owner: 3,
};

export function normalizeWorkspaceRole(role: LegacyWorkspaceRole): WorkspaceRole {
  return role === "member" ? "collaborator" : role;
}

export function getRoleLabel(role: WorkspaceRole) {
  if (role === "owner") {
    return "Owner";
  }

  if (role === "manager") {
    return "Manager";
  }

  return "Collaborateur";
}

export function hasMinimumRole(
  currentRole: WorkspaceRole | null | undefined,
  minimumRole: WorkspaceRole,
) {
  if (!currentRole) {
    return false;
  }

  return roleRank[currentRole] >= roleRank[minimumRole];
}

export function canManageProjects(role: WorkspaceRole | null | undefined) {
  return hasMinimumRole(role, "manager");
}

export function canManageFinance(role: WorkspaceRole | null | undefined) {
  return hasMinimumRole(role, "manager");
}

export function canManageCollaborators(role: WorkspaceRole | null | undefined) {
  return hasMinimumRole(role, "manager");
}

export function canViewExecutiveDashboard(role: WorkspaceRole | null | undefined) {
  return hasMinimumRole(role, "manager");
}

export function canManageTasks(role: WorkspaceRole | null | undefined) {
  return hasMinimumRole(role, "collaborator");
}

export function canAccessRoute(
  role: WorkspaceRole | null | undefined,
  route: string,
) {
  if (route === "/finance") {
    return canManageFinance(role);
  }

  if (route === "/projects") {
    return hasMinimumRole(role, "collaborator");
  }

  if (route === "/dashboard") {
    return hasMinimumRole(role, "collaborator");
  }

  if (route === "/tasks" || route === "/kanban" || route === "/settings") {
    return canManageTasks(role);
  }

  return true;
}
