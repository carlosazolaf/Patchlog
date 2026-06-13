'use client'

import { useState } from 'react'
import Link from 'next/link'
import ShareModal from '@/app/components/ShareModal'

type Status = 'have' | 'had' | 'want' | 'sell'

type UserPedal = {
  status: Status
  updated_at: string
  pedals: {
    id: string
    slug: string
    name: string
    image_url: string | null
    brand: { name: string } | null
    type: { name: string } | null
    subtype: { name: string } | null
  } | null
}

type Props = {
  userPedals: UserPedal[]
  username: string | null
}

const TABS: { label: string; value: Status | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Have', value: 'have' },
  { label: 'Had', value: 'had' },
  { label: 'Want', value: 'want' },
  { label: 'For Sale', value: 'sell' },
]

const STATUS_STYLES: Record<Status, string> = {
  have: 'bg-[#e7f3ec] text-[#3f7a5c] border border-[#cfe8da]',
  had: 'bg-[#f3efe8] text-[#8a7e72] border border-[#ddd7ce]',
  want: 'bg-[#e8eef7] text-[#4a6a96] border border-[#d6e2f2]',
  sell: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
}

const STATUS_LABELS: Record<Status, string> = {
  have: 'Have',
  had: 'Had',
  want: 'Want',
  sell: 'For Sale',
}

export default function CollectionClient({ userPedals, username }: Props) {
  const [activeTab, setActiveTab] = useState<Status | 'all'>('all')
  const [shareOpen, setShareOpen] = useState(false)

  const filtered =
    activeTab === 'all'
      ? userPedals
      : userPedals.filter((up) => up.status === activeTab)

  const counts = TABS.reduce(
    (acc, tab) => {
      acc[tab.value] =
        tab.value === 'all'
          ? userPedals.length
          : userPedals.filter((up) => up.status === tab.value).length
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <main className="min-h-screen bg-[#f5f1ea] flex justify-center overflow-x-hidden">
      <div className="w-full max-w-md px-6 py-4">

        {/* HEADER */}
        <div className="sticky top-0 z-10 bg-[#f5f1ea] pb-4 mb-4">
          <img
            src="https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/logo/patchlogo.png"
            alt="Patchlog"
            className="w-[92%] mx-auto object-contain mb-5 pt-4"
          />

          <div className="flex items-start justify-between mb-4 gap-3">
            <div className="min-w-0">
              <h1 className="text-3xl font-serif font-medium text-[#26211d] leading-none mb-2">
                My Collection
              </h1>
              <p className="text-[#5b544c] text-base">
                {userPedals.length} {userPedals.length === 1 ? 'pedal' : 'pedals'}
              </p>
            </div>

            <button
              onClick={() => setShareOpen(true)}
              className="flex shrink-0 items-center gap-2 rounded-full border border-[#c8beb1] bg-[#faf7f2] px-4 py-2 text-sm text-[#5b544c] transition-colors hover:bg-[#f3efe8]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Share
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => {
              const active = activeTab === tab.value
              const isSell = tab.value === 'sell'

              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? isSell
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/30'
                        : 'bg-[#26211d] text-[#f8f5ef]'
                      : isSell
                        ? 'border border-amber-300 bg-[#fff8ec] text-amber-700 hover:bg-amber-50'
                        : 'bg-[#f3efe8] border border-[#ddd7ce] text-[#5b544c] hover:bg-[#ebe6df]'
                  }`}
                >
                  {tab.label}
                  {counts[tab.value] > 0 && (
                    <span className="ml-1.5 opacity-70">{counts[tab.value]}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* GRID */}
        {filtered.length === 0 ? (
          <EmptyState activeTab={activeTab} />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((up) => {
              if (!up.pedals) return null
              const pedal = up.pedals
              return (
                <Link
                  key={`${pedal.id}-${up.status}`}
                  href={`/pedal/${pedal.slug}`}
                  className="block"
                >
                  <div className="bg-[#faf7f2] rounded-[2rem] p-4 border border-[#ebe6df] hover:border-[#c8beb1] transition-colors">
                    {/* Image */}
                    <div className="relative bg-[#f3efe8] rounded-[1.5rem] h-32 flex items-center justify-center mb-4 overflow-hidden">
                      {pedal.image_url ? (
                        <img
                          src={pedal.image_url}
                          alt={pedal.name}
                          className="h-28 w-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-[#c8beb1]"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      )}

                      <span
                        className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[up.status]}`}
                      >
                        {STATUS_LABELS[up.status]}
                      </span>
                    </div>

                    {/* Info */}
                    <p className="text-[10px] uppercase tracking-[0.25em] text-[#8a7e72] mb-1 truncate">
                      {pedal.brand?.name ?? '—'}
                    </p>
                    <h2 className="text-lg font-serif font-medium text-[#26211d] leading-snug truncate">
                      {pedal.name}
                    </h2>
                    {(pedal.type || pedal.subtype) && (
                      <p className="mt-1 text-[11px] text-[#8a7e72] truncate">
                        {[pedal.type?.name, pedal.subtype?.name]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* BOTTOM NAV */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#f5f1ea]/95 backdrop-blur border-t border-[#e8e1d8]">
          <div className="max-w-md mx-auto flex justify-around py-3 text-sm">
            <Link href="/discover" className="flex flex-col items-center gap-0.5 text-[#8a7e72]">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <span className="text-[10px] uppercase tracking-widest">Discover</span>
            </Link>
            <Link href="/collection" className="flex flex-col items-center gap-0.5 text-[#26211d] font-medium">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
              <span className="text-[10px] uppercase tracking-widest">Collection</span>
            </Link>
          </div>
        </div>

        <div className="h-24" />
      </div>

      {/* Share Modal */}
      {shareOpen && (
        <ShareModal
          username={username}
          onClose={() => setShareOpen(false)}
        />
      )}
    </main>
  )
}

function EmptyState({ activeTab }: { activeTab: Status | 'all' }) {
  const messages: Record<Status | 'all', { title: string; body: string }> = {
    all: {
      title: 'No pedals yet',
      body: 'Start adding pedals from the catalog.',
    },
    have: {
      title: 'Nothing marked as Have',
      body: 'Mark pedals you own from the catalog or a pedal page.',
    },
    had: {
      title: 'Nothing marked as Had',
      body: 'Pedals you used to own will appear here.',
    },
    want: {
      title: 'No wishlist yet',
      body: 'Mark pedals you want to keep track of them.',
    },
    sell: {
      title: 'Nothing listed for sale',
      body: 'Mark pedals as For Sale to share them with others.',
    },
  }

  const { title, body } = messages[activeTab]

  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#ddd7ce] bg-[#faf7f2]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[#c8beb1]"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      </div>
      <p className="text-sm font-medium text-[#26211d]">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-[#8a7e72]">{body}</p>
      {activeTab === 'all' && (
        <Link
          href="/discover"
          className="mt-4 rounded-full border border-[#c8beb1] bg-[#faf7f2] px-4 py-2 text-xs text-[#5b544c] transition-colors hover:bg-[#f3efe8]"
        >
          Browse catalog
        </Link>
      )}
    </div>
  )
}
