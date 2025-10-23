"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NotificationBadge } from "@/components/projects/NotificationBadge";

export const Navigation = () => {
  const { data: session, status } = useSession();

  const getNavLinks = () => {
    if (!session?.user) return [];

    const { role } = session.user;
    const links = [
      { href: "/", label: "Beranda" },
      { href: "/projects", label: "Projek" },
    ];

    if (role === "SELLER") {
      links.push({ href: "/listing", label: "Listing Saya" });
    }

    if (role === "MANAGER") {
      links.push(
        { href: "/listing", label: "Semua Listing" },
        { href: "/dashboard", label: "Dashboard" }
      );
    }

    return links;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SELLER":
        return "bg-blue-500";
      case "MANAGER":
        return "bg-purple-500";
      case "REGULAR_USER":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-primary">💰</div>
              <div>
                <div className="text-xl font-bold">BOBUX STORE</div>
                <div className="text-xs text-muted-foreground">Cuan adalah jalan ninjaku</div>
              </div>
            </Link>

            {status === "authenticated" && (
              <div className="flex space-x-4">
                {getNavLinks().map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {status === "loading" && (
              <div className="text-sm text-muted-foreground">Memuat...</div>
            )}

            {status === "unauthenticated" && (
              <Link href="/login">
                <Button>Masuk</Button>
              </Link>
            )}

            {status === "authenticated" && session.user && (
              <>
                <NotificationBadge />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {session.user.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium leading-none">
                        {session.user.username}
                      </p>
                      <Badge
                        className={`w-fit text-xs text-white ${getRoleBadgeColor(session.user.role)}`}
                      >
                        {session.user.role}
                      </Badge>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={() => signOut({ callbackUrl: "/login" })}
                    >
                      Keluar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};