export type WorkspaceRole = "owner" | "manager" | "collaborator";

export interface Department {
  id: string;
  name: string;
  slug: string;
}

export interface Finance {
  id: string;
  periodStart: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface Member {
  id: string;
  name: string;
  departmentId: string;
  role: WorkspaceRole;
  email?: string;
}

export interface Project {
  id: string;
  name: string;
  departmentId: string;
  status: "active" | "completed" | "on_hold";
  progress: number;
  numberOfTasks: number;
}

export interface Task {
  id: string;
  title: string;
  projectId: string;
  assigneeId?: string;
  status: "todo" | "in_progress" | "done" | "tested" | "deployed";
  priority: "low" | "medium" | "high";
  risk: "low" | "medium" | "high";
  dueDate: string;
}
