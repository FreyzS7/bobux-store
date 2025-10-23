"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { TaskWithRelations, ProjectMemberWithUser } from "@/types/projects";
import { TaskCard } from "./TaskCard";
import { DroppableColumn } from "./DroppableColumn";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { toast } from "sonner";

interface TaskBoardProps {
  projectId: number;
  tasks: TaskWithRelations[];
  members: ProjectMemberWithUser[];
  onTasksChange: () => void;
}

type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: "TODO", title: "Belum Dikerjain", color: "border-slate-500" },
  { id: "IN_PROGRESS", title: "Lagi Ngerjain", color: "border-blue-500" },
  { id: "COMPLETED", title: "Udah Kelar", color: "border-green-500" },
];

export function TaskBoard({ projectId, tasks, members, onTasksChange }: TaskBoardProps) {
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);
  const [optimisticTasks, setOptimisticTasks] = useState<TaskWithRelations[]>(tasks);
  const [isDragging, setIsDragging] = useState(false);

  // Sync optimistic tasks with props when they change
  useEffect(() => {
    setOptimisticTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getTasksByStatus = (status: TaskStatus) => {
    return optimisticTasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.position - b.position);
  };

  const handleDragStart = (event: DragStartEvent) => {
    // Prevent drag if another drag operation is in progress
    if (isDragging) return;

    const task = optimisticTasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    // Prevent concurrent drag operations
    if (isDragging) {
      toast.error("Tunggu dulu, lagi proses nih");
      return;
    }

    const taskId = active.id as number;
    const newStatus = over.id as TaskStatus;

    const task = optimisticTasks.find((t) => t.id === taskId);
    if (!task) return;

    // If status hasn't changed, do nothing
    if (task.status === newStatus) return;

    // Lock dragging
    setIsDragging(true);

    // Store the original state for rollback
    const previousTasks = [...optimisticTasks];

    // Optimistically update the UI immediately
    setOptimisticTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      )
    );

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      toast.success("Status task udah diupdate!");
      onTasksChange(); // Fetch fresh data from server
    } catch (error) {
      // Rollback to previous state on error
      setOptimisticTasks(previousTasks);
      toast.error("Gagal update status task");
    } finally {
      // Always unlock dragging after operation completes
      setIsDragging(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Lo yakin mau hapus task ini?")) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      toast.success("Task udah dihapus!");
      onTasksChange();
    } catch (error) {
      toast.error("Gagal hapus task");
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {isDragging && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span className="text-sm font-medium">Lagi update task...</span>
        </div>
      )}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${isDragging ? 'pointer-events-none opacity-60' : ''}`}>
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <DroppableColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              tasks={columnTasks}
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-80">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>

      {editingTask && (
        <CreateTaskDialog
          projectId={projectId}
          members={members}
          editTask={editingTask}
          onSuccess={() => {
            setEditingTask(null);
            onTasksChange();
          }}
          onCancel={() => {
            setEditingTask(null);
          }}
          trigger={<div />}
        />
      )}
    </DndContext>
  );
}
