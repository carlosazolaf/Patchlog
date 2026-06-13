'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
    return <div className="h-7 w-24 shrink-0 rounded-full bg-[#f3efe8] animate-pulse" />
  }

  if (!email) {
    return (
      <Link
        href="/"
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#c8beb1] bg-[#faf7f2] px-3 py-1.5 text-xs text-[#5b544c] transition-colors hover:bg-[#f3efe8]"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#c8beb1]" />
        Sign in
      </Link>
    )
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#ddd7ce] bg-[#faf7f2] px-3 py-1.5 text-xs text-[#5b544c]">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
      <span className="max-w-[110px] truncate">{email}</span>
      <button
        onClick={handleSignOut}
        className="shrink-0 text-[#8a7e72] hover:text-[#26211d] hover:underline underline-offset-2"
      >
        Sign out
      </button>
    </div>
  )
}
