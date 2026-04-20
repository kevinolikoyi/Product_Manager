import {
  FolderKanban,
  LayoutDashboard,
  Settings2,
  WalletCards,
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
    label: "Taches",
    href: "/tasks",
    icon: ListTodo,
    section: "navigation",
  },
  {
    label: "Projets",
    href: "/projects",
    icon: FolderKanban,
    section: "navigation",
  },
  {
    label: "Finances",
    href: "/finance",
    icon: WalletCards,
    section: "navigation",
  },
  {
    label: "Configuration",
    href: "/settings",
    icon: Settings2,
    section: "settings",
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
    title: "Taches",
    description: "Suivi des priorites, risques et echeances de livraison.",
    eyebrow: "Execution",
  },
  "/projects": {
    title: "Projets",
    description: "Avancement des squads et sante du portefeuille produit.",
    eyebrow: "Portefeuille",
  },
  "/finance": {
    title: "Finances",
    description: "Lecture rapide des revenus, depenses et marge operationnelle.",
    eyebrow: "Performance",
  },
  "/settings": {
    title: "Configuration",
    description: "Preferences d'affichage, densite et comportement de l'interface.",
    eyebrow: "Workspace",
  },
};
