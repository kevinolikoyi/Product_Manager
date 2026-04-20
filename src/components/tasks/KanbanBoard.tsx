"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import {
  KanbanBoard as KiboKanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/kibo-ui/kanban";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Task } from "@/data/mockTasks";
import { useTasks } from "@/lib/store";
import {
  cn,
  formatShortDate,
  getTaskPriorityScore,
  getTodayIsoDate,
  isTaskOverdue,
  priorityLabels,
  riskLabels,
} from "@/lib/utils";

interface KanbanBoardProps {
  tasks: Task[];
  onEdit?: (task: Task) => void;
}

interface ColumnConfig extends Record<string, unknown> {
  id: Task["status"];
  name: string;
  color: string;
  description: string;
  boardTone: string;
  badgeTone: string;
}

interface BoardTask extends Record<string, unknown> {
  id: string;
  name: string;
  column: Task["status"];
  task: Task;
}

const columns: ColumnConfig[] = [
  {
    id: "todo",
    name: "A faire",
    color: "#64748B",
    description: "Backlog priorisé a lancer.",
    boardTone: "border-slate-200 bg-slate-50/80",
    badgeTone: "bg-slate-200 text-slate-700",
  },
  {
    id: "in_progress",
    name: "En cours",
    color: "#F59E0B",
    description: "Exécution active par l'équipe.",
    boardTone: "border-amber-200 bg-amber-50/80",
    badgeTone: "bg-amber-100 text-amber-800",
  },
  {
    id: "done",
    name: "Terminer",
    color: "#10B981",
    description: "Développement boucle, pret a vérifier.",
    boardTone: "border-emerald-200 bg-emerald-50/80",
    badgeTone: "bg-emerald-100 text-emerald-800",
  },
  {
    id: "tested",
    name: "Tester",
    color: "#0EA5E9",
    description: "Validation fonctionnelle effectuée.",
    boardTone: "border-sky-200 bg-sky-50/80",
    badgeTone: "bg-sky-100 text-sky-800",
  },
  {
    id: "deployed",
    name: "Deployer",
    color: "#8B5CF6",
    description: "Livré et disponible en production.",
    boardTone: "border-violet-200 bg-violet-50/80",
    badgeTone: "bg-violet-100 text-violet-800",
  },
];

function getPriorityTone(priority: Task["priority"]) {
  if (priority === "high") {
    return "bg-red-100 text-red-700";
  }

  if (priority === "medium") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-emerald-100 text-emerald-700";
}

function getRiskTone(risk: Task["risk"]) {
  if (risk === "high") {
    return "bg-red-100 text-red-700";
  }

  if (risk === "medium") {
    return "bg-orange-100 text-orange-700";
  }

  return "bg-emerald-100 text-emerald-700";
}

function buildBoardTasks(tasks: Task[]) {
  const today = getTodayIsoDate();

  return [...tasks]
    .sort((left, right) => getTaskPriorityScore(right, today) - getTaskPriorityScore(left, today))
    .map((task) => ({
      id: task.id,
      name: task.title,
      column: task.status,
      task,
    }));
}

function mergeBoardTasks(current: BoardTask[], tasks: Task[]) {
  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  const orderedIds = current.map((item) => item.id).filter((id) => taskMap.has(id));
  const knownIds = new Set(orderedIds);

  for (const task of tasks) {
    if (!knownIds.has(task.id)) {
      orderedIds.push(task.id);
    }
  }

  return orderedIds.map((id) => {
    const task = taskMap.get(id)!;

    return {
      id: task.id,
      name: task.title,
      column: task.status,
      task,
    };
  });
}

function getAssigneeInitials(value?: string) {
  if (!value) {
    return "NA";
  }

  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function KanbanBoard({ tasks, onEdit }: KanbanBoardProps) {
  const { dispatch } = useTasks();
  const [boardTasks, setBoardTasks] = useState<BoardTask[]>(() => buildBoardTasks(tasks));

  useEffect(() => {
    setBoardTasks((current) => mergeBoardTasks(current, tasks));
  }, [tasks]);

  const handleDataChange = (nextData: BoardTask[]) => {
    setBoardTasks(nextData);

    for (const item of nextData) {
      const sourceTask = tasks.find((task) => task.id === item.id);

      if (!sourceTask || sourceTask.status === item.column) {
        continue;
      }

      dispatch({
        type: "UPDATE_TASK",
        payload: {
          ...sourceTask,
          status: item.column,
        },
      });
    }
  };

  return (
    <KanbanProvider columns={columns} data={boardTasks} onDataChange={handleDataChange}>
      {(column) => (
        <KiboKanbanBoard
          key={column.id}
          id={column.id}
          className={cn(
            "min-h-[560px] min-w-[280px] rounded-[28px] border shadow-[0_18px_36px_rgba(15,23,42,0.08)]",
            column.boardTone,
          )}
        >
          <KanbanHeader className="border-b border-black/5 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <span className="font-semibold text-slate-950 text-sm">{column.name}</span>
                </div>
                <p className="text-xs text-slate-500">{column.description}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  column.badgeTone,
                )}
              >
                {boardTasks.filter((item) => item.column === column.id).length}
              </span>
            </div>
          </KanbanHeader>

          <KanbanCards id={column.id} className="gap-3 p-3">
            {(item: BoardTask) => {
              const today = getTodayIsoDate();
              const overdue = isTaskOverdue(item.task, today);
              const score = getTaskPriorityScore(item.task, today);

              return (
                <KanbanCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  column={item.column}
                  task={item.task}
                  className="rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_16px_32px_rgba(15,23,42,0.08)]"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-slate-950">{item.task.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.task.project}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 border border-slate-200">
                          <AvatarFallback className="bg-slate-100 text-[11px] font-semibold text-slate-700">
                            {getAssigneeInitials(item.task.assignee)}
                          </AvatarFallback>
                        </Avatar>

                        {onEdit ? (
                          <button
                            type="button"
                            onPointerDown={(event) => event.stopPropagation()}
                            onMouseDown={(event) => event.stopPropagation()}
                            onClick={() => onEdit(item.task)}
                            className="grid h-8 w-8 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
                            aria-label={`Modifier ${item.task.title}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                      <span
                        className={cn("rounded-full px-2.5 py-1", getPriorityTone(item.task.priority))}
                      >
                        {priorityLabels[item.task.priority]}
                      </span>
                      <span className={cn("rounded-full px-2.5 py-1", getRiskTone(item.task.risk))}>
                        {riskLabels[item.task.risk]}
                      </span>
                    </div>

                    <div className="grid gap-2 rounded-[20px] bg-slate-50/90 p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Assignée</span>
                        <span className="font-medium text-right text-slate-900">
                          {item.task.assignee ?? "Non assignée"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Echéance</span>
                        <span className="font-medium text-slate-900">
                          {formatShortDate(item.task.dueDate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Score</span>
                        <span className="font-medium text-slate-900">{score}</span>
                      </div>
                      {overdue ? (
                        <span className="inline-flex w-fit rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                          En retard
                        </span>
                      ) : null}
                    </div>
                  </div>
                </KanbanCard>
              );
            }}
          </KanbanCards>
        </KiboKanbanBoard>
      )}
    </KanbanProvider>
  );
}
