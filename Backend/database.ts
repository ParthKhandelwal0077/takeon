import { supabase, GameParticipant, DatabaseError } from './supabase';

/**
 * Insert a new participant into the game_participants table
 */
export async function insertGameParticipant(
  gameId: string, 
  userId: string
): Promise<{ success: boolean; error?: DatabaseError; participant?: GameParticipant }> {
  try {
    // First check if participant already exists
    const { data: existingParticipant, error: checkError } = await supabase
      .from('game_participants')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Database error checking existing participant:', checkError);
      return {
        success: false,
        error: {
          message: 'Failed to check existing participant',
          details: checkError.message
        }
      };
    }

    // If participant already exists, return it
    if (existingParticipant) {
      console.log(`Participant ${userId} already exists in game ${gameId}, returning existing record`);
      return {
        success: true,
        participant: existingParticipant as GameParticipant
      };
    }

    // Insert new participant if it doesn't exist
    const participant: Omit<GameParticipant, 'id'> = {
      game_id: gameId,
      user_id: userId,
      joined_at: new Date().toISOString(),
      total_score: 0,
      total_time: 0
    };

    console.log(`Inserting new participant ${userId} into game ${gameId}`);
    const { data, error } = await supabase
      .from('game_participants')
      .insert([participant])
      .select()
      .single();

    if (error) {
      console.error('Database error inserting participant:', error);
      return {
        success: false,
        error: {
          message: 'Failed to save participant to database',
          details: error.message
        }
      };
    }

    console.log(`Successfully inserted participant ${userId} into database`);
    return {
      success: true,
      participant: data as GameParticipant
    };
  } catch (err) {
    console.error('Unexpected error inserting participant:', err);
    return {
      success: false,
      error: {
        message: 'Unexpected error occurred',
        details: err instanceof Error ? err.message : 'Unknown error'
      }
    };
  }
}

/**
 * Get all participants for a specific game
 */
export async function getGameParticipants(
  gameId: string
): Promise<{ success: boolean; participants?: GameParticipant[]; error?: DatabaseError }> {
  try {
    const { data, error } = await supabase
      .from('game_participants')
      .select('*')
      .eq('game_id', gameId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Database error fetching participants:', error);
      return {
        success: false,
        error: {
          message: 'Failed to fetch participants from database',
          details: error.message
        }
      };
    }

    return {
      success: true,
      participants: data as GameParticipant[]
    };
  } catch (err) {
    console.error('Unexpected error fetching participants:', err);
    return {
      success: false,
      error: {
        message: 'Unexpected error occurred',
        details: err instanceof Error ? err.message : 'Unknown error'
      }
    };
  }
}

/**
 * Update participant's score and time
 */
export async function updateParticipantStats(
  participantId: string,
  totalScore: number,
  totalTime: number
): Promise<{ success: boolean; error?: DatabaseError }> {
  try {
    const { error } = await supabase
      .from('game_participants')
      .update({
        total_score: totalScore,
        total_time: totalTime
      })
      .eq('id', participantId);

    if (error) {
      console.error('Database error updating participant stats:', error);
      return {
        success: false,
        error: {
          message: 'Failed to update participant stats',
          details: error.message
        }
      };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error updating participant stats:', err);
    return {
      success: false,
      error: {
        message: 'Unexpected error occurred',
        details: err instanceof Error ? err.message : 'Unknown error'
      }
    };
  }
} 