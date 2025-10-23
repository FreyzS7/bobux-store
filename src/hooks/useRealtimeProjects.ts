"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseRealtimeProjectsOptions {
  userId: number;
  onProjectChange?: () => void;
}

export function useRealtimeProjects({
  userId,
  onProjectChange,
}: UseRealtimeProjectsOptions) {
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    // Subscribe to project changes via broadcast
    const projectChannel = supabase
      .channel(`projects:${userId}`)
      .on("broadcast", { event: "project_deleted" }, () => {
        onProjectChange?.();
      })
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(projectChannel);
    };
  }, [userId, onProjectChange]);
}
