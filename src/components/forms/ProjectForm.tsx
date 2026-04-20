'use client';

import { useState, type FormEvent } from 'react';
import { type Project } from '@/data/mockProjects';
import { useProjects, useTasks } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SelectField } from '@/components/ui/Select';

interface ProjectFormProps {
  project?: Project | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProjectForm({ project, onClose, onSuccess }: ProjectFormProps) {
  const { dispatch } = useProjects();
  const { tasks, dispatch: taskDispatch } = useTasks();

  const [formData, setFormData] = useState({
    name: project?.name || '',
    status: project?.status || 'active',
    progress: project?.progress || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nom requis';
    }

    if (formData.progress < 0 || formData.progress > 100) {
      newErrors.progress = 'Progression entre 0 et 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const id = project?.id || Date.now().toString();
    const newProject: Project = {
      id,
      ...formData,
      numberOfTasks: project?.numberOfTasks ?? 0,
    };

    if (project) {
      dispatch({ type: 'UPDATE_PROJECT', payload: newProject });

      if (project.name !== newProject.name) {
        tasks
          .filter((task) => task.project === project.name)
          .forEach((task) => {
            taskDispatch({
              type: 'UPDATE_TASK',
              payload: {
                ...task,
                project: newProject.name,
              },
            });
          });
      }
    } else {
      dispatch({ type: 'ADD_PROJECT', payload: newProject });
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Nom du projet</label>
        <Input
          value={formData.name}
          onChange={(event) => setFormData({ ...formData, name: event.target.value })}
          className="h-11 rounded-2xl border-slate-200"
          placeholder="Entrez le nom du projet"
        />
        {errors.name ? <p className="mt-2 text-sm text-red-600">{errors.name}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Statut</label>
          <SelectField
            options={[
              { value: 'active', label: 'Actif' },
              { value: 'completed', label: 'Termine' },
              { value: 'on_hold', label: 'En pause' },
            ]}
            value={formData.status}
            onChange={(value) =>
              setFormData({ ...formData, status: value as Project['status'] })
            }
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Progression (%)
          </label>
          <Input
            type="number"
            min="0"
            max="100"
            value={formData.progress}
            onChange={(event) =>
              setFormData({
                ...formData,
                progress: Number.parseInt(event.target.value, 10) || 0,
              })
            }
            className="h-11 rounded-2xl border-slate-200"
          />
          {errors.progress ? (
            <p className="mt-2 text-sm text-red-600">{errors.progress}</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-[22px] bg-slate-50/80 p-4">
        <p className="text-sm font-medium text-slate-700">Projection portefeuille</p>
        <p className="mt-1 text-sm text-slate-500">
          Le statut et la progression seront visibles sur le dashboard et la vue projets.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit">
          {project ? 'Enregistrer les modifications' : 'Ajouter le projet'}
        </Button>
      </div>
    </form>
  );
}
