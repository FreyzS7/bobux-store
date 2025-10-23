import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE'

export interface RealtimePayload<T = any> {
  eventType: RealtimeEventType
  new: T
  old: T
  schema: string
  table: string
}

/**
 * Subscribe to changes on a specific table
 */
export function subscribeToTable<T = any>(
  supabase: SupabaseClient,
  table: string,
  callback: (payload: RealtimePayload<T>) => void,
  filter?: string
): RealtimeChannel {
  const channel = supabase
    .channel(`public:${table}${filter ? `:${filter}` : ''}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter,
      },
      (payload: any) => {
        callback({
          eventType: payload.eventType,
          new: payload.new,
          old: payload.old,
          schema: payload.schema,
          table: payload.table,
        })
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to project-specific changes (tasks, members, etc.)
 */
export function subscribeToProject(
  supabase: SupabaseClient,
  projectId: number,
  callbacks: {
    onTaskChange?: (payload: RealtimePayload) => void
    onMemberChange?: (payload: RealtimePayload) => void
    onProjectChange?: (payload: RealtimePayload) => void
    onInvitationChange?: (payload: RealtimePayload) => void
  }
) {
  const channels: RealtimeChannel[] = []

  // Subscribe to tasks
  if (callbacks.onTaskChange) {
    channels.push(
      subscribeToTable(supabase, 'Task', callbacks.onTaskChange, `projectId=eq.${projectId}`)
    )
  }

  // Subscribe to members
  if (callbacks.onMemberChange) {
    channels.push(
      subscribeToTable(supabase, 'ProjectMember', callbacks.onMemberChange, `projectId=eq.${projectId}`)
    )
  }

  // Subscribe to project updates
  if (callbacks.onProjectChange) {
    channels.push(
      subscribeToTable(supabase, 'Project', callbacks.onProjectChange, `id=eq.${projectId}`)
    )
  }

  // Subscribe to invitations
  if (callbacks.onInvitationChange) {
    channels.push(
      subscribeToTable(supabase, 'ProjectInvitation', callbacks.onInvitationChange, `projectId=eq.${projectId}`)
    )
  }

  return {
    unsubscribe: () => {
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }
}

/**
 * Subscribe to user-specific invitation changes
 */
export function subscribeToUserInvitations(
  supabase: SupabaseClient,
  userId: number,
  callback: (payload: RealtimePayload) => void
) {
  return subscribeToTable(supabase, 'ProjectInvitation', callback, `invitedUserId=eq.${userId}`)
}
