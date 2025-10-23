import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UpdateProjectInput } from "@/types/projects";

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

// Helper function to check if user is project owner
async function isProjectOwner(projectId: number, userId: number) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId
    }
  });

  return !!project;
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

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true,
              }
            }
          },
          orderBy: {
            joinedAt: "asc",
          }
        },
        tasks: {
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
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          }
        }
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Only owner can update project settings
    if (!(await isProjectOwner(projectId, userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: UpdateProjectInput = await request.json();
    const { name, description, icon } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (icon !== undefined) updateData.icon = icon || null;

    const project = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true,
              }
            }
          }
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          }
        }
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Only owner can delete project
    if (!(await isProjectOwner(projectId, userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
