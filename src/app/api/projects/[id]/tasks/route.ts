import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateTaskInput } from "@/types/projects";
import { broadcastTaskChange } from "@/lib/supabase/broadcast";

// Helper function to check if user has access to project
async function hasProjectAccess(projectId: number, userId: number) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        {
          members: {
            some: {
              userId: userId
            }
          }
        }
      ]
    }
  });

  return !!project;
}

// Helper function to check if user can edit project (owner or editor)
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const projectId = parseInt(id);
    const userId = parseInt(session.user.id);

    if (!(await hasProjectAccess(projectId, userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
          }
        }
      },
      orderBy: [
        { status: "asc" },
        { position: "asc" },
      ]
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const projectId = parseInt(id);
    const userId = parseInt(session.user.id);

    // Check if user can edit (owner or editor)
    if (!(await canEditProject(projectId, userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: CreateTaskInput = await request.json();
    const { title, description, status, assignedToId, position } = body;

    // Validate required fields
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    // Get the highest position for the status column
    let taskPosition = position ?? 0;
    if (position === undefined) {
      const lastTask = await prisma.task.findFirst({
        where: {
          projectId,
          status: status || "TODO"
        },
        orderBy: {
          position: "desc"
        }
      });
      taskPosition = (lastTask?.position ?? -1) + 1;
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || "TODO",
        position: taskPosition,
        projectId,
        assignedToId: assignedToId || null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
          }
        }
      },
    });

    // Broadcast task creation event
    await broadcastTaskChange(projectId, task.id, "created");

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
