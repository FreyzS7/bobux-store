import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateScript, parseItemsFromCategories } from "@/lib/scriptGenerator";
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let listings;
    
    if (session.user.role === "MANAGER") {
      // Managers can see all listings
      listings = await prisma.listing.findMany({
        include: {
          user: {
            select: {
              username: true,
              role: true,
            }
          }
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else if (session.user.role === "SELLER") {
      // Sellers can only see their own listings
      listings = await prisma.listing.findMany({
        where: {
          userId: parseInt(session.user.id),
        },
        include: {
          user: {
            select: {
              username: true,
              role: true,
            }
          }
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(listings);
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "SELLER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Validate required fields
    if (!playerUsername || !itemName || !categories || categories.length === 0) {
      return NextResponse.json(
        { error: "Player username, item name, and categories are required" },
        { status: 400 }
      );
    }

    // Generate script if playerUserId is provided and categories are in the right format
    let generatedScript = null;
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
        // Continue without script if generation fails
      }
    }

    const listing = await prisma.listing.create({
      data: {
        playerUsername,
        playerUserId: playerUserId || null,
        itemName,
        categories,
        customNotes: customNotes || null,
        price: price ? parseInt(price) : null,
        transferProof: transferProof || null,
        generatedScript,
        status: "PENDING",
        userId: parseInt(session.user.id),
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

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error("Error creating listing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}