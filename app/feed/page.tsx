'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import FollowButton from '@/app/components/FollowButton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeedItem {
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  pedal_id: number
  pedal_name: string
  image_path: string
  status: string
  updated_at: string
}

interface SearchResult {
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)

  if (mins  < 1)   return 'just now'
  if (mins  < 60)  return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days  < 7)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function statusLabel(status: string) {
  if (status === 'have') return { text: 'added to Have',  color: 'text-[#26211d]' }
  if (status === 'had')  return { text: 'listed as Had',  color: 'text-[#5b544c]' }
  if (status === 'want') return { text: 'added to Want',  color: 'text-[#5b544c]' }
  if (status === 'sell') return { text: 'listed for sale', color: 'text-[#2d6a4f]' }
  return { text: status, color: 'text-[#8a7e72]' }
}

function Avatar({ url, name }: { url?: string | null; name: string }) {
  if (url) return <img src={url} alt={name} className="w-8 h-8 rounded-full object-cover" />
  return (
    <div className="w-8 h-8 rounded-full bg-[#e0d9d0] flex items-center justify-center text-[#5b544c] text-xs font-medium">
      {name[0]?.toUpperCase()}
    </div>
  )
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 items-start animate-pulse">
          <div className="w-8 h-8 rounded-full bg-[#ede9e2] shrink-0" />
          <div className="flex-1 bg-[#faf7f2] rounded-2xl p-3 border border-[#ebe6df]">
            <div className="h-3 bg-[#ede9e2] rounded w-2/3 mb-2" />
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-[#ede9e2] rounded-xl" />
              <div className="flex-1 space-y-1.5 pt-1">
                <div className="h-3 bg-[#ede9e2] rounded w-full" />
                <div className="h-2 bg-[#ede9e2] rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SearchSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 bg-[#faf7f2] rounded-2xl p-3 border border-[#ebe6df] animate-pulse">
          <div className="w-9 h-9 rounded-full bg-[#ede9e2] shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-[#ede9e2] rounded w-1/3" />
            <div className="h-2 bg-[#ede9e2] rounded w-1/4" />
          </div>
          <div className="w-16 h-7 bg-[#ede9e2] rounded-full" />
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const [feed, setFeed]       = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [noAuth, setNoAuth]   = useState(false)
  const [noFollows, setNoFollows] = useState(false)

  const [searchTerm, setSearchTerm]       = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching]         = useState(false)

  // Recent activity from people you follow
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setNoAuth(true); setLoading(false); return }

      // IDs de usuarios seguidos
      const { data: followsData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      if (!followsData || followsData.length === 0) {
        setNoFollows(true); setLoading(false); return
      }

      const followingIds = followsData.map((f) => f.following_id)

      // Actividad reciente de esos usuarios (últimos 60 días, máx 60 items)
      const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

      const { data: activity } = await supabase
        .from('feed_activity')
        .select('*')
        .in('user_id', followingIds)
        .gte('updated_at', since)
        .order('updated_at', { ascending: false })
        .limit(60)

      setFeed(activity || [])
      setLoading(false)
    }

    load()
  }, [])

  // Búsqueda de usuarios (debounced)
  useEffect(() => {
    const term = searchTerm.trim()
    if (!term) return

    setSearching(true)

    const handle = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .not('username', 'is', null)
        .ilike('username', `%${term}%`)
        .limit(20)

      setSearchResults(data || [])
      setSearching(false)
    }, 300)

    return () => clearTimeout(handle)
  }, [searchTerm])

  const isSearching = searchTerm.trim() !== ''

  return (
    <main className="min-h-screen bg-[#f5f1ea] flex justify-center">
      <div className="w-full max-w-md px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <Link href="/discover">
            <img
              src="https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/logo/patchlogo.png"
              alt="Patchlog"
              className="w-[92%] mx-auto object-contain mb-5"
            />
          </Link>
          <h1 className="text-3xl font-serif font-medium text-[#26211d] leading-none mb-1">Community</h1>
          <p className="text-sm text-[#5b544c]">Find collectors and catch up on their activity.</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a7e72]"
            width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by username..."
            className="w-full bg-[#faf7f2] border border-[#c8beb1] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-[#26211d] focus:outline-none focus:ring-2 focus:ring-[#26211d]/20"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8a7e72] hover:text-[#26211d]"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* SEARCH RESULTS */}
        {isSearching && (
          <div className="space-y-2">
            {searching && <SearchSkeleton />}

            {!searching && searchResults.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-[#5b544c]">No users found.</p>
              </div>
            )}

            {!searching && searchResults.map((result) => {
              const name = result.display_name ?? result.username
              return (
                <div key={result.user_id} className="flex items-center gap-3 bg-[#faf7f2] rounded-2xl p-3 border border-[#ebe6df]">
                  <Link href={`/u/${result.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar url={result.avatar_url} name={name} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#26211d] truncate">{name}</p>
                      <p className="text-xs text-[#8a7e72] truncate">@{result.username}</p>
                    </div>
                  </Link>
                  <FollowButton targetUserId={result.user_id} />
                </div>
              )
            })}
          </div>
        )}

        {/* RECENT ACTIVITY */}
        {!isSearching && (
          <>
            <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#8a7e72] font-medium mb-4">
              Recent activity
            </h2>

            {loading && <FeedSkeleton />}

            {!loading && noAuth && (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">🔐</p>
                <p className="font-serif text-xl text-[#26211d] mb-2">Sign in to see your feed</p>
                <p className="text-sm text-[#5b544c] mb-6">Follow other collectors to see their activity here.</p>
                <Link href="/" className="inline-block bg-[#26211d] text-[#f8f5ef] text-sm font-medium px-6 py-3 rounded-full">
                  Sign in →
                </Link>
              </div>
            )}

            {!loading && !noAuth && noFollows && (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">🎸</p>
                <p className="font-serif text-xl text-[#26211d] mb-2">Your feed is empty</p>
                <p className="text-sm text-[#5b544c] mb-6">Search for collectors above and follow them to see their activity here.</p>
              </div>
            )}

            {!loading && !noAuth && !noFollows && feed.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">😴</p>
                <p className="font-serif text-xl text-[#26211d] mb-2">No recent activity</p>
                <p className="text-sm text-[#5b544c]">The people you follow haven&apos;t updated their collections recently.</p>
              </div>
            )}

            {!loading && feed.length > 0 && (
              <div className="space-y-4">
                {feed.map((item, i) => {
                  const imageUrl   = `https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/pedal_images/${item.image_path}`
                  const { text, color } = statusLabel(item.status)
                  const name = item.display_name ?? item.username

                  return (
                    <div key={`${item.user_id}-${item.pedal_id}-${i}`} className="flex gap-3 items-start">
                      {/* Avatar */}
                      <Link href={`/u/${item.username}`} className="shrink-0 mt-0.5">
                        <Avatar url={item.avatar_url} name={name} />
                      </Link>

                      {/* Card */}
                      <div className="flex-1 bg-[#faf7f2] rounded-2xl p-3 border border-[#ebe6df]">
                        {/* Action line */}
                        <p className="text-xs text-[#5b544c] mb-2.5">
                          <Link href={`/u/${item.username}`} className="font-medium text-[#26211d] hover:underline">
                            {name}
                          </Link>
                          {' '}
                          <span className={color}>{text}</span>
                          <span className="text-[#b0a89e] ml-1">· {timeAgo(item.updated_at)}</span>
                        </p>

                        {/* Pedal row */}
                        <Link href={`/pedal/${item.pedal_id}`} className="flex items-center gap-3">
                          <div className="w-14 h-14 bg-[#f3efe8] rounded-xl flex items-center justify-center shrink-0">
                            <img src={imageUrl} alt={item.pedal_name} className="w-10 h-10 object-contain" loading="lazy" />
                          </div>
                          <div>
                            <p className="text-sm font-serif font-medium text-[#26211d] leading-snug">{item.pedal_name}</p>
                            {item.status === 'sell' && (
                              <span className="text-[10px] font-medium text-[#2d6a4f] bg-[#d8f3e8] px-2 py-0.5 rounded-full inline-block mt-0.5">
                                For Sale
                              </span>
                            )}
                          </div>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#f5f1ea]/95 backdrop-blur border-t border-[#e8e1d8]">
          <div className="max-w-md mx-auto flex justify-around py-3">
            <Link href="/discover" className="flex flex-col items-center gap-0.5 text-[#8a7e72]">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <span className="text-[10px] uppercase tracking-widest">Discover</span>
            </Link>
            <Link href="/collection" className="flex flex-col items-center gap-0.5 text-[#8a7e72]">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
              <span className="text-[10px] uppercase tracking-widest">Collection</span>
            </Link>
            <Link href="/feed" className="flex flex-col items-center gap-0.5 text-[#26211d] font-medium">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span className="text-[10px] uppercase tracking-widest">Community</span>
            </Link>
          </div>
        </div>

        <div className="h-24" />
      </div>
    </main>
  )
}
