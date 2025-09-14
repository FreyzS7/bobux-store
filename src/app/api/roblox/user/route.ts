import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Call Roblox API to get user ID from username
    const response = await fetch('https://users.roblox.com/v1/users/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyword: username,
        limit: 1
      })
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch user data from Roblox' },
        { status: 500 }
      )
    }

    const data = await response.json()

    if (!data.data || data.data.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = data.data[0]

    // Check if the username matches exactly (case-insensitive)
    if (user.name.toLowerCase() !== username.toLowerCase()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      userId: user.id.toString(),
      username: user.name,
      displayName: user.displayName
    })

  } catch (error) {
    console.error('Error fetching Roblox user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}