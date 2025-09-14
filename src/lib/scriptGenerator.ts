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

export function generateScript(
  userId: string,
  selectedItems: string[],
  purchaseData: PurchaseData
): string {
  if (!userId || selectedItems.length === 0) return ''

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

  return [header, ...scriptLines, footer].join('\n')
}

export function parseItemsFromCategories(categories: string[]): string[] {
  // Convert category strings to item format expected by generator
  // This assumes categories are in format like "GamePass:VIP" or "Tools:Sword"
  return categories.filter(category => category.includes(':'))
}