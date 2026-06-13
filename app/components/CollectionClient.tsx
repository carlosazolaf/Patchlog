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
  have: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  had: 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/20',
  want: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  sell: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              My Collection
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {userPedals.length}{' '}
              {userPedals.length === 1 ? 'pedal' : 'pedals'}
            </p>
          </div>

          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
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

        {/* Tabs */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
              {counts[tab.value] > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs ${
                    activeTab === tab.value
                      ? 'bg-zinc-700 text-zinc-300'
                      : 'bg-zinc-800 text-zinc-600'
                  }`}
                >
                  {counts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <EmptyState activeTab={activeTab} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((up) => {
              if (!up.pedals) return null
              const pedal = up.pedals
              return (
                <Link
                  key={`${pedal.id}-${up.status}`}
                  href={`/pedal/${pedal.slug}`}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700"
                >
                  {/* Imagen */}
                  <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-800">
                    {pedal.image_url ? (
                      <img
                        src={pedal.image_url}
                        alt={pedal.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-zinc-700"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs text-zinc-500">
                          {pedal.brand?.name ?? '—'}
                        </p>
                        <p className="truncate text-sm font-medium text-zinc-100">
                          {pedal.name}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[up.status]}`}
                      >
                        {STATUS_LABELS[up.status]}
                      </span>
                    </div>

                    {(pedal.type || pedal.subtype) && (
                      <p className="mt-1.5 text-xs text-zinc-600">
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
      </div>

      {/* Share Modal */}
      {shareOpen && (
        <ShareModal
          username={username}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
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
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
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
          className="text-zinc-600"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      </div>
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-zinc-600">{body}</p>
      {activeTab === 'all' && (
        <Link
          href="/discover"
          className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
        >
          Browse catalog
        </Link>
      )}
    </div>
  )
}
