"use client";

import { useState } from "react";
import { Boxes, CheckCheck, LayoutGrid, Plus, Rocket } from "lucide-react";
import KPI from "@/components/dashboard/KPI";
import TaskForm from "@/components/forms/TaskForm";
import Layout from "@/components/layout/Layout";
import KanbanBoard from "@/components/tasks/KanbanBoard";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Select";
import type { Task } from "@/lib/types";
import { useBackendStatus, useDepartments, useProjects, useTasks } from "@/lib/store";

export default function KanbanPage() {
  const { departments } = useDepartments();
  const backendStatus = useBackendStatus();
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const visibleTasks = tasks.filter((task) => {
    if (departmentFilter === "all") {
      return true;
    }

    const project = projects.find((currentProject) => currentProject.id === task.projectId);
    return project?.departmentId === departmentFilter;
  });

  const doneTasks = visibleTasks.filter((task) => task.status === "done").length;
  const testedTasks = visibleTasks.filter((task) => task.status === "tested").length;
  const deployedTasks = visibleTasks.filter((task) => task.status === "deployed").length;

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
      description="Gestion visuelle du flux de livraison avec glisser-deposer entre les colonnes A faire, En cours, Termine, Teste et Deploye."
      actions={
        <Button type="button" onClick={handleAddTask}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nouvelle tache
        </Button>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KPI
            title="Cartes actives"
            value={visibleTasks.length}
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
          <div className="flex flex-col gap-4 border-b border-slate-200/70 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                  Board de livraison
                </p>
                <p className="text-sm text-slate-500">
                  Deplace les cartes entre les colonnes pour suivre l&apos;avancement reel des taches.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                5 colonnes de suivi
              </div>
            </div>

            <div className="max-w-md">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Departement
              </label>
              <SelectField
                options={[
                  { value: "all", label: "Tous les departements" },
                  ...departments.map((department) => ({
                    value: department.id,
                    label: department.name,
                  })),
                ]}
                value={departmentFilter}
                onChange={setDepartmentFilter}
              />
              {departments.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  {backendStatus.loading
                    ? "Chargement des departements..."
                    : backendStatus.error
                      ? `Aucun departement charge. ${backendStatus.error}`
                      : "Aucun departement disponible dans le workspace actif."}
                </p>
              ) : null}
            </div>
          </div>

          <div className="pt-5">
            <KanbanBoard tasks={visibleTasks} onEdit={handleEditTask} />
          </div>
        </section>

        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingTask ? "Modifier la tache" : "Ajouter une tache"}
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
