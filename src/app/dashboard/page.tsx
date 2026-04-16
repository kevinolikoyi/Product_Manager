'use client';

import Layout from '@/components/layout/Layout';
import KPI from '@/components/dashboard/KPI';
import AlertCard from '@/components/dashboard/AlertCard';
import { useTasks } from '@/lib/store';
import { useProjects } from '@/lib/store';
import { Task } from '@/data/mockTasks';

export default function DashboardPage() {
  const tasksHook = useTasks();
  const projectsHook = useProjects();
  const tasks = tasksHook.tasks;
  const projects = projectsHook.projects;
  const today = new Date().toISOString().split('T')[0];

  const overdueTasks = tasks.filter(task => task.dueDate < today && task.status !== 'done');
  const blockedTasks = tasks.filter(task => task.risk === 'high' && task.status === 'in_progress');
  const tasksDueToday = tasks.filter(task => task.dueDate === today);
  const activeProjects = projects.filter(project => project.status === 'active');

  const criticalTasks = tasks.filter(task => task.priority === 'high' && task.dueDate < today && task.status !== 'done');

  const priorityScore = (task: Task) => {
    let score = 0;
    const priorityValue = { high: 3, medium: 2, low: 1 }[task.priority] || 1;
    const riskValue = { high: 4, medium: 2, low: 1 }[task.risk] || 1;
    score += priorityValue + riskValue;
    if (task.risk === 'high' && task.status === 'in_progress') score += 5;
    if (task.dueDate < today && task.status !== 'done') score += 4;
    return score;
  };

  const recentTasks = [...tasks]
    .sort((a, b) => priorityScore(b) - priorityScore(a))
    .slice(0, 5);

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPI title="Tâches en retard" value={overdueTasks.length} />
          <KPI title="Tâches bloquées" value={blockedTasks.length} />
          <KPI title="Tâches à faire aujourd'hui" value={tasksDueToday.length} />
          <KPI title="Projets actifs" value={activeProjects.length} />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Alertes</h2>
          {criticalTasks.length > 0 && (
            <AlertCard
              title="Tâches critiques en retard"
              description={`Vous avez ${criticalTasks.length} tâche(s) de haute priorité en retard.`}
              type="error"
            />
          )}
          {blockedTasks.length > 0 && (
            <AlertCard
              title="Tâches bloquées"
              description={`Vous avez ${blockedTasks.length} tâche(s) bloquée(s).`}
              type="warning"
            />
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900">Tâches récentes</h2>
          <div className="mt-4 space-y-2">
            {recentTasks.map((task) => (
              <div key={task.id} className="rounded-lg bg-white p-4 shadow">
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                <p className="text-sm text-gray-600">{task.project}</p>
                <div className="mt-2 flex items-center space-x-4 text-xs">
                  <span className={`rounded px-2 py-1 ${
                    task.status === 'done' ? 'bg-green-100 text-green-800' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status === 'done' ? 'Terminée' : task.status === 'in_progress' ? 'En cours' : 'À faire'}
                  </span>
                  <span className={`rounded px-2 py-1 ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                  </span>
                  <span className="text-gray-500">Échéance : {new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
