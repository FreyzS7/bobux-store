import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy-initialize Supabase client to avoid build-time errors
let supabase: SupabaseClient | null = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase environment variables not set. Real-time features will be disabled.");
      // Return a mock client that does nothing
      return {
        channel: () => ({
          send: async () => {},
        }),
      } as any;
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}

/**
 * Broadcast a project update event
 */
export async function broadcastProjectUpdate(projectId: number) {
  const client = getSupabaseClient();
  const channel = client.channel(`project:${projectId}`);
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
  const client = getSupabaseClient();
  const channel = client.channel(`tasks:${projectId}`);
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
  const client = getSupabaseClient();
  const channel = client.channel(`members:${projectId}`);
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
  const client = getSupabaseClient();
  const channel = client.channel(`invitations:${userId}`);
  await channel.send({
    type: "broadcast",
    event: "invitation_changed",
    payload: { userId, invitationId, action },
  });
}
