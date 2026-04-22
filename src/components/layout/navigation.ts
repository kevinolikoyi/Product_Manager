import {
  FolderKanban,
  LayoutDashboard,
  LayoutGrid,
  ListTodo,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  section: "navigation" | "settings";
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
    label: "Tâches",
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
];

export const pageMetadata: Record<
  string,
  { title: string; description: string; eyebrow: string }
> = {
  "/dashboard": {
    title: "Tableau de bord",
    description: "Pilotage global des operations, alertes et execution des equipes.",
    eyebrow: "Vue d'ensemble",
  },
  "/tasks": {
    title: "Tâches",
    description: "Suivi des priorites, risques et echeances de livraison.",
    eyebrow: "Execution",
  },
  "/projects": {
    title: "Projets",
    description: "Avancement des squads et sante du portefeuille produit.",
    eyebrow: "Portefeuille",
  },
  "/kanban": {
    title: "Kanban",
    description: "Pilotage visuel des Tâches avec drag-and-drop entre les statuts.",
    eyebrow: "Workflow",
  },
};
