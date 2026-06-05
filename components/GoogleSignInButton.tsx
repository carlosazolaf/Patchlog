'use client'

import { supabase } from '@/lib/supabase'

interface Props {
  className?: string
  children: React.ReactNode
}

export function GoogleSignInButton({ className, children }: Props) {
  async function handleClick() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
}
