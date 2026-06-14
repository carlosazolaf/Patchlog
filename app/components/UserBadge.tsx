'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function UserBadge() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null)
      setLoading(false)
    })
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return <div className="h-6 w-[60px] shrink-0 rounded-full bg-[#f3efe8] animate-pulse" />
  }

  const signedIn = !!email

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 rounded-full border border-[#ddd7ce] bg-[#faf7f2] p-0.5"
      title={signedIn ? email! : 'Signed out'}
    >
      <button
        onClick={() => router.push('/')}
        disabled={signedIn}
        className={`rounded-full px-2 py-1 text-[9px] font-bold tracking-widest transition-all ${
          signedIn
            ? 'bg-emerald-500 text-white shadow-[0_0_8px_2px_rgba(16,185,129,0.55)]'
            : 'text-[#c8beb1] hover:text-[#8a7e72]'
        }`}
      >
        ON
      </button>
      <button
        onClick={handleSignOut}
        disabled={!signedIn}
        className={`rounded-full px-2 py-1 text-[9px] font-bold tracking-widest transition-all ${
          !signedIn
            ? 'bg-red-500 text-white shadow-[0_0_8px_2px_rgba(239,68,68,0.55)]'
            : 'text-[#c8beb1] hover:text-red-500'
        }`}
      >
        OFF
      </button>
    </div>
  )
}
