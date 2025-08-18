"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface DashboardData {
  statistics: {
    totalListings: number;
    pendingListings: number;
    inProgressListings: number;
    completedListings: number;
    monthlyOrders: number;
    yearlyOrders: number;
    monthlyIncome: number;
    yearlyIncome: number;
  };
  monthlyStats: Array<{
    month: string;
    orders: number;
    income: number;
  }>;
  recentOrders: Array<{
    id: number;
    createdAt: string;
    listing: {
      id: number;
      playerUsername: string;
      itemName: string;
      categories: string[];
      price?: number;
      user: {
        username: string;
      };
    };
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session && session.user.role === "MANAGER") {
      fetchDashboardData();
    }
  }, [status, session]);

  // Redirect if not manager
  if (status === "authenticated" && session && session.user.role !== "MANAGER") {
    router.push("/");
    return null;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        toast.error("Gagal memuat data dashboard");
      }
    } catch (error) {
      toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "gamepass":
        return "🎮";
      case "senjata":
        return "⚔️";
      case "title":
        return "👑";
      case "rupiah":
        return "💰";
      default:
        return "❓";
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-lg">Memuat dashboard...</div>
          </div>
        </div>
      </>
    );
  }

  if (!dashboardData) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-lg text-red-600">Failed to load dashboard data</p>
          </div>
        </div>
      </>
    );
  }

  const { statistics, monthlyStats, recentOrders } = dashboardData;

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Manager</h1>
            <p className="text-muted-foreground">
              Pantau performa toko dan kelola operasional
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{statistics.totalListings}</div>
                <p className="text-xs text-muted-foreground">Total Listing</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">{statistics.pendingListings}</div>
                <p className="text-xs text-muted-foreground">Menunggu</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{statistics.inProgressListings}</div>
                <p className="text-xs text-muted-foreground">Diproses</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{statistics.completedListings}</div>
                <p className="text-xs text-muted-foreground">Selesai</p>
              </CardContent>
            </Card>
          </div>

          {/* Income Statistics */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performa Bulanan</CardTitle>
                <CardDescription>Statistik bulan ini</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Pesanan Selesai</span>
                    <span className="text-2xl font-bold text-green-600">
                      {statistics.monthlyOrders}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pendapatan Bulanan</span>
                    <span className="text-2xl font-bold text-green-600">
                      Rp {statistics.monthlyIncome.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performa Tahunan</CardTitle>
                <CardDescription>Statistik tahun ini</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Pesanan Tahunan</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {statistics.yearlyOrders}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pendapatan Tahunan</span>
                    <span className="text-2xl font-bold text-blue-600">
                      Rp {statistics.yearlyIncome.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Statistics Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Tren Pendapatan Bulanan</CardTitle>
              <CardDescription>Performa 12 bulan terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{stat.month}</div>
                      <div className="text-sm text-muted-foreground">
                        {stat.orders} pesanan
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        Rp {stat.income.toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Completed Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Pesanan Selesai Terbaru</CardTitle>
              <CardDescription>Transaksi sukses terbaru</CardDescription>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada pesanan yang selesai
                </p>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">
                          {order.listing.itemName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Pemain: {order.listing.playerUsername} • Penjual: {order.listing.user.username}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Selesai: {format(new Date(order.createdAt), "PPp", { locale: id })}
                        </div>
                        <div className="flex gap-1 mt-2">
                          {order.listing.categories.map((category) => (
                            <Badge key={category} variant="secondary" className="text-xs">
                              {getCategoryIcon(category)} {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        {order.listing.price && (
                          <div className="font-bold text-green-600">
                            Rp {order.listing.price.toLocaleString("id-ID")}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}