"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X } from "lucide-react";
import { toast } from "sonner";
import { ProjectInvitationWithRelations } from "@/types/projects";
import { useRealtimeInvitations } from "@/hooks/useRealtimeInvitations";

export function NotificationBadge() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invitations, setInvitations] = useState<ProjectInvitationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = useCallback(async () => {
    try {
      const response = await fetch("/api/invitations");

      if (!response.ok) {
        throw new Error("Failed to fetch invitations");
      }

      const data = await response.json();
      setInvitations(data);
    } catch (error) {
      console.error("Error fetching invitations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchInvitations();
    }
  }, [status, fetchInvitations]);

  // Enable realtime subscriptions for invitations
  useRealtimeInvitations({
    userId: parseInt(session?.user?.id || "0"),
    onInvitationChange: fetchInvitations,
  });

  const handleInvitation = async (invitationId: number, action: "accept" | "reject") => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} invitation`);
      }

      toast.success(
        action === "accept"
          ? "Invitation accepted! Redirecting to project..."
          : "Invitation rejected"
      );

      // Remove from list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));

      // If accepted, redirect to the project
      if (action === "accept") {
        const invitation = invitations.find((inv) => inv.id === invitationId);
        if (invitation) {
          setTimeout(() => {
            router.push(`/projects/${invitation.projectId}`);
          }, 1000);
        }
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} invitation`);
    }
  };

  if (status !== "authenticated" || loading) {
    return null;
  }

  const count = invitations.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-2 py-2">
          <h4 className="font-semibold text-sm">Project Invitations</h4>
          {count > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              You have {count} pending {count === 1 ? "invitation" : "invitations"}
            </p>
          )}
        </div>

        <DropdownMenuSeparator />

        {count === 0 ? (
          <div className="px-2 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              No pending invitations
            </p>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="px-2 py-3 hover:bg-muted/50 border-b last:border-b-0"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-medium truncate">
                      {invitation.project.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Invited by {invitation.invitedBy.username}
                    </p>
                    {invitation.project.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {invitation.project.description}
                      </p>
                    )}
                  </div>
                  {invitation.project.icon && (
                    <div className="text-2xl flex-shrink-0">
                      {invitation.project.icon}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 mt-3">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() => handleInvitation(invitation.id, "accept")}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleInvitation(invitation.id, "reject")}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
