'use client';

import { useState, FormEvent } from 'react';
import { useProjects } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SelectField } from '@/components/ui/Select';
import { Project } from '@/data/mockProjects';

interface ProjectFormProps {
  project?: Project | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProjectForm({ project, onClose, onSuccess }: ProjectFormProps) {
  const { dispatch } = useProjects();

  const [formData, setFormData] = useState({
    name: project?.name || '',
    status: project?.status || 'active',
    progress: project?.progress || 0,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = 'Nom requis';
    if (formData.progress < 0 || formData.progress > 100) newErrors.progress = 'Progression entre 0 et 100';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const id = project?.id || Date.now().toString();
    const newProject: Project = {
      id,
      ...formData,
      numberOfTasks: 0, // computed later
    };

    if (project) {
      dispatch({ type: 'UPDATE_PROJECT', payload: newProject });
    } else {
      dispatch({ type: 'ADD_PROJECT', payload: newProject });
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nom du projet</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full"
          placeholder="Entrez le nom du projet"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <SelectField
            options={[
              { value: 'active', label: 'Actif' },
              { value: 'completed', label: 'Terminé' },
              { value: 'on_hold', label: 'En pause' },
            ]}
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: value as Project['status'] })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Progression (%)</label>
          <Input
            type="number"
            min="0"
            max="100"
            value={formData.progress}
            onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
            className="w-full"
          />
          {errors.progress && <p className="mt-1 text-sm text-red-600">{errors.progress}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full">
        {project ? 'Modifier le projet' : 'Ajouter le projet'}
      </Button>
    </form>
  );
}
