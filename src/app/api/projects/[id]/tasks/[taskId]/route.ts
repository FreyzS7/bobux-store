import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UpdateTaskInput } from "@/types/projects";
import { broadcastTaskChange } from "@/lib/supabase/broadcast";

// Helper function to check if user can edit project
async function canEditProject(projectId: number, userId: number) {
  const membership = await prisma.projectMember.findFirst({
    where: {
      projectId: projectId,
      userId: userId,
      role: {
        in: ["OWNER", "EDITOR"]
      }
    }
  });

  return !!membership;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, taskId } = await context.params;
    const projectId = parseInt(id);
    const taskIdNum = parseInt(taskId);
    const userId = parseInt(session.user.id);

    // Check if user can edit
    if (!(await canEditProject(projectId, userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify task belongs to project
    const existingTask = await prisma.task.findUnique({
      where: { id: taskIdNum }
    });

    if (!existingTask || existingTask.projectId !== projectId) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body: UpdateTaskInput = await request.json();
    const { title, description, status, assignedToId, position } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (position !== undefined) updateData.position = position;

    const task = await prisma.task.update({
      where: { id: taskIdNum },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
          }
        }
      },
    });

    // Broadcast task update event
    await broadcastTaskChange(projectId, taskIdNum, "updated");

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, taskId } = await context.params;
    const projectId = parseInt(id);
    const taskIdNum = parseInt(taskId);
    const userId = parseInt(session.user.id);

    // Check if user can edit
    if (!(await canEditProject(projectId, userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify task belongs to project
    const existingTask = await prisma.task.findUnique({
      where: { id: taskIdNum }
    });

    if (!existingTask || existingTask.projectId !== projectId) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id: taskIdNum },
    });

    // Broadcast task delete event
    await broadcastTaskChange(projectId, taskIdNum, "deleted");

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
