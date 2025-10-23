import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InviteMemberInput } from "@/types/projects";

// Helper function to check if user can invite (owner or editor)
async function canInvite(projectId: number, userId: number) {
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

    // Check if user can invite
    if (!(await canInvite(projectId, userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: InviteMemberInput = await request.json();
    const { username } = body;

    if (!username || username.trim().length === 0) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Find user by username
    const invitedUser = await prisma.user.findUnique({
      where: { username: username.trim() }
    });

    if (!invitedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: invitedUser.id
        }
      }
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this project" },
        { status: 400 }
      );
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.projectInvitation.findUnique({
      where: {
        projectId_invitedUserId: {
          projectId,
          invitedUserId: invitedUser.id
        }
      }
    });

    if (existingInvitation) {
      if (existingInvitation.status === "PENDING") {
        return NextResponse.json(
          { error: "Invitation already sent to this user" },
          { status: 400 }
        );
      } else {
        // Update existing rejected invitation to pending
        const invitation = await prisma.projectInvitation.update({
          where: { id: existingInvitation.id },
          data: {
            status: "PENDING",
            invitedById: userId,
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                icon: true,
              }
            },
            invitedBy: {
              select: {
                id: true,
                username: true,
              }
            }
          }
        });

        return NextResponse.json(invitation, { status: 201 });
      }
    }

    // Create new invitation
    const invitation = await prisma.projectInvitation.create({
      data: {
        projectId,
        invitedUserId: invitedUser.id,
        invitedById: userId,
        status: "PENDING",
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            icon: true,
          }
        },
        invitedBy: {
          select: {
            id: true,
            username: true,
          }
        }
      }
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
