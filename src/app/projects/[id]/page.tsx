"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { ProjectWithRelations } from "@/types/projects";
import { Navigation } from "@/components/navigation";
import { TaskBoard } from "@/components/projects/TaskBoard";
import { CreateTaskDialog } from "@/components/projects/CreateTaskDialog";
import { InviteMemberDialog } from "@/components/projects/InviteMemberDialog";
import { ProjectSettingsDialog } from "@/components/projects/ProjectSettingsDialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRealtimeProject } from "@/hooks/useRealtimeProject";

export default function ProjectDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProject = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);

      if (!response.ok) {
        if (response.status === 403) {
          toast.error("Lo ga punya akses ke projek ini");
          router.push("/projects");
          return;
        }
        throw new Error("Failed to fetch project");
      }

      const data = await response.json();
      setProject(data);
    } catch (error: any) {
      toast.error(error.message || "Gagal load projek nih");
      router.push("/projects");
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && projectId) {
      fetchProject();
    }
  }, [status, projectId, router, fetchProject]);

  // Enable realtime subscriptions
  useRealtimeProject({
    projectId: parseInt(projectId),
    onProjectUpdate: fetchProject,
    onTaskChange: fetchProject,
    onMemberChange: fetchProject,
  });

  if (status === "loading" || loading) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Lagi loading projek...</p>
          </div>
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Projek ga ketemu</p>
          </div>
        </div>
      </>
    );
  }

  const isOwner = project.ownerId === parseInt(session?.user?.id || "0");
  const userMember = project.members.find(
    (m) => m.userId === parseInt(session?.user?.id || "0")
  );
  const canEdit = userMember?.role === "OWNER" || userMember?.role === "EDITOR";

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Balik ke Daftar Projek
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {project.icon && (
                <div className="text-5xl">{project.icon}</div>
              )}
              <div>
                <h1 className="text-3xl font-bold">{project.name}</h1>
                {project.description && (
                  <p className="text-muted-foreground mt-1">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-sm text-muted-foreground">
                    Dibuat sama {project.owner.username}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {canEdit && (
                <>
                  <CreateTaskDialog
                    projectId={parseInt(projectId)}
                    members={project.members}
                    onSuccess={fetchProject}
                  />
                  <InviteMemberDialog
                    projectId={parseInt(projectId)}
                    onSuccess={fetchProject}
                  />
                </>
              )}
              {isOwner && (
                <ProjectSettingsDialog
                  projectId={parseInt(projectId)}
                  projectName={project.name}
                  projectDescription={project.description}
                  projectIcon={project.icon}
                  onSuccess={fetchProject}
                />
              )}
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Anggota ({project.members.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {project.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center space-x-2 bg-muted rounded-full px-3 py-1"
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {member.user.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{member.user.username}</span>
                {member.role === "OWNER" && (
                  <Badge variant="secondary" className="text-xs">
                    Owner
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Task Board */}
        <TaskBoard
          projectId={parseInt(projectId)}
          tasks={project.tasks}
          members={project.members}
          onTasksChange={fetchProject}
        />
      </div>
    </>
  );
}
