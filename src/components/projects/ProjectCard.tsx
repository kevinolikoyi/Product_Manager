'use client';

import { Project } from '@/data/mockProjects';
import { Button } from '@/components/ui/Button';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (id: string) => void;
}

export default function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Progression</span>
          <span>{project.progress}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-600"
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
          project.status === 'active' ? 'bg-green-100 text-green-800' :
          project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {project.status === 'active' ? 'Actif' : project.status === 'completed' ? 'Terminé' : 'En pause'}
        </span>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{project.numberOfTasks} tâche{project.numberOfTasks > 1 ? 's' : ''}</span>
          {onEdit && (
            <Button 
              onClick={() => onEdit(project)} 
              className="h-8 px-2 text-xs"
            >
              Modifier
            </Button>
          )}
          {onDelete && (
            <Button 
              onClick={() => onDelete(project.id)} 
              className="h-8 px-2 text-xs bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
