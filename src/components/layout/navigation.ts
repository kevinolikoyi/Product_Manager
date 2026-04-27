import {
  FolderKanban,
  LayoutDashboard,
  LayoutGrid,
  ListTodo,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { WorkspaceRole } from "@/lib/types";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  section: "navigation" | "settings";
  minimumRole?: WorkspaceRole;
}

export const navigationItems: NavigationItem[] = [
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
    section: "navigation",
  },
  {
    label: "Projets",
    href: "/projects",
    icon: FolderKanban,
    section: "navigation",
  },
  {
    label: "Taches",
    href: "/tasks",
    icon: ListTodo,
    section: "navigation",
  },
  {
    label: "Kanban",
    href: "/kanban",
    icon: LayoutGrid,
    section: "navigation",
  },
  {
    label: "Gestion des collaborateurs",
    href: "/settings",
    icon: UsersRound,
    section: "settings",
    minimumRole: "manager",
  },
];

export const pageMetadata: Record<
  string,
  { title: string; description: string; eyebrow: string }
> = {
  "/dashboard": {
    title: "Tableau de bord",
    description: "Pilotage global des opérations, alertes et exécution des équipes.",
    eyebrow: "Vue d'ensemble",
  },
  "/tasks": {
    title: "Taches",
    description: "Suivi des priorités, risques et échéances de livraison.",
    eyebrow: "Execution",
  },
  "/projects": {
    title: "Projets",
    description: "Avancement des squads et santé du portefeuille produit.",
    eyebrow: "Portefeuille",
  },
  "/kanban": {
    title: "Kanban",
    description: "Pilotage visuel des tâches avec glisser-deposer entre les statuts.",
    eyebrow: "Workflow",
  },
  "/finance": {
    title: "Finances",
    description: "Suivi des revenus, dépenses et niveaux de marge du workspace.",
    eyebrow: "Performance",
  },
  "/settings": {
    title: "Configuration",
    description: "Préférences d'affichage et ajustements de l'espace de travail.",
    eyebrow: "Workspace",
  },
};
