"use client";

import { useState } from "react";
import { AlertTriangle, Flame, ListTodo, Plus, TimerReset } from "lucide-react";
import KPI from "@/components/dashboard/KPI";
import TaskForm from "@/components/forms/TaskForm";
import Layout from "@/components/layout/Layout";
import TaskTable from "@/components/tasks/TaskTable";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Task } from "@/data/mockTasks";
import { useTasks, useWorkspacePreferences } from "@/lib/store";
import {
  formatShortDate,
  getTaskPriorityScore,
  getTodayIsoDate,
  isTaskBlocked,
  isTaskOverdue,
  priorityLabels,
  statusLabels,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

type Filter = "all" | "overdue" | "today" | "high_priority" | "blocked";

const filterLabels: Record<Filter, string> = {
  all: "Toutes",
  overdue: "En retard",
  today: "Aujourd'hui",
  high_priority: "Haute priorite",
  blocked: "Bloquees",
};

export default function TasksPage() {
  const { tasks, dispatch } = useTasks();
  const { preferences } = useWorkspacePreferences();
  const [filter, setFilter] = useState<Filter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const today = getTodayIsoDate();

  const overdueTasks = tasks.filter((task) => isTaskOverdue(task, today));
  const todayTasks = tasks.filter(
    (task) => task.dueDate === today && task.status !== "done",
  );
  const highPriorityTasks = tasks.filter((task) => task.priority === "high");
  const blockedTasks = tasks.filter((task) => isTaskBlocked(task));

  const filteredTasks = [...tasks]
    .filter((task) => {
      switch (filter) {
        case "overdue":
          return isTaskOverdue(task, today);
        case "today":
          return task.dueDate === today && task.status !== "done";
        case "high_priority":
          return task.priority === "high";
        case "blocked":
          return isTaskBlocked(task);
        default:
          return true;
      }
    })
    .sort(
      (left, right) =>
        getTaskPriorityScore(right, today) - getTaskPriorityScore(left, today),
    );

  const focusTasks = [...tasks]
    .filter((task) => task.priority === "high" || isTaskOverdue(task, today))
    .sort(
      (left, right) =>
        getTaskPriorityScore(right, today) - getTaskPriorityScore(left, today),
    )
    .slice(0, 4);

  const completionRate = Math.round(
    (tasks.filter((task) => task.status === "done").length / tasks.length) * 100,
  );

  const handleAddTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer cette tache ?")) {
      dispatch({ type: "DELETE_TASK", payload: id });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleTaskSuccess = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  return (
    <Layout
      title="Taches"
      eyebrow="Execution"
      description="Pilotage des echeances, des risques et des priorites d'execution."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-slate-200/80 bg-white/85 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
            {filteredTasks.length} taches visibles
          </div>
          <Button type="button" onClick={handleAddTask}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nouvelle tache
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KPI
            title="Volume total"
            value={tasks.length}
            icon={ListTodo}
            iconTone="sky"
            trend={0}
            trendLabel="stable"
          />
          <KPI
            title="En retard"
            value={overdueTasks.length}
            icon={TimerReset}
            iconTone="amber"
            trend={-4.2}
            trendLabel="a traiter"
          />
          <KPI
            title="Aujourd'hui"
            value={todayTasks.length}
            icon={Flame}
            iconTone="indigo"
            trend={1.8}
            trendLabel="focus"
          />
          <KPI
            title="Bloquees"
            value={blockedTasks.length}
            icon={AlertTriangle}
            iconTone="red"
            trend={-1.4}
            trendLabel="surveillance"
          />
        </section>

        <section className="surface-card rounded-[30px] border border-white/60 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                Filtres d&apos;execution
              </p>
              <p className="text-sm text-slate-500">
                Vue frontend uniquement, branchee sur le store mock.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(filterLabels) as Filter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    filter === option
                      ? "bg-indigo-600 text-white shadow-[0_12px_28px_rgba(79,70,229,0.22)]"
                      : "border border-slate-200/80 bg-white/80 text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {filterLabels[option]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section
          className={cn(
            "grid gap-6",
            preferences.showInsights
              ? "xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]"
              : "grid-cols-1",
          )}
        >
          <article className="surface-card overflow-hidden rounded-[30px] border border-white/60">
            <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                  Vue tabulaire
                </p>
                <p className="text-sm text-slate-500">
                  Tri automatique par score de priorite et risque.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Filtre actif: {filterLabels[filter]}
              </div>
            </div>
            <TaskTable
              tasks={filteredTasks}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          </article>

          {preferences.showInsights ? (
            <div className="space-y-6">
            <article className="surface-card rounded-[30px] border border-white/60 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                    Radar execution
                  </p>
                  <p className="text-sm text-slate-500">
                    Priorites les plus sensibles du sprint.
                  </p>
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {completionRate}% complete
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {focusTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-[22px] border border-slate-200/70 bg-white/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                          {task.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {task.project}
                          {task.assignee ? ` · ${task.assignee}` : ""}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                          task.priority === "high"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {priorityLabels[task.priority]}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                        {statusLabels[task.status]}
                      </span>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700">
                        Ech. {formatShortDate(task.dueDate)}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTask(task)}
                        className="ml-auto"
                      >
                        Modifier
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="surface-card rounded-[30px] border border-white/60 p-5">
              <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                Distribution
              </p>
              <p className="text-sm text-slate-500">
                Lecture rapide de la charge ouverte.
              </p>

              <div className="mt-5 space-y-4">
                {[
                  {
                    label: "Haute priorite",
                    value: highPriorityTasks.length,
                    tone: "bg-red-500",
                  },
                  {
                    label: "En retard",
                    value: overdueTasks.length,
                    tone: "bg-amber-500",
                  },
                  {
                    label: "Aujourd'hui",
                    value: todayTasks.length,
                    tone: "bg-indigo-500",
                  },
                  {
                    label: "Bloquees",
                    value: blockedTasks.length,
                    tone: "bg-slate-900",
                  },
                ].map((item) => {
                  const width = tasks.length
                    ? Math.max((item.value / tasks.length) * 100, 8)
                    : 0;

                  return (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-600">{item.label}</span>
                        <span className="font-semibold text-slate-950">{item.value}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/70">
                        <div
                          className={cn("h-full rounded-full", item.tone)}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
            </div>
          ) : null}
        </section>

        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingTask ? "Modifier la tache" : "Ajouter une tache"}
        >
          <TaskForm
            task={editingTask}
            onClose={handleCloseModal}
            onSuccess={handleTaskSuccess}
          />
        </Modal>
      </div>
    </Layout>
  );
}
