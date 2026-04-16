'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useTasks } from '@/lib/store';
import { useProjects } from '@/lib/store';
import { Input } from '@/components/ui/Input';
import { SelectField } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Task } from '@/data/mockTasks';


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
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    risk: task?.risk || 'medium',
    dueDate: task?.dueDate || '',
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const projectOptions = projects.map((p) => ({ value: p.name, label: p.name }));

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.title.trim()) newErrors.title = 'Titre requis';
    if (!formData.project) newErrors.project = 'Projet requis';
    if (formData.dueDate && new Date(formData.dueDate) <= today) newErrors.dueDate = 'Date limite dans le passé';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full"
          placeholder="Entrez le titre de la tâche"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Projet</label>
        <SelectField
          options={projectOptions}
          value={formData.project}
          onChange={(value) => setFormData({ ...formData, project: value })}
          placeholder="Sélectionnez un projet"
        />
        {errors.project && <p className="mt-1 text-sm text-red-600">{errors.project}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <SelectField
            options={[
              { value: 'todo', label: 'À faire' },
              { value: 'in_progress', label: 'En cours' },
              { value: 'done', label: 'Terminé' },
            ]}
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: value as Task['status'] })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
          <SelectField
            options={[
              { value: 'low', label: 'Basse' },
              { value: 'medium', label: 'Moyenne' },
              { value: 'high', label: 'Haute' },
            ]}
            value={formData.priority}
            onChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Risque</label>
          <SelectField
            options={[
              { value: 'low', label: 'Faible' },
              { value: 'medium', label: 'Moyen' },
              { value: 'high', label: 'Élevé' },
            ]}
            value={formData.risk}
            onChange={(value) => setFormData({ ...formData, risk: value as Task['risk'] })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date limite</label>
          <Input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
          {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full">
        {task ? 'Modifier la tâche' : 'Ajouter la tâche'}
      </Button>
    </form>
  );
}
