export interface Project {
  id: string;
  name: string;
  status: "active" | "completed" | "on_hold";
  progress: number;
  numberOfTasks: number;
}

export const mockProjects: Project[] = [
  {
    id: "1",
    name: "Onboarding Utilisateur",
    status: "active",
    progress: 68,
    numberOfTasks: 14,
  },
  {
    id: "2",
    name: "Plateforme API",
    status: "active",
    progress: 41,
    numberOfTasks: 22,
  },
  {
    id: "3",
    name: "Design System",
    status: "active",
    progress: 83,
    numberOfTasks: 9,
  },
  {
    id: "4",
    name: "Operations Cloud",
    status: "on_hold",
    progress: 27,
    numberOfTasks: 11,
  },
  {
    id: "5",
    name: "Conformite",
    status: "active",
    progress: 18,
    numberOfTasks: 8,
  },
  {
    id: "6",
    name: "Performance",
    status: "completed",
    progress: 100,
    numberOfTasks: 16,
  },
];
