import { redirect } from 'next/navigation'
import GameCreation from '@/app/game/GameCreation'
import UserDataProvider from '@/app/private/UserDataProvider'
import { createClient } from '@/utils/supabase/server'

export default async function PrivatePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  
  if (!data.user || error) {
    redirect('/authentication')
  }

  return (
    <UserDataProvider>
      <GameCreation />
    </UserDataProvider>
  )
}