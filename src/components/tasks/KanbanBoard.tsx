'use client';

import { useState, useCallback } from 'react';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTasks } from '@/lib/store';
import { Task } from '@/data/mockTasks';
import { Button } from '@/components/ui/Button';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  status: Task['status'];
  onTaskDrop: (taskId: string, status: Task['status']) => void;
}

const KanbanColumn = ({ id, title, tasks, status }: Omit<KanbanColumnProps, 'onTaskDrop'>) => {
  const { setNodeRef } = useDroppable({
    id,
  });


  return (
    <div ref={setNodeRef} data-status={status} className="w-80 bg-gray-50 p-4 rounded-lg shadow min-h-[400px] flex-shrink-0">
      <h3 className="font-semibold mb-4 text-gray-900">{title} ({tasks.length})</h3>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[200px]">
          {tasks.map((task) => (
            <KanbanTask key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

const KanbanTask = ({ task }: { task: Task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
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
      className="bg-white p-4 rounded-lg shadow hover:shadow-md border border-gray-200 cursor-grab active:cursor-grabbing hover:border-blue-300 transition-all"
    >
      <h4 className="font-medium text-gray-900 mb-1 leading-tight">{task.title}</h4>
      <p className="text-xs text-gray-500 mb-2 line-clamp-1">{task.project}</p>
      {task.assignee && (
        <p className="text-xs bg-gray-100 px-2 py-1 rounded mb-2 text-gray-700">
          👤 {task.assignee}
        </p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          task.priority === 'high' ? 'bg-red-100 text-red-800' :
          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {task.priority === 'high' ? '🔥 Haute' : task.priority === 'medium' ? '⚡ Moyenne' : '✅ Basse'}
        </span>
        <span className="text-xs text-gray-500 ml-auto">
          {new Date(task.dueDate).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short' 
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
    })
  );

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const taskId = active.id as string;
  const targetStatus = (over.data?.current as { status: Task['status'] })?.status || (over.id as string);

    
    const columnStatusMap: Record<string, Task['status']> = {
      'todo': 'todo',
      'in_progress': 'in_progress',
      'done': 'done'
    };
    
    const newStatus = columnStatusMap[targetStatus];
    
    if (newStatus && newStatus !== tasks.find(t => t.id === taskId)?.status) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        dispatch({ 
          type: 'UPDATE_TASK' as const, 
          payload: { ...task, status: newStatus } 
        });
      }
    }
  }, [tasks, dispatch]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Kanban - Vue Trello</h2>
          <p className="text-gray-600">Drag & drop tâches entre colonnes</p>
        </div>
        <Button>+ Nouvelle tâche</Button>
      </div>
      
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        // modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}

      >
        <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-thin scrollbar-thumb-gray-300">
          <KanbanColumn 
            id="todo"
            title="📋 À faire" 
            tasks={todoTasks} 
            status="todo"
          />

          <KanbanColumn 
            id="in_progress"
            title="⚡ En cours" 
            tasks={inProgressTasks} 
            status="in_progress"
          />
          <KanbanColumn 
            id="done"
            title="✅ Terminé" 
            tasks={doneTasks} 
            status="done"
          />
        </div>
      </DndContext>
    </div>
  );
}

