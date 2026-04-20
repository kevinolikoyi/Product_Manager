"use client";

import { useState } from "react";
import { Boxes, CheckCheck, LayoutGrid, Plus, Rocket } from "lucide-react";
import KPI from "@/components/dashboard/KPI";
import TaskForm from "@/components/forms/TaskForm";
import Layout from "@/components/layout/Layout";
import KanbanBoard from "@/components/tasks/KanbanBoard";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Task } from "@/data/mockTasks";
import { useTasks } from "@/lib/store";

export default function KanbanPage() {
  const { tasks } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const doneTasks = tasks.filter((task) => task.status === "done").length;
  const testedTasks = tasks.filter((task) => task.status === "tested").length;
  const deployedTasks = tasks.filter((task) => task.status === "deployed").length;

  const handleAddTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleTaskSuccess = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  return (
    <Layout
      title="Kanban"
      eyebrow="Workflow"
      description="Gestion visuelle du flux de livraison avec glisser-déposer entre les colonnes À faire, En cours, Terminé, Testé et Déployé."
      actions={
        <Button type="button" onClick={handleAddTask}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nouvelle tâche
        </Button>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KPI
            title="Cartes actives"
            value={tasks.length}
            icon={LayoutGrid}
            iconTone="sky"
            trend={0}
            trendLabel="workflow"
          />
          <KPI
            title="Terminees"
            value={doneTasks}
            icon={Boxes}
            iconTone="emerald"
            trend={2.1}
            trendLabel="pretes"
          />
          <KPI
            title="Testees"
            value={testedTasks}
            icon={CheckCheck}
            iconTone="indigo"
            trend={1.4}
            trendLabel="validation"
          />
          <KPI
            title="Deployees"
            value={deployedTasks}
            icon={Rocket}
            iconTone="violet"
            trend={3.2}
            trendLabel="livraison"
          />
        </section>

        <section className="surface-card rounded-[30px] border border-white/60 p-5">
          <div className="flex flex-col gap-3 border-b border-slate-200/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                Board de livraison
              </p>
              <p className="text-sm text-slate-500">
                Déplace les cartes entre les colonnes pour suivre l'avancement réel des tâches.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              5 colonnes de suivi
            </div>
          </div>

          <div className="pt-5">
            <KanbanBoard tasks={tasks} onEdit={handleEditTask} />
          </div>
        </section>

        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingTask ? "Modifier la tâche" : "Ajouter une tâche"}
        >
          <TaskForm
            task={editingTask}
            onClose={handleCloseModal}
            onSuccess={handleTaskSuccess}
          />
        </Modal>
      </div>
    </Layout>
  );
}
