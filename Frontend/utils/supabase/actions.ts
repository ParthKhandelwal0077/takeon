'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('Login error:', error)
    redirect('/error')
  }

  revalidatePath('/private')
  redirect('/private')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    username: formData.get('username') as string,
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  })

  if (signUpError) {
    console.error('Signup error:', signUpError)
    redirect('/error')
  }

  if (!signUpData.user) {
    console.error('Signup successful, but no user data returned.')
    return redirect('/error?message=Could not create user account.')
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: signUpData.user.id,
    username: data.username,
    is_online: false,
    last_seen: new Date().toISOString(),
  })

  if (profileError) {
    console.error('Error creating profile:', profileError)
    redirect('/error?message=Could not create user profile.')
  }

  revalidatePath('/authentication')
  redirect('/authentication?message=Check your email to confirm your account')
}