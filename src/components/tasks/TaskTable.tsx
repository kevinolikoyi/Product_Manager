'use client';

import { Task } from '@/data/mockTasks';
import { Button } from '@/components/ui/Button';

interface TaskTableProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function TaskTable({ tasks, onEdit, onDelete }: TaskTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Titre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Projet
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Statut
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Priorité
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Risque
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Date limite
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {tasks.map((task) => (
            <tr key={task.id}>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                {task.title}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {task.project}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                  task.status === 'done' ? 'bg-green-100 text-green-800' :
                  task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {task.status === 'done' ? 'Terminée' : task.status === 'in_progress' ? 'En cours' : 'À faire'}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                  task.priority === 'high' ? 'bg-red-100 text-red-800' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                  task.risk === 'high' ? 'bg-red-100 text-red-800' :
                  task.risk === 'medium' ? 'bg-orange-100 text-orange-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {task.risk === 'high' ? 'Élevé' : task.risk === 'medium' ? 'Moyen' : 'Faible'}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {new Date(task.dueDate).toLocaleDateString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                <Button
                  onClick={() => onEdit(task)}
                  className="mr-1 text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Modifier
                </Button>
                <Button
                  onClick={() => onDelete(task.id)}
                  className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  Supprimer
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}