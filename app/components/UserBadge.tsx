'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function UserBadge() {
  const router = useRouter()
  const [email, setEmail]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  async function handleSignOut() {
    setMenuOpen(false)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return <div className="h-6 w-[60px] shrink-0 rounded-full bg-[#f3efe8] animate-pulse" />
  }

  const signedIn = !!email

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => (signedIn ? setMenuOpen((v) => !v) : router.push('/'))}
        title={signedIn ? email! : 'Signed out'}
        className="flex items-center gap-0.5 rounded-full border border-[#ddd7ce] bg-[#faf7f2] p-0.5"
      >
        <span
          className={`rounded-full px-2 py-1 text-[9px] font-bold tracking-widest transition-all ${
            signedIn
              ? 'bg-emerald-500 text-white shadow-[0_0_8px_2px_rgba(16,185,129,0.55)]'
              : 'text-[#c8beb1]'
          }`}
        >
          ON
        </span>
        <span
          className={`rounded-full px-2 py-1 text-[9px] font-bold tracking-widest transition-all ${
            !signedIn
              ? 'bg-red-500 text-white shadow-[0_0_8px_2px_rgba(239,68,68,0.55)]'
              : 'text-[#c8beb1]'
          }`}
        >
          OFF
        </span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 z-20 w-36 rounded-2xl border border-[#ddd7ce] bg-[#faf7f2] p-1 shadow-lg">
          <Link
            href="/settings"
            onClick={() => setMenuOpen(false)}
            className="block rounded-xl px-3 py-2 text-xs font-medium text-[#5b544c] hover:bg-[#f3efe8] hover:text-[#26211d]"
          >
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="block w-full rounded-xl px-3 py-2 text-left text-xs font-medium text-[#5b544c] hover:bg-[#fde8e5] hover:text-[#b84c3e]"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
