export interface Project {
  id: string;
  name: string;
  departmentId: string;
  status: "active" | "completed" | "on_hold";
  progress: number;
  numberOfTasks: number;
}

export const mockProjects: Project[] = [
  {
    id: "1",
    name: "Onboarding Utilisateur",
    departmentId: "dep-product",
    status: "active",
    progress: 68,
    numberOfTasks: 14,
  },
  {
    id: "2",
    name: "Plateforme API",
    departmentId: "dep-engineering",
    status: "active",
    progress: 41,
    numberOfTasks: 22,
  },
  {
    id: "3",
    name: "Design System",
    departmentId: "dep-design",
    status: "active",
    progress: 83,
    numberOfTasks: 9,
  },
  {
    id: "4",
    name: "Operations Cloud",
    departmentId: "dep-operations",
    status: "on_hold",
    progress: 27,
    numberOfTasks: 11,
  },
  {
    id: "5",
    name: "Conformite",
    departmentId: "dep-compliance",
    status: "active",
    progress: 18,
    numberOfTasks: 8,
  },
  {
    id: "6",
    name: "Performance",
    departmentId: "dep-performance",
    status: "completed",
    progress: 100,
    numberOfTasks: 16,
  },
  {
    id: "7",
    name: "Automations IA",
    departmentId: "dep-engineering",
    status: "active",
    progress: 54,
    numberOfTasks: 12,
  },
  {
    id: "8",
    name: "Finance Ops",
    departmentId: "dep-operations",
    status: "active",
    progress: 36,
    numberOfTasks: 7,
  },
  {
    id: "9",
    name: "Migrations",
    departmentId: "dep-operations",
    status: "active",
    progress: 49,
    numberOfTasks: 10,
  },
];
