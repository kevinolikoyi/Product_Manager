'use client';

import { useState, type FormEvent } from 'react';
import type { Project } from '@/lib/types';
import { useDepartments, useProjects } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SelectField } from '@/components/ui/Select';

interface ProjectFormProps {
  project?: Project | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProjectForm({ project, onClose, onSuccess }: ProjectFormProps) {
  const { saveProject } = useProjects();
  const { departments } = useDepartments();

  const [formData, setFormData] = useState({
    name: project?.name || '',
    departmentId: project?.departmentId || '',
    status: project?.status || 'active',
    progress: project?.progress || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nom requis';
    }

    if (!formData.departmentId) {
      newErrors.departmentId = 'Departement requis';
    }

    if (formData.progress < 0 || formData.progress > 100) {
      newErrors.progress = 'Progression entre 0 et 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitError(null);

    const id = project?.id || crypto.randomUUID();
    if (!departments.some((department) => department.id === formData.departmentId)) {
      setSubmitError('Le departement selectionne est introuvable.');
      return;
    }

    const newProject: Project = {
      id,
      ...formData,
      numberOfTasks: project?.numberOfTasks ?? 0,
    };

    try {
      await saveProject(newProject);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Echec d'enregistrement du projet.");
      return;
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

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Departement</label>
        <SelectField
          options={departments.map((department) => ({
            value: department.id,
            label: department.name,
          }))}
          value={formData.departmentId}
          onChange={(value) => setFormData({ ...formData, departmentId: value })}
          placeholder="Selectionnez un departement"
        />
        {errors.departmentId ? (
          <p className="mt-2 text-sm text-red-600">{errors.departmentId}</p>
        ) : null}
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

      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

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
