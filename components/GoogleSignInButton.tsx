'use client'

import { supabase } from '@/lib/supabase'

interface Props {
  className?: string
  children: React.ReactNode
}

export function GoogleSignInButton({ className, children }: Props) {
  async function handleClick() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/discover`,
      },
    })

    if (error) {
      console.error(error)
    }
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
}
