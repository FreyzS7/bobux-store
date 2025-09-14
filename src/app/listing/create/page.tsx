"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PurchaseData {
  PurchaseItems: {
    Bundles: Record<string, {
      available: boolean
      includes: string[]
    }>
    Individual: {
      GamePass: Record<string, boolean>
      Tools: Record<string, boolean>
      Titles: Record<string, boolean>
    }
  }
}

export default function CreateListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    playerUsername: "",
    playerUserId: "",
    itemName: "",
    selectedItems: [] as string[],
    customNotes: "",
    price: "",
    transferProof: null as File | null,
  });

  const [loading, setLoading] = useState(false);
  const [isLoadingUserId, setIsLoadingUserId] = useState(false);
  const [purchaseData, setPurchaseData] = useState<PurchaseData | null>(null);

  useEffect(() => {
    // Load the purchase data from the JSON file
    fetch('/datas.json')
      .then(res => res.json())
      .then(data => setPurchaseData(data))
      .catch(err => console.error('Failed to load purchase data:', err))
  }, [])

  // Redirect if not seller
  if (status === "authenticated" && session && session.user.role !== "SELLER") {
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

  const fetchUserIdFromUsername = async () => {
    if (!formData.playerUsername.trim()) return

    setIsLoadingUserId(true)
    try {
      const response = await fetch('/api/roblox/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: formData.playerUsername.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        setFormData(prev => ({ ...prev, playerUserId: data.userId }))
        toast.success(`User ID found: ${data.userId}`)
      } else {
        toast.error(data.error || 'Failed to fetch user ID')
      }
    } catch (error) {
      toast.error('Failed to fetch user ID')
    } finally {
      setIsLoadingUserId(false)
    }
  }

  const toggleItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.includes(itemId)
        ? prev.selectedItems.filter(id => id !== itemId)
        : [...prev.selectedItems, itemId]
    }))
  }

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
          categories: formData.selectedItems,
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

  if (!purchaseData) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading purchase data...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Buat Listing Baru</h1>
          <p className="text-muted-foreground mt-2">
            Pilih item yang ingin dijual dengan generator otomatis
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Info Player</CardTitle>
                  <CardDescription>Auto convert username ke player user ID</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="playerUsername">Username *</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="playerUsername"
                          type="text"
                          placeholder="Enter Roblox username"
                          value={formData.playerUsername}
                          onChange={(e) => setFormData(prev => ({ ...prev, playerUsername: e.target.value }))}
                          className="flex-1"
                          required
                        />
                        <Button
                          type="button"
                          onClick={fetchUserIdFromUsername}
                          disabled={!formData.playerUsername.trim() || isLoadingUserId}
                          variant="outline"
                        >
                          {isLoadingUserId ? 'Loading...' : 'Set'}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="playerUserId">User ID</Label>
                      <Input
                        id="playerUserId"
                        type="text"
                        placeholder="8838480464"
                        value={formData.playerUserId}
                        onChange={(e) => setFormData(prev => ({ ...prev, playerUserId: e.target.value }))}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detail Listing</CardTitle>
                  <CardDescription>Informasi tambahan listing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="itemName">Nama Item *</Label>
                    <Input
                      id="itemName"
                      value={formData.itemName}
                      onChange={(e) => setFormData(prev => ({ ...prev, itemName: e.target.value }))}
                      required
                      placeholder="Contoh: VIP Package, Diamond Sword, etc."
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customNotes">Catatan Khusus</Label>
                    <Textarea
                      id="customNotes"
                      value={formData.customNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, customNotes: e.target.value }))}
                      placeholder="Catatan tambahan untuk manager..."
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Harga (Rupiah)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="50000"
                      min="0"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="transferProof">Bukti Transfer</Label>
                    <Input
                      id="transferProof"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-2"
                    />
                    {formData.transferProof && (
                      <p className="text-sm text-green-600 mt-1">
                        File: {formData.transferProof.name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Items Selection Section */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Pilih Items *</CardTitle>
                  <CardDescription>
                    Pilih item yang ingin dijual (bundle atau individual)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="bundles">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="bundles">Bundles</TabsTrigger>
                      <TabsTrigger value="individual">Individual</TabsTrigger>
                    </TabsList>

                    <TabsContent value="bundles" className="space-y-4">
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {Object.entries(purchaseData.PurchaseItems.Bundles).map(([bundleId, bundle]) => (
                          <div key={bundleId} className="flex items-start space-x-2 p-2 border rounded">
                            <Checkbox
                              id={bundleId}
                              checked={formData.selectedItems.includes(bundleId)}
                              onCheckedChange={() => toggleItem(bundleId)}
                            />
                            <div className="flex-1">
                              <Label htmlFor={bundleId} className="font-medium">{bundleId}</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {bundle.includes.map(include => (
                                  <Badge key={include} variant="secondary" className="text-xs">
                                    {include}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="individual" className="space-y-4">
                      <Tabs defaultValue="gamepass">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="gamepass">GamePass</TabsTrigger>
                          <TabsTrigger value="tools">Tools</TabsTrigger>
                          <TabsTrigger value="titles">Titles</TabsTrigger>
                        </TabsList>

                        <TabsContent value="gamepass">
                          <div className="space-y-2 max-h-80 overflow-y-auto">
                            {Object.keys(purchaseData.PurchaseItems.Individual.GamePass).map(item => {
                              const itemId = `GamePass:${item}`
                              return (
                                <div key={itemId} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={itemId}
                                    checked={formData.selectedItems.includes(itemId)}
                                    onCheckedChange={() => toggleItem(itemId)}
                                  />
                                  <Label htmlFor={itemId}>{item}</Label>
                                </div>
                              )
                            })}
                          </div>
                        </TabsContent>

                        <TabsContent value="tools">
                          <div className="space-y-2 max-h-80 overflow-y-auto">
                            {Object.keys(purchaseData.PurchaseItems.Individual.Tools).map(item => {
                              const itemId = `Tools:${item}`
                              return (
                                <div key={itemId} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={itemId}
                                    checked={formData.selectedItems.includes(itemId)}
                                    onCheckedChange={() => toggleItem(itemId)}
                                  />
                                  <Label htmlFor={itemId}>{item}</Label>
                                </div>
                              )
                            })}
                          </div>
                        </TabsContent>

                        <TabsContent value="titles">
                          <div className="space-y-2 max-h-80 overflow-y-auto">
                            {Object.keys(purchaseData.PurchaseItems.Individual.Titles).map(item => {
                              const itemId = `Titles:${item}`
                              return (
                                <div key={itemId} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={itemId}
                                    checked={formData.selectedItems.includes(itemId)}
                                    onCheckedChange={() => toggleItem(itemId)}
                                  />
                                  <Label htmlFor={itemId}>{item}</Label>
                                </div>
                              )
                            })}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </TabsContent>
                  </Tabs>

                  {formData.selectedItems.length === 0 && (
                    <p className="text-sm text-red-500 mt-4">
                      Pilih setidaknya satu item
                    </p>
                  )}

                  <div className="pt-4 border-t">
                    <Button
                      type="submit"
                      disabled={loading || !formData.playerUsername || !formData.itemName || formData.selectedItems.length === 0}
                      className="w-full"
                    >
                      {loading ? "Membuat Listing..." : "Buat Listing"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}