'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Project } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { useProjectDirectory } from '@/lib/store';
import { cn, getProjectProgressTone, projectStatusLabels } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  openTasks: number;
  overdueTasks: number;
  onEdit?: (project: Project) => void;
  onDelete?: (id: string) => void;
}

export default function ProjectCard({
  project,
  openTasks,
  overdueTasks,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const { getDepartmentName } = useProjectDirectory();
  const progressTone = getProjectProgressTone(project.status);
  const statusClasses =
    project.status === 'active'
      ? 'bg-emerald-50 text-emerald-700'
      : project.status === 'completed'
        ? 'bg-sky-50 text-sky-700'
        : 'bg-amber-50 text-amber-700';

  const projectHealth =
    project.status === 'completed'
      ? { label: 'Livre', tone: 'text-emerald-600' }
      : overdueTasks > 0
        ? { label: 'Sous tension', tone: 'text-red-600' }
        : { label: 'Cadence stable', tone: 'text-slate-600' };

  return (
    <article className="surface-card rounded-[30px] border border-white/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <span className={cn('h-3 w-3 rounded-full', progressTone)} />
            <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', statusClasses)}>
              {projectStatusLabels[project.status]}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {getDepartmentName(project.departmentId)}
            </span>
          </div>
          <h3 className="truncate text-lg font-semibold tracking-[-0.03em] text-slate-950">
            {project.name}
          </h3>
          <p className={cn('mt-1 text-sm font-medium', projectHealth.tone)}>
            {projectHealth.label}
          </p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-400">
          <MoreHorizontal className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-500">Progression</span>
          <span className="font-semibold text-slate-900">{project.progress}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80">
          <div className={cn('h-full rounded-full', progressTone)} style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[20px] bg-white/75 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Ouvertes
          </p>
          <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">{openTasks}</p>
        </div>
        <div className="rounded-[20px] bg-white/75 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            En retard
          </p>
          <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">{overdueTasks}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-200/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {project.numberOfTasks} tâches planifiées
        </p>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {onEdit ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(project)}
              className="rounded-full"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Modifier
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(project.id)}
              className="rounded-full"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Supprimer
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
