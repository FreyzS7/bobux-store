"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
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

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id;

    const activeTask = optimisticTasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Check if dragging over a column (status change)
    const isOverColumn = columns.some((col) => col.id === overId);
    if (isOverColumn) {
      const newStatus = overId as TaskStatus;
      if (activeTask.status !== newStatus) {
        setOptimisticTasks((tasks) =>
          tasks.map((t) =>
            t.id === activeId ? { ...t, status: newStatus } : t
          )
        );
      }
      return;
    }

    // Check if dragging over another task (reordering)
    const overTask = optimisticTasks.find((t) => t.id === overId);
    if (overTask && activeTask.status === overTask.status) {
      const tasksInStatus = optimisticTasks
        .filter((t) => t.status === activeTask.status)
        .sort((a, b) => a.position - b.position);

      const oldIndex = tasksInStatus.findIndex((t) => t.id === activeId);
      const newIndex = tasksInStatus.findIndex((t) => t.id === overId);

      if (oldIndex !== newIndex) {
        const reorderedTasks = arrayMove(tasksInStatus, oldIndex, newIndex);

        // Update positions
        const updatedTasks = optimisticTasks.map((task) => {
          const newPositionIndex = reorderedTasks.findIndex((t) => t.id === task.id);
          if (newPositionIndex !== -1) {
            return { ...task, position: newPositionIndex };
          }
          return task;
        });

        setOptimisticTasks(updatedTasks);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || isDragging) return;

    const taskId = active.id as number;
    const task = optimisticTasks.find((t) => t.id === taskId);
    const originalTask = tasks.find((t) => t.id === taskId);

    if (!task || !originalTask) return;

    // Check if anything changed
    const statusChanged = task.status !== originalTask.status;
    const positionChanged = task.position !== originalTask.position;

    if (!statusChanged && !positionChanged) return;

    // Lock dragging
    setIsDragging(true);
    const previousTasks = [...optimisticTasks];

    try {
      // Calculate new position based on tasks in the target status
      const tasksInStatus = optimisticTasks
        .filter((t) => t.status === task.status && t.id !== taskId)
        .sort((a, b) => a.position - b.position);

      const newPosition = optimisticTasks.filter((t) =>
        t.status === task.status
      ).findIndex((t) => t.id === taskId);

      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: task.status,
          position: newPosition,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      toast.success(statusChanged ? "Status task udah diupdate!" : "Urutan task udah diubah!");
      onTasksChange();
    } catch (error) {
      setOptimisticTasks(previousTasks);
      toast.error("Gagal update task");
    } finally {
      setIsDragging(false);
    }
  };

  const handleMoveUp = async (taskId: number) => {
    if (isDragging) return;

    const task = optimisticTasks.find((t) => t.id === taskId);
    if (!task) return;

    const tasksInStatus = getTasksByStatus(task.status as TaskStatus);
    const currentIndex = tasksInStatus.findIndex((t) => t.id === taskId);

    if (currentIndex <= 0) return;

    setIsDragging(true);
    const previousTasks = [...optimisticTasks];

    // Swap positions
    const reorderedTasks = arrayMove(tasksInStatus, currentIndex, currentIndex - 1);
    const updatedTasks = optimisticTasks.map((t) => {
      const newIndex = reorderedTasks.findIndex((rt) => rt.id === t.id);
      if (newIndex !== -1) {
        return { ...t, position: newIndex };
      }
      return t;
    });

    setOptimisticTasks(updatedTasks);

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: currentIndex - 1 }),
      });

      if (!response.ok) throw new Error("Failed to move task");

      toast.success("Task dipindah ke atas!");
      onTasksChange();
    } catch (error) {
      setOptimisticTasks(previousTasks);
      toast.error("Gagal pindahin task");
    } finally {
      setIsDragging(false);
    }
  };

  const handleMoveDown = async (taskId: number) => {
    if (isDragging) return;

    const task = optimisticTasks.find((t) => t.id === taskId);
    if (!task) return;

    const tasksInStatus = getTasksByStatus(task.status as TaskStatus);
    const currentIndex = tasksInStatus.findIndex((t) => t.id === taskId);

    if (currentIndex >= tasksInStatus.length - 1) return;

    setIsDragging(true);
    const previousTasks = [...optimisticTasks];

    // Swap positions
    const reorderedTasks = arrayMove(tasksInStatus, currentIndex, currentIndex + 1);
    const updatedTasks = optimisticTasks.map((t) => {
      const newIndex = reorderedTasks.findIndex((rt) => rt.id === t.id);
      if (newIndex !== -1) {
        return { ...t, position: newIndex };
      }
      return t;
    });

    setOptimisticTasks(updatedTasks);

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: currentIndex + 1 }),
      });

      if (!response.ok) throw new Error("Failed to move task");

      toast.success("Task dipindah ke bawah!");
      onTasksChange();
    } catch (error) {
      setOptimisticTasks(previousTasks);
      toast.error("Gagal pindahin task");
    } finally {
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
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
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
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 rotate-2 scale-105 transition-transform">
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
