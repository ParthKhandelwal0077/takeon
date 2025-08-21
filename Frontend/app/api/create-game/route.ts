import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
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

    // Parse the FormData
    const formData = await request.formData()
    const topic = formData.get('topic') as string
    const description = formData.get('description') as string
    const numQuestions = formData.get('numQuestions') as string
    const timePerQuestion = formData.get('timePerQuestion') as string
    const gameMode = formData.get('gameMode') as string
    const pdfFile = formData.get('pdfFile') as File | null

    // Validate required fields
    if (!topic || !description || !numQuestions || !timePerQuestion || !gameMode) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, description, numQuestions, timePerQuestion, gameMode' },
        { status: 400 }
      )
    }

    // Validate game mode
    const validGameModes = ['private', 'public', 'daily_challenge']
    if (!validGameModes.includes(gameMode)) {
      return NextResponse.json(
        { error: `Invalid game mode. Must be one of: ${validGameModes.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate unique IDs
    const gameId = uuidv4()
    const topicId = uuidv4()

    // Upload PDF file to Supabase storage (optional for now)
    let pdfUrl = null
    
    if (pdfFile) {
      try {
        // Create a unique filename to avoid conflicts
        const fileExtension = pdfFile.name.split('.').pop()
        const fileName = `${topicId}_${Date.now()}.${fileExtension}`
        
        // Convert File to ArrayBuffer for Supabase upload
        const fileBuffer = await pdfFile.arrayBuffer()
        
        // Debug: Check if bucket exists and is accessible
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
        console.log('Available buckets:', buckets?.map(b => b.name))
        console.log('Buckets error:', bucketsError)

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('topic-pdfs') // Make sure this bucket exists in your Supabase storage
          .upload(fileName, fileBuffer, {
            contentType: pdfFile.type,
            upsert: false
          })

        console.log('Upload result:', { uploadData, uploadError })

        if (uploadError) {
          console.error('Error uploading PDF:', uploadError)
          
          // If it's an RLS policy error, provide a helpful message
          if (uploadError.message?.includes('row-level security policy') || uploadError.message?.includes('Unauthorized')) {
            return NextResponse.json(
              { 
                error: 'Storage bucket not configured properly. Please set up the topic-pdfs bucket in Supabase Storage with proper RLS policies.',
                details: 'Go to Supabase Dashboard > Storage > Create bucket "topic-pdfs" > Configure RLS policies for authenticated users',
                uploadError: uploadError.message 
              },
              { status: 403 }
            )
          }
          
          // For other storage errors, still create the game but without PDF
          console.warn('PDF upload failed, creating game without PDF:', uploadError)
          pdfUrl = null
        } else {
          // Get the public URL of the uploaded file
          const { data: { publicUrl } } = supabase.storage
            .from('topic-pdfs')
            .getPublicUrl(fileName)

          pdfUrl = publicUrl
        }

      } catch (fileError) {
        console.error('Error processing file:', fileError)
        // Continue without PDF rather than failing completely
        console.warn('PDF processing failed, creating game without PDF')
        pdfUrl = null
      }
    }

    // Create topic entry with the complete schema
    try {
      const { data: topicData, error: topicError } = await supabase
        .from('topics')
        .insert({
          id: topicId,
          name: topic,
          description: description,
          pdf_url: pdfUrl, // Will be null if upload failed
          created_by: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (topicError) {
        console.error('Error creating topic:', topicError)
        return NextResponse.json(
          { error: 'Failed to create topic', details: topicError.message },
          { status: 500 }
        )
      }

      // Insert game data into the games table
      const gameData = {
        id: gameId,
        host_id: user.id,
        topic_id: topicId,
        game_mode: gameMode, // User-selected game mode
        num_questions: parseInt(numQuestions),
        time_per_question: parseInt(timePerQuestion),
        status: 'waiting', // Initial status
        created_at: new Date().toISOString(),
        started_at: null,
        ended_at: null
      }

      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert(gameData)
        .select()
        .single()

      if (gameError) {
        console.error('Error creating game:', gameError)
        return NextResponse.json(
          { error: 'Failed to create game', details: gameError.message },
          { status: 500 }
        )
      }

      // Return the game ID and topic info
      return NextResponse.json({
        success: true,
        gameId: gameId,
        game: game,
        topic: topicData,
        warning: pdfFile && !pdfUrl ? 'Game created successfully, but PDF upload failed. Please configure Supabase Storage.' : null
      })

    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Database operation failed' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in create-game API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 