'use client';

import { useState, type FormEvent } from 'react';
import { type Task } from '@/data/mockTasks';
import { useProjects, useTasks } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SelectField } from '@/components/ui/Select';

interface TaskFormProps {
  task?: Task | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TaskForm({ task, onClose, onSuccess }: TaskFormProps) {
  const { dispatch: taskDispatch } = useTasks();
  const { projects } = useProjects();

  const [formData, setFormData] = useState({
    title: task?.title || '',
    project: task?.project || '',
    assignee: task?.assignee || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    risk: task?.risk || 'medium',
    dueDate: task?.dueDate || '',
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const projectOptions = projects.map((project) => ({
    value: project.name,
    label: project.name,
  }));

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.title.trim()) nextErrors.title = 'Titre requis';
    if (!formData.project) nextErrors.project = 'Projet requis';
    if (formData.dueDate && new Date(formData.dueDate) <= today) {
      nextErrors.dueDate = 'Date limite dans le passe';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const id = task?.id || Date.now().toString();
    const newTask: Task = {
      id,
      ...formData,
    };

    if (task) {
      taskDispatch({ type: 'UPDATE_TASK', payload: newTask });
    } else {
      taskDispatch({ type: 'ADD_TASK', payload: newTask });
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
        <label className="mb-1 block text-sm font-medium text-gray-700">Projet</label>
        <SelectField
          options={projectOptions}
          value={formData.project}
          onChange={(value) => setFormData({ ...formData, project: value })}
          placeholder="Selectionnez un projet"
        />
        {errors.project ? <p className="mt-1 text-sm text-red-600">{errors.project}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Assigne a</label>
          <Input
            value={formData.assignee}
            onChange={(event) =>
              setFormData({ ...formData, assignee: event.target.value })
            }
            className="w-full"
            placeholder="Nom du collaborateur"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Statut</label>
          <SelectField
            options={[
              { value: 'todo', label: 'A faire' },
              { value: 'in_progress', label: 'En cours' },
              { value: 'done', label: 'Termine' },
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
