"use client";

import Link from "next/link";
import { ProjectWithRelations } from "@/types/projects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProjectCardProps {
  project: ProjectWithRelations;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const taskCount = project._count?.tasks ?? project.tasks.length;
  const memberCount = project._count?.members ?? project.members.length;

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {project.icon ? (
                <div className="text-3xl">{project.icon}</div>
              ) : (
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {project.name[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <CardTitle className="text-xl">{project.name}</CardTitle>
                <CardDescription className="text-sm mt-1">
                  by {project.owner.username}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {project.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {project.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex space-x-4 text-sm text-muted-foreground">
              <span>{taskCount} {taskCount === 1 ? 'task' : 'tasks'}</span>
              <span>•</span>
              <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
            </div>

            {project.members.length > 0 && (
              <div className="flex -space-x-2">
                {project.members.slice(0, 3).map((member) => (
                  <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                    <AvatarFallback className="text-xs">
                      {member.user.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {project.members.length > 3 && (
                  <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                      +{project.members.length - 3}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
