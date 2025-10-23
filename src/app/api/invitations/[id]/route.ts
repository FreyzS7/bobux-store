import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const invitationId = parseInt(id);
    const userId = parseInt(session.user.id);

    const body = await request.json();
    const { action } = body; // "accept" or "reject"

    if (!action || !["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    // Verify invitation belongs to user and is pending
    const invitation = await prisma.projectInvitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invitation.invitedUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Invitation already processed" },
        { status: 400 }
      );
    }

    if (action === "accept") {
      // Accept invitation: create project member and update invitation status
      await prisma.$transaction([
        prisma.projectMember.create({
          data: {
            projectId: invitation.projectId,
            userId: userId,
            role: "EDITOR", // New members default to EDITOR role
          }
        }),
        prisma.projectInvitation.update({
          where: { id: invitationId },
          data: { status: "ACCEPTED" }
        })
      ]);

      return NextResponse.json({ message: "Invitation accepted successfully" });
    } else {
      // Reject invitation
      await prisma.projectInvitation.update({
        where: { id: invitationId },
        data: { status: "REJECTED" }
      });

      return NextResponse.json({ message: "Invitation rejected" });
    }
  } catch (error) {
    console.error("Error processing invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
