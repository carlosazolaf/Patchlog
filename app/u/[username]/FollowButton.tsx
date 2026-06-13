'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Props {
  targetUserId: string
}

export default function FollowButton({ targetUserId }: Props) {
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [following, setFollowing]         = useState(false)
  const [loading, setLoading]             = useState(true)
  const [saving, setSaving]               = useState(false)

  // Detecta si el usuario está logueado y si ya sigue al perfil
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) { setLoading(false); return }
      setCurrentUserId(user.id)

      // Si el visitante es el dueño, no mostramos el botón
      if (user.id === targetUserId) { setLoading(false); return }

      const { data } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle()

      setFollowing(!!data)
      setLoading(false)
    }

    init()
  }, [targetUserId])

  // No mostrar si es el propio perfil
  if (!loading && currentUserId === targetUserId) return null

  async function toggle() {
    if (!currentUserId) {
      // No logueado — redirige a la landing para que se loguee
      router.push('/?next=' + encodeURIComponent(window.location.pathname))
      return
    }

    setSaving(true)

    if (following) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
      setFollowing(false)
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: currentUserId, following_id: targetUserId })
      setFollowing(true)
    }

    setSaving(false)
  }

  if (loading) {
    return <div className="w-20 h-8 bg-[#ede9e2] rounded-full animate-pulse" />
  }

  if (!currentUserId) {
    // Visitante sin cuenta — muestra botón que invita a registrarse
    return (
      <button
        onClick={toggle}
        className="text-xs font-medium px-4 py-2 rounded-full border border-[#c8beb1] text-[#5b544c] hover:bg-[#f3efe8] transition-colors"
      >
        Follow
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`text-xs font-medium px-4 py-2 rounded-full transition-all duration-150 ${
        following
          ? 'bg-[#f3efe8] border border-[#c8beb1] text-[#5b544c] hover:bg-[#fde8e5] hover:border-[#f5c9c2] hover:text-[#b84c3e]'
          : 'bg-[#26211d] text-[#f8f5ef] hover:bg-[#3a342e]'
      } ${saving ? 'opacity-50' : ''}`}
    >
      {saving ? '···' : following ? 'Following' : 'Follow'}
    </button>
  )
}
