"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

const CATEGORIES = [
  { id: "gamepass", label: "GamePass" },
  { id: "senjata", label: "Senjata" },
  { id: "title", label: "Title" },
  { id: "rupiah", label: "Rupiah" },
  { id: "unknown", label: "Unknown" },
];

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
  userId: number;
}

export default function EditListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  
  const [formData, setFormData] = useState({
    playerUsername: "",
    playerUserId: "",
    itemName: "",
    categories: [] as string[],
    customNotes: "",
    price: "",
    transferProof: null as File | null,
  });
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [originalData, setOriginalData] = useState<Listing | null>(null);

  // Redirect if not seller
  if (status === "authenticated" && session.user.role !== "SELLER") {
    router.push("/");
    return null;
  }

  if (status === "loading") {
    return <div>Memuat...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  useEffect(() => {
    fetchListingData();
  }, [listingId]);

  const fetchListingData = async () => {
    try {
      const response = await fetch(`/api/listings`);
      if (response.ok) {
        const listings = await response.json();
        const listing = listings.find((l: Listing) => l.id === parseInt(listingId));
        
        if (!listing) {
          toast.error("Listing tidak ditemukan");
          router.push("/listing");
          return;
        }

        // Check if user owns this listing
        if (listing.userId !== parseInt(session.user.id)) {
          toast.error("Anda tidak diizinkan mengedit listing ini");
          router.push("/listing");
          return;
        }

        // Check if listing can be edited
        if (listing.status === "DONE") {
          toast.error("Listing yang sudah selesai tidak dapat diedit");
          router.push("/listing");
          return;
        }

        setOriginalData(listing);
        setFormData({
          playerUsername: listing.playerUsername,
          playerUserId: listing.playerUserId || "",
          itemName: listing.itemName,
          categories: listing.categories,
          customNotes: listing.customNotes || "",
          price: listing.price ? listing.price.toString() : "",
          transferProof: null,
        });
      } else {
        toast.error("Gagal memuat data listing");
        router.push("/listing");
      }
    } catch (error) {
      toast.error("Gagal memuat data listing");
      router.push("/listing");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      categories: checked 
        ? [...prev.categories, categoryId]
        : prev.categories.filter(c => c !== categoryId)
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, transferProof: file }));
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.url;
      }
      
      return null;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let transferProofUrl = originalData?.transferProof || null;
      
      // Upload new image if provided
      if (formData.transferProof) {
        const uploadedUrl = await uploadImage(formData.transferProof);
        if (uploadedUrl) {
          transferProofUrl = uploadedUrl;
        }
      }

      const response = await fetch(`/api/listings/${listingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerUsername: formData.playerUsername,
          playerUserId: formData.playerUserId,
          itemName: formData.itemName,
          categories: formData.categories,
          customNotes: formData.customNotes,
          price: formData.price,
          transferProof: transferProofUrl,
        }),
      });

      if (response.ok) {
        toast.success("Listing berhasil diperbarui!");
        router.push("/listing");
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal memperbarui listing");
      }
    } catch (error) {
      toast.error("Gagal memperbarui listing");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-lg">Memuat data listing...</div>
          </div>
        </div>
      </>
    );
  }

  if (!originalData) {
    return null;
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Edit Listing</CardTitle>
              <CardDescription>
                Perbarui detail listing Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="playerUsername">Nama Pemain *</Label>
                  <Input
                    id="playerUsername"
                    value={formData.playerUsername}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, playerUsername: e.target.value }))
                    }
                    required
                    placeholder="Masukkan nama pemain"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="playerUserId">ID Pemain (Opsional)</Label>
                  <Input
                    id="playerUserId"
                    value={formData.playerUserId}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, playerUserId: e.target.value }))
                    }
                    placeholder="Masukkan ID pemain"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itemName">Nama Item *</Label>
                  <Input
                    id="itemName"
                    value={formData.itemName}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, itemName: e.target.value }))
                    }
                    required
                    placeholder="Masukkan nama item"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Kategori Item *</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {CATEGORIES.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={category.id}
                          checked={formData.categories.includes(category.id)}
                          onCheckedChange={(checked) =>
                            handleCategoryChange(category.id, checked as boolean)
                          }
                        />
                        <Label htmlFor={category.id} className="text-sm">
                          {category.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {formData.categories.length === 0 && (
                    <p className="text-sm text-red-500">
                      Pilih setidaknya satu kategori
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customNotes">Catatan Khusus</Label>
                  <Textarea
                    id="customNotes"
                    value={formData.customNotes}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, customNotes: e.target.value }))
                    }
                    placeholder="Masukkan catatan tambahan..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Harga dalam Rupiah (Opsional)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, price: e.target.value }))
                    }
                    placeholder="Masukkan harga"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transferProof">Bukti Transfer (Opsional)</Label>
                  {originalData.transferProof && (
                    <div className="mb-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        Bukti transfer saat ini:
                      </p>
                      <a 
                        href={originalData.transferProof} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        Lihat gambar saat ini
                      </a>
                    </div>
                  )}
                  <Input
                    id="transferProof"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {formData.transferProof && (
                    <p className="text-sm text-green-600">
                      File baru terpilih: {formData.transferProof.name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Biarkan kosong jika tidak ingin mengubah gambar
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading || formData.categories.length === 0 || !formData.itemName.trim()}
                    className="flex-1"
                  >
                    {loading ? "Memperbarui..." : "Perbarui Listing"}
                  </Button>
                  <Link href="/listing">
                    <Button type="button" variant="outline">
                      Batal
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}