'use client';

import { useState, type FormEvent } from 'react';
import type { Task } from '@/lib/types';
import {
  useBackendStatus,
  useDepartments,
  useMembers,
  useProjects,
  useTasks,
} from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SelectField } from '@/components/ui/Select';

interface TaskFormProps {
  task?: Task | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TaskForm({ task, onClose, onSuccess }: TaskFormProps) {
  const { saveTask } = useTasks();
  const { saveProject } = useProjects();
  const backendStatus = useBackendStatus();
  const { departments } = useDepartments();
  const { members } = useMembers();
  const { projects } = useProjects();
  const otherProjectValue = '__other__';

  const [formData, setFormData] = useState({
    title: task?.title || '',
    departmentId: '',
    projectId: task?.projectId || '',
    newProjectName: '',
    assigneeId: task?.assigneeId || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    risk: task?.risk || 'medium',
    dueDate: task?.dueDate || '',
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const taskProject = task ? projects.find((project) => project.id === task.projectId) : null;
  const effectiveDepartmentId = formData.departmentId || taskProject?.departmentId || '';
  const filteredProjects = projects.filter((project) =>
    effectiveDepartmentId ? project.departmentId === effectiveDepartmentId : true,
  );
  const effectiveProjectId =
    formData.projectId === otherProjectValue
      ? otherProjectValue
      : formData.projectId && filteredProjects.some((project) => project.id === formData.projectId)
        ? formData.projectId
        : task?.projectId && filteredProjects.some((project) => project.id === task.projectId)
          ? task.projectId
          : filteredProjects.length === 1
            ? filteredProjects[0].id
            : '';
  const projectOptions = [
    ...filteredProjects.map((project) => ({
      value: project.id,
      label: project.name,
    })),
    { value: otherProjectValue, label: 'Autre' },
  ];
  const selectableMembers =
    backendStatus.configured && backendStatus.mode !== 'supabase' ? [] : members;
  const memberOptions = selectableMembers
    .filter((member) =>
      effectiveDepartmentId ? member.departmentId === effectiveDepartmentId : true,
    )
    .map((member) => ({
      value: member.id,
      label: member.name,
    }));

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.title.trim()) nextErrors.title = 'Titre requis';
    if (!effectiveDepartmentId) nextErrors.departmentId = 'Departement requis';
    if (!effectiveProjectId) {
      nextErrors.project = 'Projet requis';
    }
    if (effectiveProjectId === otherProjectValue && !formData.newProjectName.trim()) {
      nextErrors.newProjectName = 'Nom du projet requis';
    }
    if (formData.dueDate && new Date(formData.dueDate) <= today) {
      nextErrors.dueDate = 'Date limite dans le passe';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitError(null);

    let projectId = effectiveProjectId;

    if (effectiveProjectId === otherProjectValue) {
      try {
        const persistedProject = await saveProject({
          id: '',
          name: formData.newProjectName.trim(),
          departmentId: effectiveDepartmentId,
          status: 'active',
          progress: 0,
          numberOfTasks: 0,
        });

        projectId = persistedProject.id;
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Echec d'enregistrement du projet.",
        );
        return;
      }
    }

    const id = task?.id || '';
    const newTask: Task = {
      id,
      title: formData.title,
      projectId,
      assigneeId: formData.assigneeId || undefined,
      status: formData.status,
      priority: formData.priority,
      risk: formData.risk,
      dueDate: formData.dueDate,
    };

    try {
      await saveTask(newTask);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Echec d'enregistrement de la tache.");
      return;
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Titre</label>
        <Input
          value={formData.title}
          onChange={(event) => setFormData({ ...formData, title: event.target.value })}
          className="w-full"
          placeholder="Entrez le titre de la tache"
        />
        {errors.title ? <p className="mt-1 text-sm text-red-600">{errors.title}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Departement</label>
        <SelectField
          options={departments.map((department) => ({
            value: department.id,
            label: department.name,
          }))}
          value={effectiveDepartmentId}
          onChange={(value) =>
            setFormData((current) => ({
              ...current,
              departmentId: value,
              projectId: projects.some(
                (project) =>
                  project.id === effectiveProjectId && project.departmentId === value,
              )
                ? effectiveProjectId
                : '',
              newProjectName:
                projects.some(
                  (project) =>
                    project.id === effectiveProjectId && project.departmentId === value,
                ) || effectiveProjectId === otherProjectValue
                  ? current.newProjectName
                  : '',
            }))
          }
          placeholder="Selectionnez un departement"
        />
        {departments.length === 0 ? (
          <p className="mt-1 text-xs text-slate-500">
            {backendStatus.loading
              ? 'Chargement des departements...'
              : backendStatus.error
                ? `Departements indisponibles. ${backendStatus.error}`
                : 'Aucun departement disponible dans le workspace actif.'}
          </p>
        ) : null}
        {errors.departmentId ? (
          <p className="mt-1 text-sm text-red-600">{errors.departmentId}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Projet</label>
        <SelectField
          options={projectOptions}
          value={effectiveProjectId}
          onChange={(value) => setFormData({ ...formData, projectId: value })}
          placeholder="Selectionnez un projet"
        />
        <p className="mt-1 text-xs text-slate-500">
          {!effectiveDepartmentId
            ? "Selectionnez d'abord un departement."
            : filteredProjects.length === 0
              ? "Aucun projet dans ce departement. Choisissez 'Autre' pour en creer un."
              : filteredProjects.length === 1
                ? 'Le projet deja cree pour ce departement a ete selectionne automatiquement.'
              : `${filteredProjects.length} projet(s) disponible(s) dans ce departement.`}
        </p>
        {errors.project ? <p className="mt-1 text-sm text-red-600">{errors.project}</p> : null}
      </div>

      {effectiveProjectId === otherProjectValue ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nom du nouveau projet
          </label>
          <Input
            value={formData.newProjectName}
            onChange={(event) =>
              setFormData({ ...formData, newProjectName: event.target.value })
            }
            className="w-full"
            placeholder="Entrez le nom du projet"
          />
          {errors.newProjectName ? (
            <p className="mt-1 text-sm text-red-600">{errors.newProjectName}</p>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Assigne a</label>
          <SelectField
            options={memberOptions}
            value={formData.assigneeId}
            onChange={(value) => setFormData({ ...formData, assigneeId: value })}
            placeholder="Selectionnez un collaborateur"
          />
          <p className="mt-1 text-xs text-slate-500">
            {backendStatus.mode === 'supabase'
              ? memberOptions.length > 0
                ? 'Collaborateurs charges depuis le workspace Supabase.'
                : effectiveDepartmentId
                  ? 'Aucun collaborateur rattache a ce departement.'
                  : 'Selectionnez un departement pour filtrer les collaborateurs.'
              : backendStatus.configured
                ? 'Connexion Supabase requise pour charger les collaborateurs reels.'
                : "Supabase n'est pas configure."}
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Statut</label>
          <SelectField
            options={[
              { value: 'todo', label: 'A faire' },
              { value: 'in_progress', label: 'En cours' },
              { value: 'done', label: 'Termine' },
              { value: 'tested', label: 'Teste' },
              { value: 'deployed', label: 'Deploye' },
            ]}
            value={formData.status}
            onChange={(value) =>
              setFormData({ ...formData, status: value as Task['status'] })
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Priorite</label>
          <SelectField
            options={[
              { value: 'low', label: 'Basse' },
              { value: 'medium', label: 'Moyenne' },
              { value: 'high', label: 'Haute' },
            ]}
            value={formData.priority}
            onChange={(value) =>
              setFormData({ ...formData, priority: value as Task['priority'] })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Risque</label>
          <SelectField
            options={[
              { value: 'low', label: 'Faible' },
              { value: 'medium', label: 'Moyen' },
              { value: 'high', label: 'Eleve' },
            ]}
            value={formData.risk}
            onChange={(value) =>
              setFormData({ ...formData, risk: value as Task['risk'] })
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Date limite</label>
          <Input
            type="date"
            value={formData.dueDate}
            onChange={(event) => setFormData({ ...formData, dueDate: event.target.value })}
          />
          {errors.dueDate ? (
            <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
          ) : null}
        </div>
      </div>

      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit">
          {task ? 'Modifier la tache' : 'Ajouter la tache'}
        </Button>
      </div>
    </form>
  );
}
