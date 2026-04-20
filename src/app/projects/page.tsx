'use client';

import { useState } from 'react';
import { BriefcaseBusiness, Gauge, Layers3, PauseCircle } from 'lucide-react';
import KPI from '@/components/dashboard/KPI';
import ProjectForm from '@/components/forms/ProjectForm';
import Layout from '@/components/layout/Layout';
import ProjectCard from '@/components/projects/ProjectCard';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { type Project } from '@/data/mockProjects';
import { useProjects, useTasks, useWorkspacePreferences } from '@/lib/store';
import {
  getProjectProgressTone,
  getTodayIsoDate,
  isTaskBlocked,
  isTaskOverdue,
  projectStatusLabels,
} from '@/lib/utils';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'active' | 'on_hold' | 'completed';

const filterLabels: Record<Filter, string> = {
  all: 'Tous',
  active: 'Actifs',
  on_hold: 'En pause',
  completed: 'Termines',
};

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const { projects, dispatch: projectDispatch } = useProjects();
  const { tasks, dispatch: taskDispatch } = useTasks();
  const { preferences } = useWorkspacePreferences();
  const today = getTodayIsoDate();

  const portfolio = projects.map((project) => {
    const relatedTasks = tasks.filter((task) => task.project === project.name);
    const blockedTasks = relatedTasks.filter((task) => isTaskBlocked(task)).length;
    const overdueTasks = relatedTasks.filter((task) => isTaskOverdue(task, today)).length;
    const openTasks = relatedTasks.filter((task) => task.status !== 'done').length;

    return {
      project,
      blockedTasks,
      overdueTasks,
      openTasks,
    };
  });

  const filteredPortfolio = portfolio
    .filter(({ project }) => (filter === 'all' ? true : project.status === filter))
    .sort((left, right) => {
      if (left.project.status === right.project.status) {
        return right.project.progress - left.project.progress;
      }
      if (left.project.status === 'active') return -1;
      if (right.project.status === 'active') return 1;
      return left.project.status === 'completed' ? 1 : -1;
    });

  const activeProjects = projects.filter((project) => project.status === 'active').length;
  const pausedProjects = projects.filter((project) => project.status === 'on_hold').length;
  const averageProgress = Math.round(
    projects.reduce((sum, project) => sum + project.progress, 0) / projects.length,
  );
  const stressedProjects = portfolio.filter(
    ({ blockedTasks, overdueTasks, project }) =>
      project.status !== 'completed' && (blockedTasks > 0 || overdueTasks > 0),
  ).length;

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const targetProject = projects.find((project) => project.id === id);
    if (!targetProject) return;

    if (confirm('Voulez-vous vraiment supprimer ce projet ?')) {
      projectDispatch({ type: 'DELETE_PROJECT', payload: id });
      tasks
        .filter((task) => task.project === targetProject.name)
        .forEach((task) => {
          taskDispatch({ type: 'DELETE_TASK', payload: task.id });
        });
    }
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleProjectSuccess = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const atRiskPortfolio = portfolio
    .filter(({ blockedTasks, overdueTasks, project }) =>
      project.status !== 'completed' && (blockedTasks > 0 || overdueTasks > 0),
    )
    .slice(0, 4);

  return (
    <Layout
      title="Projets"
      eyebrow="Portefeuille"
      description="Lecture portefeuille des streams actifs, du niveau de progression et des points de tension."
      actions={
        <Button onClick={handleAddProject} className="rounded-full">
          Ajouter un projet
        </Button>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KPI
            title="Portefeuille total"
            value={projects.length}
            icon={BriefcaseBusiness}
            iconTone="sky"
            trend={0}
            trendLabel="stable"
          />
          <KPI
            title="Projets actifs"
            value={activeProjects}
            icon={Layers3}
            iconTone="indigo"
            trend={2.3}
            trendLabel="capacite"
          />
          <KPI
            title="Progression moyenne"
            value={`${averageProgress}%`}
            icon={Gauge}
            iconTone="emerald"
            trend={3.8}
            trendLabel="livraison"
          />
          <KPI
            title="Streams a surveiller"
            value={stressedProjects}
            icon={PauseCircle}
            iconTone="amber"
            trend={-1.2}
            trendLabel="risque"
          />
        </section>

        <section className="surface-card rounded-[30px] border border-white/60 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                Filtres portefeuille
              </p>
              <p className="text-sm text-slate-500">
                Segmentation rapide par statut de livraison.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(filterLabels) as Filter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    filter === option
                      ? 'bg-indigo-600 text-white shadow-[0_12px_28px_rgba(79,70,229,0.22)]'
                      : 'border border-slate-200/80 bg-white/80 text-slate-600 hover:bg-slate-50',
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
            'grid gap-6',
            preferences.showInsights
              ? 'xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]'
              : 'grid-cols-1',
          )}
        >
          <div className="grid gap-5 md:grid-cols-2">
            {filteredPortfolio.map(({ project, openTasks, blockedTasks, overdueTasks }) => (
              <ProjectCard
                key={project.id}
                project={project}
                openTasks={openTasks}
                blockedTasks={blockedTasks}
                overdueTasks={overdueTasks}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {preferences.showInsights ? (
            <div className="space-y-6">
            <article className="surface-card rounded-[30px] border border-white/60 p-5">
              <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                Focus portefeuille
              </p>
              <p className="text-sm text-slate-500">
                Projets qui demandent un arbitrage ou une attention immediate.
              </p>

              <div className="mt-5 space-y-3">
                {atRiskPortfolio.length === 0 ? (
                  <div className="rounded-[22px] border border-slate-200/70 bg-white/70 p-4">
                    <p className="text-sm font-medium text-slate-700">
                      Aucun projet sous tension pour le moment.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Le portefeuille est stable sur les statuts actifs.
                    </p>
                  </div>
                ) : (
                  atRiskPortfolio.map(({ project, blockedTasks, overdueTasks, openTasks }) => (
                    <div
                      key={project.id}
                      className="rounded-[22px] border border-slate-200/70 bg-white/70 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold tracking-[-0.02em] text-slate-950">
                            {project.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {projectStatusLabels[project.status]} · {openTasks} taches ouvertes
                          </p>
                        </div>
                        <span
                          className={cn(
                            'h-3 w-3 shrink-0 rounded-full',
                            getProjectProgressTone(project.status),
                          )}
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {blockedTasks > 0 ? (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-700">
                            {blockedTasks} bloquees
                          </span>
                        ) : null}
                        {overdueTasks > 0 ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
                            {overdueTasks} en retard
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="surface-card rounded-[30px] border border-white/60 p-5">
              <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                Repartition
              </p>
              <p className="text-sm text-slate-500">
                Equilibre actuel entre production, pause et livraison.
              </p>

              <div className="mt-5 space-y-4">
                {[
                  { label: 'Actifs', value: activeProjects, tone: 'bg-indigo-500' },
                  { label: 'En pause', value: pausedProjects, tone: 'bg-amber-500' },
                  {
                    label: 'Termines',
                    value: projects.filter((project) => project.status === 'completed').length,
                    tone: 'bg-emerald-500',
                  },
                ].map((item) => {
                  const width = projects.length
                    ? Math.max((item.value / projects.length) * 100, item.value ? 10 : 0)
                    : 0;

                  return (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-600">{item.label}</span>
                        <span className="font-semibold text-slate-950">{item.value}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/70">
                        <div className={cn('h-full rounded-full', item.tone)} style={{ width: `${width}%` }} />
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
          title={editingProject ? 'Modifier le projet' : 'Ajouter un projet'}
        >
          <ProjectForm
            project={editingProject}
            onClose={handleCloseModal}
            onSuccess={handleProjectSuccess}
          />
        </Modal>
      </div>
    </Layout>
  );
}
