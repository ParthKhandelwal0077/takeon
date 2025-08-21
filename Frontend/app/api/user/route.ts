import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch additional profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, is_online')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Error fetching user profile' }, { status: 500 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: profile.username,
        isAuthenticated: true,
        isHost: false, // Will be set when creating/joining games
      }
    })

  } catch (error) {
    console.error('Error in user API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 