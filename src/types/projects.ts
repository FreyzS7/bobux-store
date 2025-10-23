import { Project, Task, ProjectMember, ProjectInvitation, User } from '@/generated/prisma'

// Extended types with relations
export type ProjectWithRelations = Project & {
  owner: Pick<User, 'id' | 'username'>
  members: (ProjectMember & {
    user: Pick<User, 'id' | 'username' | 'role'>
  })[]
  tasks: Task[]
  _count?: {
    tasks: number
    members: number
  }
}

export type TaskWithRelations = Task & {
  assignedTo?: Pick<User, 'id' | 'username'> | null
  project?: Pick<Project, 'id' | 'name'>
}

export type ProjectMemberWithUser = ProjectMember & {
  user: Pick<User, 'id' | 'username' | 'role'>
}

export type ProjectInvitationWithRelations = ProjectInvitation & {
  project: Pick<Project, 'id' | 'name' | 'icon'>
  invitedBy: Pick<User, 'id' | 'username'>
}

// Form/API types
export interface CreateProjectInput {
  name: string
  description?: string
  icon?: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  icon?: string
}

export interface CreateTaskInput {
  title: string
  description?: string
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
  assignedToId?: number
  position?: number
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
  assignedToId?: number
  position?: number
}

export interface InviteMemberInput {
  username: string
}

// Real-time event types
export type ProjectEvent = 'project:updated' | 'project:deleted'
export type TaskEvent = 'task:created' | 'task:updated' | 'task:deleted'
export type MemberEvent = 'member:joined' | 'member:left' | 'member:role_changed'
export type InvitationEvent = 'invitation:received' | 'invitation:accepted' | 'invitation:rejected'

export interface RealtimeEvent<T = any> {
  type: ProjectEvent | TaskEvent | MemberEvent | InvitationEvent
  payload: T
}
