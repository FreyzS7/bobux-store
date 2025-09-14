import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateScript, parseItemsFromCategories } from "@/lib/scriptGenerator";
import fs from 'fs';
import path from 'path';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const listingId = parseInt(id);
    const body = await request.json();
    const { status } = body;

    if (!["PENDING", "IN_PROGRESS", "DONE"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.update({
      where: { id: listingId },
      data: { status },
      include: {
        user: {
          select: {
            username: true,
            role: true,
          }
        }
      },
    });

    // If status is DONE, create an order
    if (status === "DONE") {
      await prisma.order.create({
        data: {
          listingId: listing.id,
          status: "COMPLETED",
        },
      });
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Error updating listing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Allow sellers to delete their own listings
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const listingId = parseInt(id);

    // Check if listing exists and belongs to the user (for sellers) or allow managers
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          }
        }
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing tidak ditemukan" }, { status: 404 });
    }

    // Check permissions
    if (session.user.role === "SELLER" && listing.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
    }

    if (session.user.role !== "SELLER" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
    }

    // Don't allow deletion if listing is already in progress or done
    if (listing.status !== "PENDING") {
      return NextResponse.json({ 
        error: "Tidak dapat menghapus listing yang sudah diproses" 
      }, { status: 400 });
    }

    await prisma.listing.delete({
      where: { id: listingId },
    });

    return NextResponse.json({ message: "Listing berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting listing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Allow sellers to edit their own listings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const listingId = parseInt(id);
    const body = await request.json();
    const {
      playerUsername,
      playerUserId,
      itemName,
      categories,
      customNotes,
      price,
      transferProof,
    } = body;

    // Check if listing exists and belongs to the user (for sellers) or allow managers
    const existingListing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          }
        }
      },
    });

    if (!existingListing) {
      return NextResponse.json({ error: "Listing tidak ditemukan" }, { status: 404 });
    }

    // Check permissions
    if (session.user.role === "SELLER" && existingListing.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
    }

    if (session.user.role !== "SELLER" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
    }

    // Don't allow editing if listing is already done
    if (existingListing.status === "DONE") {
      return NextResponse.json({ 
        error: "Tidak dapat mengedit listing yang sudah selesai" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!playerUsername || !itemName || !categories || categories.length === 0) {
      return NextResponse.json(
        { error: "Nama player, nama item, dan kategori wajib diisi" },
        { status: 400 }
      );
    }

    // Generate script if playerUserId is provided and categories are in the right format
    let generatedScript = existingListing.generatedScript; // Keep existing script by default
    if (playerUserId && categories.length > 0) {
      try {
        // Load purchase data
        const datasPath = path.join(process.cwd(), 'public', 'datas.json');
        if (fs.existsSync(datasPath)) {
          const purchaseData = JSON.parse(fs.readFileSync(datasPath, 'utf8'));
          const selectedItems = parseItemsFromCategories(categories);

          if (selectedItems.length > 0) {
            generatedScript = generateScript(playerUserId, selectedItems, purchaseData);
          }
        }
      } catch (error) {
        console.error('Error generating script:', error);
        // Keep existing script if generation fails
      }
    } else if (!playerUserId) {
      // Clear script if no playerUserId provided
      generatedScript = null;
    }

    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: {
        playerUsername,
        playerUserId: playerUserId || null,
        itemName,
        categories,
        customNotes: customNotes || null,
        price: price ? parseInt(price) : null,
        transferProof: transferProof || null,
        generatedScript,
      },
      include: {
        user: {
          select: {
            username: true,
            role: true,
          }
        }
      },
    });

    return NextResponse.json(updatedListing);
  } catch (error) {
    console.error("Error updating listing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}