"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDashed,
  Clock3,
  ShieldX,
} from "lucide-react";
import AlertCard from "@/components/dashboard/AlertCard";
import KPI from "@/components/dashboard/KPI";
import ReportGenerator from "@/components/dashboard/ReportGenerator";
import Layout from "@/components/layout/Layout";
import { useMemberDirectory, useProjectDirectory, useProjects, useTasks } from "@/lib/store";
import {
  formatShortDate,
  getProjectProgressTone,
  getTaskPriorityScore,
  getTodayIsoDate,
  isTaskBlocked,
  isTaskComplete,
  isTaskOverdue,
  priorityLabels,
  projectStatusLabels,
  riskLabels,
  statusLabels,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { getProjectName } = useProjectDirectory();
  const { getMemberName } = useMemberDirectory();
  const today = getTodayIsoDate();

  const overdueTasks = tasks.filter((task) => isTaskOverdue(task, today));
  const blockedTasks = tasks.filter((task) => isTaskBlocked(task));
  const tasksDueToday = tasks.filter(
    (task) => task.dueDate === today && !isTaskComplete(task),
  );
  const activeProjects = projects.filter((project) => project.status === "active");
  const criticalTasks = tasks.filter(
    (task) => task.priority === "high" && isTaskOverdue(task, today),
  );

  const prioritizedTasks = [...tasks]
    .sort(
      (left, right) =>
        getTaskPriorityScore(right, today) - getTaskPriorityScore(left, today),
    )
    .slice(0, 5);

  const portfolioProjects = [...projects].sort((left, right) => {
    if (left.status === right.status) {
      return right.progress - left.progress;
    }

    if (left.status === "active") {
      return -1;
    }

    if (right.status === "active") {
      return 1;
    }

    return left.status === "completed" ? 1 : -1;
  });

  const completedTasks = tasks.filter((task) => isTaskComplete(task)).length;
  const completionRate = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;
  const highPriorityTasks = tasks.filter((task) => task.priority === "high");

  return (
    <Layout
      title="Tableau de bord"
      eyebrow="Vue d'ensemble"
      actions={<ReportGenerator />}
    >
      <div className="space-y-6 lg:space-y-7">
        <section className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Pilotage
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <KPI
              title="Tâches terminées"
              value={completedTasks}
              icon={CheckCircle2}
              iconTone="violet"
              trend={completionRate}
              trendLabel="complétion"
            />
            <KPI
              title="Tâches en retard"
              value={overdueTasks.length}
              icon={Clock3}
              iconTone="amber"
              trend={-8.4}
              trendLabel="urgence"
            />
            <KPI
              title="Tâches bloquées"
              value={blockedTasks.length}
              icon={ShieldX}
              iconTone="red"
              trend={-2.1}
              trendLabel="attention"
            />
            <KPI
              title="Haute priorité"
              value={highPriorityTasks.length}
              icon={ArrowRight}
              iconTone="indigo"
              trend={-1.3}
              trendLabel="focus"
            />
            <KPI
              title="Projets actifs"
              value={activeProjects.length}
              icon={BriefcaseBusiness}
              iconTone="sky"
              trend={0}
              trendLabel="stable"
            />
            <KPI
              title="A traiter aujourd'hui"
              value={tasksDueToday.length}
              icon={Clock3}
              iconTone="amber"
              trend={2.8}
              trendLabel="cadence"
            />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          {criticalTasks.length > 0 ? (
            <AlertCard
              title={`${criticalTasks.length} taches critiques en retard`}
              description="Priorite haute detectee. Reallocation et arbitrage requis a court terme."
              type="error"
            />
          ) : (
            <AlertCard
              title="Aucune tache critique en retard"
              description="Le portefeuille reste sous controle sur les sujets a forte priorite."
              type="info"
            />
          )}
          {blockedTasks.length > 0 ? (
            <AlertCard
              title={`${blockedTasks.length} taches bloquees en cours`}
              description="Des dependances externes ralentissent l'execution sur les streams sensibles."
              type="warning"
            />
          ) : (
            <AlertCard
              title="Aucun blocage majeur"
              description="Les equipes gardent une cadence reguliere sur les items en cours."
              type="info"
            />
          )}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="surface-card overflow-hidden rounded-[30px] border border-white/60">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4">
              <div>
                <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                  Tâches prioritaires
                </p>
                <p className="text-sm text-slate-500">
                  Classement dynamique par risque, priorite et échéance.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {tasksDueToday.length} a traiter aujourd&apos;hui
              </div>
            </div>

            <div className="divide-y divide-slate-200/70">
              {prioritizedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-start"
                >
                  <div
                    className={cn(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2",
                      isTaskComplete(task)
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 bg-white text-transparent",
                    )}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={cn(
                          "text-sm font-semibold tracking-[-0.02em] text-slate-950",
                          isTaskComplete(task) && "text-slate-400 line-through",
                        )}
                      >
                        {task.title}
                      </p>
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
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {getProjectName(task.projectId)}
                      {task.assigneeId ? ` · ${getMemberName(task.assigneeId)}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {statusLabels[task.status]}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      Risque {riskLabels[task.risk].toLowerCase()}
                    </span>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                      Ech. {formatShortDate(task.dueDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="surface-card overflow-hidden rounded-[30px] border border-white/60">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4">
              <div>
                <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                  Portefeuille projets
                </p>
                <p className="text-sm text-slate-500">
                  Avancement des streams actifs et niveau de charge.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {activeProjects.length} actifs
              </div>
            </div>

            <div className="divide-y divide-slate-200/70">
              {portfolioProjects.map((project) => (
                <div key={project.id} className="flex items-center gap-4 px-5 py-4">
                  <div
                    className={cn(
                      "h-3 w-3 shrink-0 rounded-full",
                      getProjectProgressTone(project.status),
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold tracking-[-0.02em] text-slate-950">
                        {project.name}
                      </p>
                      <span className="text-xs font-semibold text-slate-500">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/80">
                      <div
                        className={cn("h-full rounded-full", getProjectProgressTone(project.status))}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-xs font-semibold text-slate-600">
                      {projectStatusLabels[project.status]}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {project.numberOfTasks} taches
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 border-t border-slate-200/70 bg-slate-50/70 px-5 py-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/80 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Livraison
                </p>
                <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                  {completionRate}%
                </p>
                <p className="text-sm text-slate-500">Tâches completées</p>
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Aujourdhui
                </p>
                <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                  {tasksDueToday.length}
                </p>
                <p className="text-sm text-slate-500">Items à traiter</p>
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Flux
                </p>
                <p className="mt-2 flex items-center gap-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                  <CircleDashed className="h-5 w-5 text-indigo-500" />
                  Cadence stable
                </p>
                <p className="text-sm text-slate-500">Aucun incident majeur</p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </Layout>
  );
}
