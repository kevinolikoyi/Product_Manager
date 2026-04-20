import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Project } from "@/data/mockProjects";
import type { Task } from "@/data/mockTasks";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const statusLabels: Record<Task["status"], string> = {
  todo: "A faire",
  in_progress: "En cours",
  done: "Terminee",
};

export const priorityLabels: Record<Task["priority"], string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
};

export const riskLabels: Record<Task["risk"], string> = {
  low: "Faible",
  medium: "Modere",
  high: "Eleve",
};

export const projectStatusLabels: Record<Project["status"], string> = {
  active: "Actif",
  completed: "Termine",
  on_hold: "En pause",
};

const shortDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});

const fullDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const compactCurrencyFormatter = new Intl.NumberFormat("fr-SN", {
  style: "currency",
  currency: "XOF",
  notation: "compact",
  maximumFractionDigits: 1,
});

const standardCurrencyFormatter = new Intl.NumberFormat("fr-SN", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});

export function getTodayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

export function formatShortDate(date: string) {
  return shortDateFormatter.format(new Date(date));
}

export function formatFullDate(date: string) {
  return fullDateFormatter.format(new Date(date));
}

export function formatCompactCurrency(value: number) {
  return compactCurrencyFormatter.format(value);
}

export function formatCurrency(value: number) {
  return standardCurrencyFormatter.format(value);
}

export function isTaskOverdue(task: Task, today = getTodayIsoDate()) {
  return task.dueDate < today && task.status !== "done";
}

export function isTaskBlocked(task: Task) {
  return task.risk === "high" && task.status === "in_progress";
}

export function getTaskPriorityScore(task: Task, today = getTodayIsoDate()) {
  const priorityValue = { high: 3, medium: 2, low: 1 }[task.priority];
  const riskValue = { high: 4, medium: 2, low: 1 }[task.risk];
  const overdueBonus = isTaskOverdue(task, today) ? 4 : 0;
  const blockedBonus = isTaskBlocked(task) ? 5 : 0;

  return priorityValue + riskValue + overdueBonus + blockedBonus;
}

export function getProjectProgressTone(status: Project["status"]) {
  switch (status) {
    case "active":
      return "bg-indigo-500";
    case "completed":
      return "bg-emerald-500";
    case "on_hold":
      return "bg-amber-500";
    default:
      return "bg-slate-400";
  }
}
