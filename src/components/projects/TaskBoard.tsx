"use client";

import { useState } from "react";
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
  { id: "TODO", title: "To Do", color: "border-slate-500" },
  { id: "IN_PROGRESS", title: "In Progress", color: "border-blue-500" },
  { id: "COMPLETED", title: "Completed", color: "border-green-500" },
];

export function TaskBoard({ projectId, tasks, members, onTasksChange }: TaskBoardProps) {
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.position - b.position);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as number;
    const newStatus = over.id as TaskStatus;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // If status hasn't changed, do nothing
    if (task.status === newStatus) return;

    try {
      // Optimistically update UI
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

      toast.success("Task status updated!");
      onTasksChange();
    } catch (error) {
      toast.error("Failed to update task status");
      onTasksChange(); // Refresh to revert optimistic update
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      toast.success("Task deleted successfully!");
      onTasksChange();
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          trigger={<div />}
        />
      )}
    </DndContext>
  );
}
