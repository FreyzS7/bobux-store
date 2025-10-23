"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseRealtimeInvitationsOptions {
  userId: number;
  onInvitationChange?: () => void;
}

export function useRealtimeInvitations({
  userId,
  onInvitationChange,
}: UseRealtimeInvitationsOptions) {
  useEffect(() => {
    const supabase = createClient();

    // Subscribe to invitation changes via broadcast
    const invitationChannel = supabase
      .channel(`invitations:${userId}`)
      .on("broadcast", { event: "invitation_changed" }, () => {
        onInvitationChange?.();
      })
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(invitationChannel);
    };
  }, [userId, onInvitationChange]);
}
