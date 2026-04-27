"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDashed,
  Clock3,
} from "lucide-react";
import AlertCard from "@/components/dashboard/AlertCard";
import KPI from "@/components/dashboard/KPI";
import ReportGenerator from "@/components/dashboard/ReportGenerator";
import Layout from "@/components/layout/Layout";
import {
  useCurrentMember,
  useMemberDirectory,
  usePermissions,
  useProjectDirectory,
  useProjects,
  useTasks,
} from "@/lib/store";
import {
  cn,
  formatShortDate,
  getProjectProgressTone,
  getTaskPriorityScore,
  getTodayIsoDate,
  isTaskComplete,
  isTaskOverdue,
  priorityLabels,
  projectStatusLabels,
  riskLabels,
  statusLabels,
} from "@/lib/utils";

function sortProjectsByStatus(projects: ReturnType<typeof useProjects>["projects"]) {
  return [...projects].sort((left, right) => {
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
}

export default function DashboardPage() {
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { currentMember, currentRoleLabel } = useCurrentMember();
  const { canViewExecutiveDashboard } = usePermissions();
  const { getProjectName } = useProjectDirectory();
  const { getMemberName } = useMemberDirectory();
  const today = getTodayIsoDate();

  const assignedTasks = currentMember
    ? tasks.filter((task) => task.assigneeId === currentMember.id)
    : [];
  const visibleTasks = canViewExecutiveDashboard ? tasks : assignedTasks;
  const visibleProjectIds = new Set(visibleTasks.map((task) => task.projectId));
  const visibleProjects = canViewExecutiveDashboard
    ? projects
    : projects.filter((project) => visibleProjectIds.has(project.id));
  const overdueTasks = visibleTasks.filter((task) => isTaskOverdue(task, today));
  const tasksDueToday = visibleTasks.filter(
    (task) => task.dueDate === today && !isTaskComplete(task),
  );
  const activeProjects = visibleProjects.filter((project) => project.status === "active");
  const criticalTasks = visibleTasks.filter(
    (task) => task.priority === "high" && isTaskOverdue(task, today),
  );
  const testedTasks = visibleTasks.filter(
    (task) => task.status === "tested" || task.status === "deployed",
  );
  const prioritizedTasks = [...visibleTasks]
    .sort(
      (left, right) =>
        getTaskPriorityScore(right, today) - getTaskPriorityScore(left, today),
    )
    .slice(0, 5);
  const portfolioProjects = sortProjectsByStatus(visibleProjects);
  const completedTasks = visibleTasks.filter((task) => isTaskComplete(task)).length;
  const completionRate = visibleTasks.length
    ? Math.round((completedTasks / visibleTasks.length) * 100)
    : 0;
  const highPriorityTasks = visibleTasks.filter((task) => task.priority === "high");

  return (
    <Layout
      title="Tableau de bord"
      eyebrow={canViewExecutiveDashboard ? "Vue d'ensemble" : "Suivi personnel"}
      description={
        canViewExecutiveDashboard
          ? "Pilotage global des operations, alertes et execution des equipes."
          : `Vue limitee pour ${currentRoleLabel?.toLowerCase() ?? "le collaborateur"} avec suivi personnel des taches et validations.`
      }
      actions={canViewExecutiveDashboard ? <ReportGenerator /> : null}
    >
      <div className="space-y-6 lg:space-y-7">
        {!canViewExecutiveDashboard ? (
          <section className="surface-card rounded-[30px] border border-white/60 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                  Espace restreint
                </p>
                <p className="text-sm text-slate-500">
                  Les KPI portefeuille, l&apos;export de rapports et les vues globales restent
                  reserves aux owners et managers.
                </p>
              </div>
              {currentMember ? (
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Profil {currentMember.name}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {canViewExecutiveDashboard ? "Pilotage" : "Priorites"}
          </p>
          <div
            className={cn(
              "grid gap-4 md:grid-cols-2",
              canViewExecutiveDashboard ? "xl:grid-cols-5" : "xl:grid-cols-4",
            )}
          >
            <KPI
              title={canViewExecutiveDashboard ? "Taches terminees" : "Mes taches"}
              value={completedTasks}
              icon={CheckCircle2}
              iconTone="violet"
              trend={completionRate}
              trendLabel="completion"
            />
            <KPI
              title="Taches en retard"
              value={overdueTasks.length}
              icon={Clock3}
              iconTone="amber"
              trend={-8.4}
              trendLabel="urgence"
            />
            <KPI
              title="Haute priorite"
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
            {canViewExecutiveDashboard ? (
              <KPI
                title="A traiter aujourd'hui"
                value={tasksDueToday.length}
                icon={Clock3}
                iconTone="amber"
                trend={2.8}
                trendLabel="cadence"
              />
            ) : (
              <KPI
                title="Validees / livrees"
                value={testedTasks.length}
                icon={CircleDashed}
                iconTone="sky"
                trend={0}
                trendLabel="tests"
              />
            )}
          </div>
        </section>

        <section>
          {criticalTasks.length > 0 ? (
            <AlertCard
              title={`${criticalTasks.length} taches critiques en retard`}
              description={
                canViewExecutiveDashboard
                  ? "Priorite haute detectee. Reallocation et arbitrage requis a court terme."
                  : "Priorite haute detectee sur votre perimetre. Une reprise rapide est recommandee."
              }
              type="error"
            />
          ) : (
            <AlertCard
              title="Aucune tache critique en retard"
              description={
                canViewExecutiveDashboard
                  ? "Le portefeuille reste sous controle sur les sujets a forte priorite."
                  : "Votre perimetre reste stable sur les sujets a forte priorite."
              }
              type="info"
            />
          )}
        </section>

        <section
          className={cn(
            "grid gap-6",
            canViewExecutiveDashboard ? "xl:grid-cols-[1.15fr_0.85fr]" : "xl:grid-cols-2",
          )}
        >
          <article className="surface-card overflow-hidden rounded-[30px] border border-white/60">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4">
              <div>
                <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                  {canViewExecutiveDashboard ? "Taches prioritaires" : "Mes taches prioritaires"}
                </p>
                <p className="text-sm text-slate-500">
                  {canViewExecutiveDashboard
                    ? "Classement dynamique par risque, priorite et echeance."
                    : "Classement base sur les echeances, les risques et les validations attendues."}
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {tasksDueToday.length} a traiter aujourd&apos;hui
              </div>
            </div>

            {prioritizedTasks.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium text-slate-700">
                  Aucune tache visible pour le profil actif.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Les nouvelles affectations apparaitront ici automatiquement.
                </p>
              </div>
            ) : (
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
                        {task.assigneeId ? ` - ${getMemberName(task.assigneeId)}` : ""}
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
            )}
          </article>

          <article className="surface-card overflow-hidden rounded-[30px] border border-white/60">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4">
              <div>
                <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                  {canViewExecutiveDashboard ? "Portefeuille projets" : "Mes projets"}
                </p>
                <p className="text-sm text-slate-500">
                  {canViewExecutiveDashboard
                    ? "Avancement des streams actifs et niveau de charge."
                    : "Perimetre directement relie aux taches qui vous sont affectees."}
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {activeProjects.length} actifs
              </div>
            </div>

            {portfolioProjects.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium text-slate-700">
                  Aucun projet lie au profil actif.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  La progression projet apparaitra ici des qu&apos;une tache sera rattachee.
                </p>
              </div>
            ) : (
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
            )}

            <div className="grid gap-3 border-t border-slate-200/70 bg-slate-50/70 px-5 py-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/80 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Livraison
                </p>
                <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                  {completionRate}%
                </p>
                <p className="text-sm text-slate-500">Taches completees</p>
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Aujourd&apos;hui
                </p>
                <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                  {tasksDueToday.length}
                </p>
                <p className="text-sm text-slate-500">Items a traiter</p>
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Flux
                </p>
                <p className="mt-2 flex items-center gap-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                  <CircleDashed className="h-5 w-5 text-indigo-500" />
                  {canViewExecutiveDashboard ? "Cadence stable" : "Suivi limite"}
                </p>
                <p className="text-sm text-slate-500">
                  {canViewExecutiveDashboard
                    ? "Aucun incident majeur"
                    : "Vue recentree sur le delivery personnel"}
                </p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </Layout>
  );
}
