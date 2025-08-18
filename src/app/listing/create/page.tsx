"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "gamepass", label: "GamePass" },
  { id: "senjata", label: "Senjata" },
  { id: "title", label: "Title" },
  { id: "rupiah", label: "Rupiah" },
  { id: "unknown", label: "Unknown" },
];

export default function CreateListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
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
    // For now, we'll store images locally or you can implement Cloudinary
    // This is a placeholder - in production, you'd upload to cloud storage
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
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
      let transferProofUrl = null;
      
      if (formData.transferProof) {
        transferProofUrl = await uploadImage(formData.transferProof);
      }

      const response = await fetch("/api/listings", {
        method: "POST",
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
        toast.success("Listing berhasil dibuat!");
        router.push("/listing");
      } else {
        const error = await response.json();
        toast.error(error.message || "Gagal membuat listing");
      }
    } catch (error) {
      toast.error("Gagal membuat listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Buat Listing Baru</CardTitle>
              <CardDescription>
                Isi detail untuk listing baru Anda
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
                  <Input
                    id="transferProof"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {formData.transferProof && (
                    <p className="text-sm text-green-600">
                      File terpilih: {formData.transferProof.name}
                    </p>
                  )}
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || formData.categories.length === 0 || !formData.itemName.trim()}
                  >
                    {loading ? "Membuat..." : "Buat Listing"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}