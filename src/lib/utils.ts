import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Project, Task } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const statusLabels: Record<Task["status"], string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminer",
  tested: "Tester / Vérifier",
  deployed: "Déployer / Livrer",
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
  timeZone: "UTC",
});

const fullDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const financeMonthFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
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
  return new Date().toISOString().slice(0, 10);
}

export function getCurrentMonthInputValue() {
  return new Date().toISOString().slice(0, 7);
}

function parseIsoDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

export function formatFinanceMonth(periodStart: string) {
  if (!periodStart) {
    return "-";
  }

  return financeMonthFormatter.format(parseIsoDate(periodStart));
}

export function monthInputToPeriodStart(value: string) {
  return value ? `${value}-01` : "";
}

export function periodStartToMonthInput(value: string) {
  return value.slice(0, 7);
}

export function formatShortDate(date: string) {
  if (!date) {
    return "-";
  }

  return shortDateFormatter.format(parseIsoDate(date));
}

export function formatFullDate(date: string) {
  if (!date) {
    return "-";
  }

  return fullDateFormatter.format(parseIsoDate(date));
}

export function formatCompactCurrency(value: number) {
  return compactCurrencyFormatter.format(value);
}

export function formatCurrency(value: number) {
  return standardCurrencyFormatter.format(value);
}

export function isTaskComplete(task: Task) {
  return task.status === "done" || task.status === "tested" || task.status === "deployed";
}

export function isTaskOverdue(task: Task, today = getTodayIsoDate()) {
  return task.dueDate < today && !isTaskComplete(task);
}

export function getTaskPriorityScore(task: Task, today = getTodayIsoDate()) {
  const priorityValue = { high: 3, medium: 2, low: 1 }[task.priority];
  const riskValue = { high: 4, medium: 2, low: 1 }[task.risk];
  const overdueBonus = isTaskOverdue(task, today) ? 4 : 0;

  return priorityValue + riskValue + overdueBonus;
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
