'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

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

export default function GeneratorPage() {
  const [userId, setUserId] = useState('')
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [generatedScript, setGeneratedScript] = useState('')
  const [purchaseData, setPurchaseData] = useState<PurchaseData | null>(null)

  useEffect(() => {
    // Load the purchase data from the JSON file
    fetch('/datas.json')
      .then(res => res.json())
      .then(data => setPurchaseData(data))
      .catch(err => console.error('Failed to load purchase data:', err))
  }, [])

  const handleUserIdChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '')
    setUserId(numericValue)
  }

  const fetchUserIdFromUsername = async () => {
    if (!username.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/roblox/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        setUserId(data.userId)
      } else {
        alert(data.error || 'Failed to fetch user ID')
      }
    } catch (error) {
      alert('Failed to fetch user ID')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const generateScript = () => {
    if (!purchaseData || !userId || selectedItems.length === 0) return

    const header = `local Knit = require(game:GetService("ReplicatedStorage").Packages.Knit)
local SaveStructure =
require(game:GetService("ServerScriptService").Server.ServerRuntime.Services.DataStore.DataService.SaveStructure)
local ProfileService = require(Knit.Util.ProfileService)
local ProfileStore = ProfileService.GetProfileStore("PlayerData_TEST", SaveStructure)
local userID = ${userId}
local profile = ProfileStore:LoadProfileAsync("Player_" .. userID, "ForceLoad")
if not profile then
    return
end

profile:Reconcile()
if profile.Data then`

    const footer = `end
profile:Release()`

    const scriptLines: string[] = []

    selectedItems.forEach(itemId => {
      // Check if it's a bundle
      if (purchaseData.PurchaseItems.Bundles[itemId]) {
        const bundle = purchaseData.PurchaseItems.Bundles[itemId]
        bundle.includes.forEach(include => {
          const [category, itemName] = include.split(':')
          if (category === 'GamePass') {
            scriptLines.push(`    profile.Data.Inventory.GamePass["${itemName}"] = true`)
            scriptLines.push(`    print(profile.Data.Inventory.GamePass)`)
          } else if (category === 'Tools') {
            scriptLines.push(`    profile.Data.Inventory.Tools["${itemName}"] = true`)
            scriptLines.push(`    print(profile.Data.Inventory.Tools)`)
          } else if (category === 'Titles') {
            scriptLines.push(`    profile.Data.Inventory.Titles["${itemName}"] = { owned = true, dateReceived = tostring(DateTime.now():ToIsoDate()) }`)
            scriptLines.push(`    print(profile.Data.Inventory.Titles)`)
          }
        })
      } else {
        // Individual item
        const [category, itemName] = itemId.split(':')
        if (category === 'GamePass') {
          scriptLines.push(`    profile.Data.Inventory.GamePass["${itemName}"] = true`)
          scriptLines.push(`    print(profile.Data.Inventory.GamePass)`)
        } else if (category === 'Tools') {
          scriptLines.push(`    profile.Data.Inventory.Tools["${itemName}"] = true`)
          scriptLines.push(`    print(profile.Data.Inventory.Tools)`)
        } else if (category === 'Titles') {
          scriptLines.push(`    profile.Data.Inventory.Titles["${itemName}"] = { owned = true, dateReceived = tostring(DateTime.now():ToIsoDate()) }`)
          scriptLines.push(`    print(profile.Data.Inventory.Titles)`)
        }
      }
    })

    const fullScript = [header, ...scriptLines, footer].join('\n')
    setGeneratedScript(fullScript)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript)
  }

  if (!purchaseData) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Loading purchase data...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Script Generator</h1>
        <p className="text-muted-foreground mt-2">
          langsung jadi
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Info Player</CardTitle>
              <CardDescription>Enter the player's user ID</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter Roblox username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={fetchUserIdFromUsername}
                      disabled={!username.trim() || isLoading}
                      variant="outline"
                    >
                      {isLoading ? 'Loading...' : 'Set'}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    type="text"
                    placeholder="8838480464"
                    value={userId}
                    onChange={(e) => handleUserIdChange(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Select Items</CardTitle>
              <CardDescription>Pilih item bisa bundle dan individual</CardDescription>
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
                          checked={selectedItems.includes(bundleId)}
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
                                checked={selectedItems.includes(itemId)}
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
                                checked={selectedItems.includes(itemId)}
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
                                checked={selectedItems.includes(itemId)}
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

              <div className="pt-4 border-t">
                <Button 
                  onClick={generateScript} 
                  disabled={!userId || selectedItems.length === 0}
                  className="w-full"
                >
                  Generate Script
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Output Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Generated Script</CardTitle>
              <CardDescription>
                Tinggal paste di console roblox studio atau console roblox server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={generatedScript}
                  readOnly
                  placeholder="Generated script will appear here..."
                  className="font-mono text-sm min-h-96"
                />
                <Button 
                  onClick={copyToClipboard}
                  disabled={!generatedScript}
                  variant="outline"
                  className="w-full"
                >
                  Copy to Clipboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}