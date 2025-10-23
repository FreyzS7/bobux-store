import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateProjectInput } from "@/types/projects";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Get projects where user is owner or member
    const projects = await prisma.project.findMany({
      where: {
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
      },
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
        tasks: {
          select: {
            id: true,
            status: true,
          }
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          }
        }
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateProjectInput = await request.json();
    const { name, description, icon } = body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // Create project and add owner as member with OWNER role
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || null,
        ownerId: userId,
        members: {
          create: {
            userId: userId,
            role: "OWNER",
          }
        }
      },
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
        tasks: {
          select: {
            id: true,
            status: true,
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

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
