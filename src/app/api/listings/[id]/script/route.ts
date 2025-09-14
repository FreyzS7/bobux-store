import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Unauthorized - Manager access required" }, { status: 401 });
    }

    const { id } = await params;
    const listingId = parseInt(id);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        playerUsername: true,
        playerUserId: true,
        itemName: true,
        categories: true,
        generatedScript: true,
        status: true,
        user: {
          select: {
            username: true,
          }
        }
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (!listing.generatedScript) {
      return NextResponse.json({
        error: "No generated script available for this listing",
        listing: {
          id: listing.id,
          playerUsername: listing.playerUsername,
          playerUserId: listing.playerUserId,
          itemName: listing.itemName,
          categories: listing.categories,
          status: listing.status,
          seller: listing.user.username
        }
      }, { status: 404 });
    }

    return NextResponse.json({
      script: listing.generatedScript,
      listing: {
        id: listing.id,
        playerUsername: listing.playerUsername,
        playerUserId: listing.playerUserId,
        itemName: listing.itemName,
        categories: listing.categories,
        status: listing.status,
        seller: listing.user.username
      }
    });
  } catch (error) {
    console.error("Error fetching generated script:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Unauthorized - Manager access required" }, { status: 401 });
    }

    const { id } = await params;
    const listingId = parseInt(id);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        playerUserId: true,
        categories: true,
        generatedScript: true,
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (!listing.playerUserId) {
      return NextResponse.json({
        error: "Cannot regenerate script - Player User ID not provided"
      }, { status: 400 });
    }

    // Force regenerate script
    try {
      const { generateScript, parseItemsFromCategories } = await import("@/lib/scriptGenerator");
      const fs = await import('fs');
      const path = await import('path');

      const datasPath = path.join(process.cwd(), 'public', 'datas.json');
      if (fs.existsSync(datasPath)) {
        const purchaseData = JSON.parse(fs.readFileSync(datasPath, 'utf8'));
        const selectedItems = parseItemsFromCategories(listing.categories);

        if (selectedItems.length > 0) {
          const generatedScript = generateScript(listing.playerUserId, selectedItems, purchaseData);

          // Update the listing with the new script
          const updatedListing = await prisma.listing.update({
            where: { id: listingId },
            data: { generatedScript },
            select: {
              id: true,
              playerUsername: true,
              playerUserId: true,
              itemName: true,
              categories: true,
              generatedScript: true,
              status: true,
              user: {
                select: {
                  username: true,
                }
              }
            },
          });

          return NextResponse.json({
            message: "Script regenerated successfully",
            script: updatedListing.generatedScript,
            listing: {
              id: updatedListing.id,
              playerUsername: updatedListing.playerUsername,
              playerUserId: updatedListing.playerUserId,
              itemName: updatedListing.itemName,
              categories: updatedListing.categories,
              status: updatedListing.status,
              seller: updatedListing.user.username
            }
          });
        }
      }

      return NextResponse.json({
        error: "Failed to regenerate script - Invalid data or categories"
      }, { status: 400 });
    } catch (error) {
      console.error('Error regenerating script:', error);
      return NextResponse.json({
        error: "Failed to regenerate script"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error regenerating script:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}