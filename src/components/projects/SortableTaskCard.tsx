"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskWithRelations } from "@/types/projects";
import { TaskCard } from "./TaskCard";

interface SortableTaskCardProps {
  task: TaskWithRelations;
  onEdit?: (task: TaskWithRelations) => void;
  onDelete?: (taskId: number) => void;
  onMoveUp?: (taskId: number) => void;
  onMoveDown?: (taskId: number) => void;
}

export function SortableTaskCard({
  task,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />
    </div>
  );
}
