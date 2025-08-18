"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const Homepage = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Memuat...</div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-4">💰</div>
            <h1 className="text-4xl font-bold mb-2">BOBUX STORE</h1>
            <p className="text-xl text-muted-foreground">Cuan adalah jalan ninjaku</p>
          </div>
          <div className="text-center space-y-4">
            <p className="text-lg">Selamat datang di BOBUX STORE!</p>
            <p className="text-muted-foreground">
              Platform terpercaya untuk transaksi Robux dan item Roblox
            </p>
            <Link href="/login">
              <Button size="lg">Masuk untuk Melanjutkan</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { user } = session!;

  const getWelcomeMessage = () => {
    switch (user.role) {
      case "SELLER":
        return {
          title: `Selamat datang kembali, ${user.username}!`,
          description: "Kelola listing Anda dan pantau penjualan",
          actions: [
            { label: "Buat Listing Baru", href: "/listing/create", variant: "default" as const },
            { label: "Lihat Listing Saya", href: "/listing", variant: "outline" as const },
          ]
        };
      case "MANAGER":
        return {
          title: `Selamat datang, Manager ${user.username}!`,
          description: "Monitor semua listing dan kelola operasional toko",
          actions: [
            { label: "Ke Dashboard", href: "/dashboard", variant: "default" as const },
            { label: "Lihat Semua Listing", href: "/listing", variant: "outline" as const },
          ]
        };
      case "REGULAR_USER":
        return {
          title: `Selamat datang, ${user.username}!`,
          description: "Jelajahi item dan layanan yang tersedia",
          actions: []
        };
      default:
        return {
          title: `Selamat datang, ${user.username}!`,
          description: "Selamat datang di BOBUX STORE",
          actions: []
        };
    }
  };

  const welcomeData = getWelcomeMessage();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <div className="text-5xl">💰</div>
          <h1 className="text-3xl font-bold">BOBUX STORE</h1>
          <p className="text-lg text-muted-foreground">Cuan adalah jalan ninjaku</p>
        </div>

        {/* User-specific Welcome Card */}
        <Card>
          <CardHeader>
            <CardTitle>{welcomeData.title}</CardTitle>
            <CardDescription>{welcomeData.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {welcomeData.actions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <Button variant={action.variant}>{action.label}</Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎮 GamePass</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Game pass premium dan akses VIP
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">⚔️ Senjata</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Senjata kuat dan item pertempuran
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">👑 Title</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gelar eksklusif dan pencapaian
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Tentang BOBUX STORE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              BOBUX STORE adalah platform terpercaya untuk memfasilitasi transaksi 
              item Roblox, GamePass, dan layanan terkait. Kami berkomitmen memberikan 
              pelayanan terbaik untuk komunitas Roblox Indonesia.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">✅ Keamanan Terjamin</h4>
                <p className="text-muted-foreground">
                  Semua transaksi diverifikasi oleh tim manager
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">⚡ Proses Cepat</h4>
                <p className="text-muted-foreground">
                  Transaksi diproses dalam waktu 24 jam
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};