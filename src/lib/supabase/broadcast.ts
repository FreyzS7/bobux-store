import { createClient } from "@supabase/supabase-js";

// Create a Supabase client for broadcasting events
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Broadcast a project update event
 */
export async function broadcastProjectUpdate(projectId: number) {
  const channel = supabase.channel(`project:${projectId}`);
  await channel.send({
    type: "broadcast",
    event: "project_updated",
    payload: { projectId },
  });
}

/**
 * Broadcast a task change event
 */
export async function broadcastTaskChange(projectId: number, taskId: number, action: "created" | "updated" | "deleted") {
  const channel = supabase.channel(`tasks:${projectId}`);
  await channel.send({
    type: "broadcast",
    event: "task_changed",
    payload: { projectId, taskId, action },
  });
}

/**
 * Broadcast a member change event
 */
export async function broadcastMemberChange(projectId: number, userId: number, action: "joined" | "left") {
  const channel = supabase.channel(`members:${projectId}`);
  await channel.send({
    type: "broadcast",
    event: "member_changed",
    payload: { projectId, userId, action },
  });
}

/**
 * Broadcast an invitation event
 */
export async function broadcastInvitation(userId: number, invitationId: number, action: "received" | "accepted" | "rejected") {
  const channel = supabase.channel(`invitations:${userId}`);
  await channel.send({
    type: "broadcast",
    event: "invitation_changed",
    payload: { userId, invitationId, action },
  });
}
