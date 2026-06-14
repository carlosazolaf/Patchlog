'use client'

import { useState } from 'react'
import Link from 'next/link'

type Tab = 'collection' | 'forsale'

type Props = {
  username: string | null
  onClose: () => void
}

export default function ShareModal({ username, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('collection')
  const [copied, setCopied] = useState(false)

  const base = typeof window !== 'undefined' ? window.location.origin : 'https://patchlog-one.vercel.app'

  const urls: Record<Tab, string> = {
    collection: `${base}/u/${username}`,
    forsale: `${base}/u/${username}?filter=sell`,
  }

  const url = urls[activeTab]

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank')
  }

  const shareTwitter = () => {
    const text = activeTab === 'collection'
      ? `Check out my pedal collection on Patchlog`
      : `Check out my pedals for sale on Patchlog`
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-2xl border border-[#e7dfd3] bg-[#faf7f2] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#26211d]">Share</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8a7e72] transition-colors hover:bg-[#f3efe8] hover:text-[#26211d]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-1 rounded-xl border border-[#e7dfd3] bg-[#f3efe8] p-1">
          {([
            { value: 'collection', label: 'Collection' },
            { value: 'forsale', label: 'For Sale' },
          ] as { value: Tab; label: string }[]).map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); setCopied(false) }}
              className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? 'bg-[#faf7f2] text-[#26211d] shadow-sm'
                  : 'text-[#8a7e72] hover:text-[#5b544c]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* URL display */}
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#e7dfd3] bg-[#f3efe8] px-3 py-2.5">
          <span className="min-w-0 flex-1 truncate text-xs text-[#5b544c]">
            {username ? url : 'Set a username to share your profile'}
          </span>
          <button
            onClick={handleCopy}
            disabled={!username}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              copied
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-[#26211d] text-[#f8f5ef] hover:bg-[#3a342e]'
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Share buttons */}
        <div className="flex gap-2">
          <button
            onClick={shareWhatsApp}
            disabled={!username}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#ddd7ce] bg-[#f3efe8] py-2.5 text-sm text-[#5b544c] transition-colors hover:border-[#c8beb1] hover:text-[#26211d] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </button>
          <button
            onClick={shareTwitter}
            disabled={!username}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#ddd7ce] bg-[#f3efe8] py-2.5 text-sm text-[#5b544c] transition-colors hover:border-[#c8beb1] hover:text-[#26211d] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.736l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            X / Twitter
          </button>
        </div>

        {!username && (
          <p className="mt-3 text-center text-xs text-[#8a7e72]">
            Add a username in{' '}
            <Link href="/settings" className="underline underline-offset-2 hover:text-[#26211d]">
              settings
            </Link>{' '}
            to share your profile.
          </p>
        )}
      </div>
    </>
  )
}
