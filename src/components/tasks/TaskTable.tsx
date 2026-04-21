"use client";

import type { Task } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { useMemberDirectory, useProjectDirectory } from "@/lib/store";
import {
  cn,
  formatShortDate,
  getTaskPriorityScore,
  getTodayIsoDate,
  isTaskComplete,
  isTaskOverdue,
  priorityLabels,
  riskLabels,
  statusLabels,
} from "@/lib/utils";

interface TaskTableProps {
  tasks: Task[];
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
}

export default function TaskTable({ tasks, onEdit, onDelete }: TaskTableProps) {
  const today = getTodayIsoDate();
  const { getProjectDepartmentName, getProjectName } = useProjectDirectory();
  const { getMemberName } = useMemberDirectory();

  return (
    <div className="overflow-hidden rounded-[30px] border border-white/60">
      <div className="divide-y divide-slate-200/70 md:hidden">
        {tasks.map((task) => {
          const overdue = isTaskOverdue(task, today);
          const score = getTaskPriorityScore(task, today);

          return (
            <article key={task.id} className="space-y-4 bg-white/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                    {task.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {getProjectName(task.projectId)} {"·"} {getProjectDepartmentName(task.projectId)}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  Score {score}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                  {statusLabels[task.status]}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1",
                    task.priority === "high"
                      ? "bg-red-100 text-red-700"
                      : task.priority === "medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700",
                  )}
                >
                  {priorityLabels[task.priority]}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1",
                    task.risk === "high"
                      ? "bg-red-100 text-red-700"
                      : task.risk === "medium"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-emerald-100 text-emerald-700",
                  )}
                >
                  Risque {riskLabels[task.risk]}
                </span>
              </div>

              <div className="grid gap-3 rounded-[22px] bg-slate-50/90 p-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Assigne</span>
                  <span className="font-medium text-slate-900">
                    {getMemberName(task.assigneeId)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Date limite</span>
                  <span className="font-medium text-slate-900">
                    {formatShortDate(task.dueDate)}
                  </span>
                </div>
                {overdue ? (
                  <span className="inline-flex w-fit rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                    En retard
                  </span>
                ) : task.dueDate === today && !isTaskComplete(task) ? (
                  <span className="inline-flex w-fit rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                    Aujourd&apos;hui
                  </span>
                ) : null}
              </div>

              {onEdit || onDelete ? (
                <div className="flex flex-wrap gap-2">
                  {onEdit ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => onEdit(task)}>
                      Modifier
                    </Button>
                  ) : null}
                  {onDelete ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(task.id)}
                    >
                      Supprimer
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50/90 text-left">
              <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Titre
              </th>
              <th className="px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Projet
              </th>
              <th className="px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Statut
              </th>
              <th className="px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Priorité
              </th>
              <th className="px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Risque
              </th>
              <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Date limite
              </th>
              {onEdit || onDelete ? (
                <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="bg-white/80">
            {tasks.map((task) => {
              const overdue = isTaskOverdue(task, today);
              const score = getTaskPriorityScore(task, today);

              return (
                <tr key={task.id} className="transition hover:bg-slate-50/80">
                  <td className="border-t border-slate-200/70 px-5 py-4 align-top">
                    <div className="min-w-[260px]">
                      <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                        {task.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{getMemberName(task.assigneeId)}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                          Score {score}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="border-t border-slate-200/70 px-4 py-4 align-top text-sm text-slate-600">
                    <div className="min-w-[180px]">
                      <p>{getProjectName(task.projectId)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {getProjectDepartmentName(task.projectId)}
                      </p>
                    </div>
                  </td>
                  <td className="border-t border-slate-200/70 px-4 py-4 align-top">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      {statusLabels[task.status]}
                    </span>
                  </td>
                  <td className="border-t border-slate-200/70 px-4 py-4 align-top">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        task.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : task.priority === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700",
                      )}
                    >
                      {priorityLabels[task.priority]}
                    </span>
                  </td>
                  <td className="border-t border-slate-200/70 px-4 py-4 align-top">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        task.risk === "high"
                          ? "bg-red-100 text-red-700"
                          : task.risk === "medium"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-emerald-100 text-emerald-700",
                      )}
                    >
                      {riskLabels[task.risk]}
                    </span>
                  </td>
                  <td className="border-t border-slate-200/70 px-5 py-4 align-top">
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        {formatShortDate(task.dueDate)}
                      </span>
                      {overdue ? (
                        <span className="inline-flex w-fit rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                          En retard
                        </span>
                      ) : task.dueDate === today && !isTaskComplete(task) ? (
                        <span className="inline-flex w-fit rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                          Aujourd&apos;hui
                        </span>
                      ) : null}
                    </div>
                  </td>
                  {onEdit || onDelete ? (
                    <td className="border-t border-slate-200/70 px-5 py-4 align-top">
                      <div className="flex justify-end gap-2">
                        {onEdit ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(task)}
                          >
                            Modifier
                          </Button>
                        ) : null}
                        {onDelete ? (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => onDelete(task.id)}
                          >
                            Supprimer
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {tasks.length === 0 ? (
        <div className="border-t border-slate-200/70 px-5 py-10 text-center">
          <p className="text-sm font-medium text-slate-700">
            Aucune tache ne correspond au filtre courant.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Ajuste les filtres pour elargir la vue.
          </p>
        </div>
      ) : null}
    </div>
  );
}
