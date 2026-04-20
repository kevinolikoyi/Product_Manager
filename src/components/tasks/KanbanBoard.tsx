'use client';

import { useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type Task } from '@/data/mockTasks';
import { useTasks } from '@/lib/store';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  status: Task['status'];
}

const KanbanColumn = ({ id, title, tasks, status }: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      data-status={status}
      className="w-80 flex-shrink-0 rounded-lg bg-gray-50 p-4 shadow min-h-[400px]"
    >
      <h3 className="mb-4 font-semibold text-gray-900">
        {title} ({tasks.length})
      </h3>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="min-h-[200px] space-y-3">
          {tasks.map((task) => (
            <KanbanTask key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

const KanbanTask = ({ task }: { task: Task }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-lg border border-gray-200 bg-white p-4 shadow transition-all hover:border-blue-300 hover:shadow-md active:cursor-grabbing"
    >
      <h4 className="mb-1 leading-tight font-medium text-gray-900">{task.title}</h4>
      <p className="mb-2 line-clamp-1 text-xs text-gray-500">{task.project}</p>
      {task.assignee ? (
        <p className="mb-2 rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
          {task.assignee}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            task.priority === 'high'
              ? 'bg-red-100 text-red-800'
              : task.priority === 'medium'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
          }`}
        >
          {task.priority === 'high'
            ? 'Haute'
            : task.priority === 'medium'
              ? 'Moyenne'
              : 'Basse'}
        </span>
        <span className="ml-auto text-xs text-gray-500">
          {new Date(task.dueDate).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
          })}
        </span>
      </div>
    </div>
  );
};

export default function KanbanBoard() {
  const { tasks, dispatch } = useTasks();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const todoTasks = tasks.filter((task) => task.status === 'todo');
  const inProgressTasks = tasks.filter((task) => task.status === 'in_progress');
  const doneTasks = tasks.filter((task) => task.status === 'done');

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const taskId = active.id as string;
      const targetStatus =
        (over.data?.current as { status: Task['status'] } | undefined)?.status ||
        (over.id as string);

      const columnStatusMap: Record<string, Task['status']> = {
        todo: 'todo',
        in_progress: 'in_progress',
        done: 'done',
      };

      const nextStatus = columnStatusMap[targetStatus];
      const currentTask = tasks.find((task) => task.id === taskId);

      if (currentTask && nextStatus && currentTask.status !== nextStatus) {
        dispatch({
          type: 'UPDATE_TASK',
          payload: { ...currentTask, status: nextStatus },
        });
      }
    },
    [dispatch, tasks],
  );

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-8">
        <h2 className="mb-1 text-3xl font-bold text-gray-900">Kanban</h2>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-8">
          <KanbanColumn id="todo" title="A faire" tasks={todoTasks} status="todo" />
          <KanbanColumn
            id="in_progress"
            title="En cours"
            tasks={inProgressTasks}
            status="in_progress"
          />
          <KanbanColumn id="done" title="Termine" tasks={doneTasks} status="done" />
        </div>
      </DndContext>
    </div>
  );
}
