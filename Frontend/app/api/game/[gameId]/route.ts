import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { gameId } = await params

    // Fetch game details with topic information
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select(`
        *,
        topics (
          id,
          name,
          description,
          pdf_url
        )
      `)
      .eq('id', gameId)
      .single()

    if (gameError) {
      console.error('Error fetching game:', gameError)
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // TODO: Fetch players who have joined this game
    // For now, return just the host
    const players = [
      {
        id: game.host_id,
        username: 'Host', // We'd get this from profiles table
        is_host: true
      }
    ]

    return NextResponse.json({
      success: true,
      game,
      players,
      currentUserId: user.id
    })

  } catch (error) {
    console.error('Error in game API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 