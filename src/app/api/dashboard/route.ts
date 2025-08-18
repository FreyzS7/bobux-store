import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current date info for filtering
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentYear = new Date(now.getFullYear(), 0, 1);

    // Get basic statistics
    const [
      totalListings,
      pendingListings,
      inProgressListings,
      completedListings,
      monthlyOrders,
      yearlyOrders,
      completedOrders,
    ] = await Promise.all([
      // Total listings count
      prisma.listing.count(),
      
      // Pending listings count
      prisma.listing.count({
        where: { status: "PENDING" }
      }),
      
      // In progress listings count
      prisma.listing.count({
        where: { status: "IN_PROGRESS" }
      }),
      
      // Completed listings count
      prisma.listing.count({
        where: { status: "DONE" }
      }),
      
      // Monthly orders (completed listings this month)
      prisma.listing.count({
        where: {
          status: "DONE",
          createdAt: {
            gte: currentMonth
          }
        }
      }),
      
      // Yearly orders (completed listings this year)
      prisma.listing.count({
        where: {
          status: "DONE",
          createdAt: {
            gte: currentYear
          }
        }
      }),

      // Get completed orders with details
      prisma.order.findMany({
        include: {
          listing: {
            include: {
              user: {
                select: {
                  username: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 10
      })
    ]);

    // Calculate monthly income (sum of prices from completed listings)
    const monthlyIncomeResult = await prisma.listing.aggregate({
      where: {
        status: "DONE",
        createdAt: {
          gte: currentMonth
        },
        price: {
          not: null
        }
      },
      _sum: {
        price: true
      }
    });

    // Calculate yearly income
    const yearlyIncomeResult = await prisma.listing.aggregate({
      where: {
        status: "DONE",
        createdAt: {
          gte: currentYear
        },
        price: {
          not: null
        }
      },
      _sum: {
        price: true
      }
    });

    // Get monthly statistics for the last 12 months
    const monthlyStats = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const [orders, income] = await Promise.all([
        prisma.listing.count({
          where: {
            status: "DONE",
            createdAt: {
              gte: monthStart,
              lte: monthEnd
            }
          }
        }),
        prisma.listing.aggregate({
          where: {
            status: "DONE",
            createdAt: {
              gte: monthStart,
              lte: monthEnd
            },
            price: {
              not: null
            }
          },
          _sum: {
            price: true
          }
        })
      ]);

      monthlyStats.push({
        month: monthStart.toLocaleString("id-ID", { month: "short", year: "numeric" }),
        orders,
        income: income._sum.price || 0
      });
    }

    const dashboardData = {
      statistics: {
        totalListings,
        pendingListings,
        inProgressListings,
        completedListings,
        monthlyOrders,
        yearlyOrders,
        monthlyIncome: monthlyIncomeResult._sum.price || 0,
        yearlyIncome: yearlyIncomeResult._sum.price || 0,
      },
      monthlyStats,
      recentOrders: completedOrders
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}