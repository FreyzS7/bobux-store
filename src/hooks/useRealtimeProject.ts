"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseRealtimeProjectOptions {
  projectId: number;
  onProjectUpdate?: () => void;
  onTaskChange?: () => void;
  onMemberChange?: () => void;
}

export function useRealtimeProject({
  projectId,
  onProjectUpdate,
  onTaskChange,
  onMemberChange,
}: UseRealtimeProjectOptions) {
  useEffect(() => {
    const supabase = createClient();

    // Subscribe to project updates via broadcast
    const projectChannel = supabase
      .channel(`project:${projectId}`)
      .on("broadcast", { event: "project_updated" }, () => {
        onProjectUpdate?.();
      })
      .subscribe();

    // Subscribe to task changes via broadcast
    const taskChannel = supabase
      .channel(`tasks:${projectId}`)
      .on("broadcast", { event: "task_changed" }, () => {
        onTaskChange?.();
      })
      .subscribe();

    // Subscribe to member changes via broadcast
    const memberChannel = supabase
      .channel(`members:${projectId}`)
      .on("broadcast", { event: "member_changed" }, () => {
        onMemberChange?.();
      })
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(projectChannel);
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(memberChannel);
    };
  }, [projectId, onProjectUpdate, onTaskChange, onMemberChange]);
}
