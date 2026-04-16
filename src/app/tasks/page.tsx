'use client';

import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import TaskTable from '@/components/tasks/TaskTable';
import TaskForm from '@/components/forms/TaskForm';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useTasks } from '@/lib/store';
import { Task } from '@/data/mockTasks';

type Filter = 'all' | 'overdue' | 'today' | 'high_priority';

export default function TasksPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const tasksHook = useTasks();

  const today = new Date().toISOString().split('T')[0];

// Note: mockTasks replaced by store.tasks in filteredTasks
  const filteredTasks = tasksHook.tasks.filter((task) => {
    switch (filter) {
      case 'overdue':
        return task.dueDate < today && task.status !== 'done';
      case 'today':
        return task.dueDate === today;
      case 'high_priority':
        return task.priority === 'high';
      default:
        return true;
    }
  });

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette tâche ?')) {
      tasksHook.dispatch({ type: 'DELETE_TASK', payload: id });
    }
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleTaskSuccess = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    alert(editingTask ? 'Tâche modifiée avec succès !' : 'Tâche créée avec succès !');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Tâches</h1>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex space-x-4">
            <button
              key="all"
              onClick={() => setFilter('all')}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Toutes
            </button>
            <button
              key="overdue"
              onClick={() => setFilter('overdue')}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                filter === 'overdue'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              En retard
            </button>
            <button
              key="today"
              onClick={() => setFilter('today')}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                filter === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Pour aujourd'hui
            </button>
            <button
              key="high_priority"
              onClick={() => setFilter('high_priority')}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                filter === 'high_priority'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Priorité haute
            </button>
          </div>
          <Button onClick={handleAddTask} className="w-full sm:w-auto">
            ➕ Ajouter une tâche
          </Button>
        </div>

        <TaskTable tasks={filteredTasks} onEdit={handleEdit} onDelete={handleDelete} />

        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTask ? 'Modifier la tâche' : 'Ajouter une tâche'}>
          <TaskForm task={editingTask} onClose={handleCloseModal} onSuccess={handleTaskSuccess} />
        </Modal>
      </div>
    </Layout>
  );
}
