"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Listing {
  id: number;
  playerUsername: string;
  playerUserId?: string;
  itemName: string;
  categories: string[];
  customNotes?: string;
  price?: number;
  transferProof?: string;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
  createdAt: string;
  updatedAt: string;
  user: {
    username: string;
    role: string;
  };
}

export default function ListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [changedListings, setChangedListings] = useState<Set<number>>(new Set());

  // Redirect if not authorized
  if (status === "authenticated" && !["SELLER", "MANAGER"].includes(session.user.role)) {
    router.push("/");
    return null;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  useEffect(() => {
    fetchListings();
  }, []);

  // Separate effect for polling to avoid dependency issues
  useEffect(() => {
    if (session?.user.role === "SELLER" && listings.length > 0) {
      const pollInterval = setInterval(() => {
        fetchListingsForPolling();
      }, 10000); // Poll every 10 seconds
      
      return () => clearInterval(pollInterval);
    }
  }, [session?.user.role, listings.length]);

  const fetchListings = async () => {
    try {
      const response = await fetch("/api/listings");
      if (response.ok) {
        const data = await response.json();
        setListings(data);
        setLastUpdated(new Date());
      } else {
        toast.error("Gagal memuat listing");
      }
    } catch (error) {
      toast.error("Gagal memuat listing");
    } finally {
      setLoading(false);
    }
  };

  const fetchListingsForPolling = async () => {
    try {
      setIsPolling(true);
      const response = await fetch("/api/listings");
      if (response.ok) {
        const newData = await response.json();
        
        // Check for status changes
        const changedIds = new Set<number>();
        listings.forEach((oldListing) => {
          const newListing = newData.find((l: Listing) => l.id === oldListing.id);
          if (newListing && newListing.status !== oldListing.status) {
            changedIds.add(oldListing.id);
            
            // Show notification for status changes
            toast.success(`Status listing "${newListing.itemName}" berubah menjadi ${newListing.status}`, {
              duration: 5000,
            });
            
            // Play sound for DONE status
            if (newListing.status === "DONE") {
              const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpOPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z = =");
              audio.play().catch(() => {});
            }
          }
        });
        
        if (changedIds.size > 0) {
          setChangedListings(changedIds);
          // Clear the highlight after 5 seconds
          setTimeout(() => setChangedListings(new Set()), 5000);
        }
        
        setListings(newData);
        setLastUpdated(new Date());
      }
    } catch (error) {
      // Silently handle polling errors to avoid spamming notifications
      console.error("Polling error:", error);
    } finally {
      setIsPolling(false);
    }
  };

  const updateListingStatus = async (listingId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success("Status berhasil diperbarui!");
        
        // Play notification sound for DONE status
        if (newStatus === "DONE") {
          // Simple notification sound - you can replace with actual sound file
          const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpOPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEAxPpuPwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp3Z9NEA==");
          audio.play().catch(() => {});
        }
        
        await fetchListings();
      } else {
        toast.error("Gagal memperbarui status");
      }
    } catch (error) {
      toast.error("Gagal memperbarui status");
    }
  };

  const deleteListing = async (listingId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus listing ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Listing berhasil dihapus!");
        await fetchListings();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal menghapus listing");
      }
    } catch (error) {
      toast.error("Gagal menghapus listing");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500";
      case "IN_PROGRESS":
        return "bg-blue-500";
      case "DONE":
        return "bg-green-500";
      default:
        return "bg-gray-500";
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
            <div className="text-lg">Memuat listing...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              {session?.user.role === "MANAGER" ? "Semua Listing" : "Listing Saya"}
              {session?.user.role === "SELLER" && (
                <div className="flex items-center gap-2 text-sm">
                  {isPolling && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span>Memeriksa pembaruan...</span>
                    </div>
                  )}
                  <span className="text-muted-foreground">
                    Terakhir diperbarui: {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </h1>
            <p className="text-muted-foreground">
              {session?.user.role === "MANAGER" 
                ? "Kelola semua listing dari penjual" 
                : "Pantau listing Anda dan statusnya. Diperbarui otomatis setiap 10 detik."
              }
            </p>
          </div>
          {session?.user.role === "SELLER" && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={fetchListings}
                disabled={loading || isPolling}
              >
                {loading || isPolling ? "Memuat ulang..." : "Muat Ulang"}
              </Button>
              <Link href="/listing/create">
                <Button>Buat Listing Baru</Button>
              </Link>
            </div>
          )}
        </div>

        {listings.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-lg text-muted-foreground mb-4">
                  Tidak ada listing ditemukan
                </p>
                {session?.user.role === "SELLER" && (
                  <Link href="/listing/create">
                    <Button>Buat Listing Pertama Anda</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {listings.map((listing) => (
              <Card 
                key={listing.id}
                className={`transition-all duration-500 ${
                  changedListings.has(listing.id) 
                    ? 'ring-2 ring-green-500 shadow-lg bg-green-50 dark:bg-green-950/20' 
                    : ''
                }`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span>Pemain: {listing.playerUsername}</span>
                        <Badge className={`text-white ${getStatusColor(listing.status)} transition-all duration-300 ${
                          changedListings.has(listing.id) ? 'animate-pulse' : ''
                        }`}>
                          {listing.status}
                          {changedListings.has(listing.id) && (
                            <span className="ml-1">🔥</span>
                          )}
                        </Badge>
                        {changedListings.has(listing.id) && (
                          <Badge variant="outline" className="text-green-600 border-green-600 animate-pulse">
                            DIPERBARUI
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {session?.user.role === "MANAGER" && (
                          <span>Penjual: {listing.user.username} • </span>
                        )}
                        Dibuat: {format(new Date(listing.createdAt), "PPp", { locale: id })}
                        {new Date(listing.updatedAt).getTime() !== new Date(listing.createdAt).getTime() && (
                          <span> • Diperbarui: {format(new Date(listing.updatedAt), "PPp", { locale: id })}</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Nama Item</h4>
                    <p className="text-lg font-semibold text-primary">{listing.itemName}</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Kategori</h4>
                      <div className="flex flex-wrap gap-2">
                        {listing.categories.map((category) => (
                          <Badge key={category} variant="secondary">
                            {getCategoryIcon(category)} {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {listing.price && (
                      <div>
                        <h4 className="font-medium mb-2">Harga</h4>
                        <p>Rp {listing.price.toLocaleString("id-ID")}</p>
                      </div>
                    )}
                  </div>

                  {listing.playerUserId && (
                    <div>
                      <h4 className="font-medium mb-2">ID Pemain</h4>
                      <p className="text-sm font-mono">{listing.playerUserId}</p>
                    </div>
                  )}

                  {listing.customNotes && (
                    <div>
                      <h4 className="font-medium mb-2">Catatan Khusus</h4>
                      <p className="text-sm">{listing.customNotes}</p>
                    </div>
                  )}

                  {listing.transferProof && (
                    <div>
                      <h4 className="font-medium mb-2">Bukti Transfer</h4>
                      <a 
                        href={listing.transferProof} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Lihat Gambar Bukti Transfer
                      </a>
                    </div>
                  )}

                  {/* Seller Actions */}
                  {session?.user.role === "SELLER" && listing.status === "PENDING" && (
                    <div className="flex gap-2 pt-4">
                      <Link href={`/listing/edit/${listing.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteListing(listing.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Hapus
                      </Button>
                    </div>
                  )}

                  {/* Manager Actions */}
                  {session?.user.role === "MANAGER" && listing.status !== "DONE" && (
                    <div className="flex gap-2 pt-4">
                      {listing.status === "PENDING" && (
                        <Button
                          variant="outline"
                          onClick={() => updateListingStatus(listing.id, "IN_PROGRESS")}
                        >
                          Tandai Sedang Diproses
                        </Button>
                      )}
                      <Button
                        onClick={() => updateListingStatus(listing.id, "DONE")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Tandai Selesai
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}