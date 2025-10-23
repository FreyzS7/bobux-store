"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { TaskWithRelations, ProjectMemberWithUser } from "@/types/projects";

interface CreateTaskDialogProps {
  projectId: number;
  members: ProjectMemberWithUser[];
  editTask?: TaskWithRelations | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  trigger?: React.ReactNode;
}

export function CreateTaskDialog({
  projectId,
  members,
  editTask,
  onSuccess,
  onCancel,
  trigger,
}: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "TODO" as "TODO" | "IN_PROGRESS" | "COMPLETED",
    assignedToId: "unassigned" as string,
  });

  // Auto-open dialog when editTask is provided
  useEffect(() => {
    if (editTask) {
      setOpen(true);
      setFormData({
        title: editTask.title,
        description: editTask.description || "",
        status: editTask.status as "TODO" | "IN_PROGRESS" | "COMPLETED",
        assignedToId: editTask.assignedToId?.toString() || "unassigned",
      });
    }
  }, [editTask]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open && !editTask) {
      setFormData({
        title: "",
        description: "",
        status: "TODO",
        assignedToId: "unassigned",
      });
    }
  }, [open, editTask]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editTask
        ? `/api/projects/${projectId}/tasks/${editTask.id}`
        : `/api/projects/${projectId}/tasks`;

      const method = editTask ? "PATCH" : "POST";

      const payload: any = {
        title: formData.title,
        description: formData.description || undefined,
        status: formData.status,
      };

      if (formData.assignedToId && formData.assignedToId !== "unassigned") {
        payload.assignedToId = parseInt(formData.assignedToId);
      } else if (editTask) {
        // When editing and unassigning, explicitly set to null
        payload.assignedToId = null;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save task");
      }

      toast.success(editTask ? "Task berhasil diupdate!" : "Task berhasil dibuat!");
      setOpen(false);
      setFormData({ title: "", description: "", status: "TODO", assignedToId: "unassigned" });
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Gagal simpan task");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    // If closing the dialog and we're in edit mode, notify parent
    if (!newOpen && editTask) {
      onCancel?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editTask ? "Edit Task" : "Bikin Task Baru"}</DialogTitle>
            <DialogDescription>
              {editTask ? "Update detail task" : "Tambahin task baru ke projek ini"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                Judul Task <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Judul task"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                placeholder="Deskripsi task (opsional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={loading}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">Belum Dikerjain</SelectItem>
                  <SelectItem value="IN_PROGRESS">Lagi Ngerjain</SelectItem>
                  <SelectItem value="COMPLETED">Udah Kelar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assignee">Ditugasin ke</Label>
              <Select
                value={formData.assignedToId}
                onValueChange={(value) =>
                  setFormData({ ...formData, assignedToId: value })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Belum ditugasin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Belum ditugasin</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.userId} value={member.userId.toString()}>
                      {member.user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Lagi nyimpen..." : editTask ? "Update Task" : "Bikin Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
