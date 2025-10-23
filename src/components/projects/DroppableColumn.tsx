"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskWithRelations, ProjectMemberWithUser } from "@/types/projects";
import { SortableTaskCard } from "./SortableTaskCard";

interface DroppableColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: TaskWithRelations[];
  onEdit: (task: TaskWithRelations) => void;
  onDelete: (taskId: number) => void;
}

export function DroppableColumn({
  id,
  title,
  color,
  tasks,
  onEdit,
  onDelete,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <Card className={`border-t-4 ${color} ${isOver ? "ring-2 ring-primary" : ""}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {title}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({tasks.length})
            </span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent ref={setNodeRef}>
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3 min-h-[200px]">
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {tasks.length === 0 && (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                Drop tasks here
              </div>
            )}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  );
}
