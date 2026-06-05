'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Pedal {
  pedal_id: number
  name: string
  brand_id: number
  type_id: number
  subtype_id: number
  image_path: string
  brand_name: string
  type_name: string
  subtype_name: string
  status: string
}

interface Brand   { brand_id: number; brand: string }
interface Type    { type_id: number; type: string }
interface Subtype { subtype_id: number; subtype: string }

type StatusKey = 'all' | 'have' | 'had' | 'want'

// ─── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-[#faf7f2] rounded-[2rem] p-4 border border-[#ebe6df] animate-pulse">
      <div className="bg-[#ede9e2] rounded-[1.5rem] h-44 mb-4" />
      <div className="h-2 bg-[#ede9e2] rounded w-1/2 mb-3" />
      <div className="h-5 bg-[#ede9e2] rounded w-3/4 mb-3" />
      <div className="h-2 bg-[#ede9e2] rounded w-1/3 mb-1" />
      <div className="h-2 bg-[#ede9e2] rounded w-1/4 mb-4" />
      <div className="flex gap-2">
        <div className="h-8 w-14 bg-[#ede9e2] rounded-full" />
        <div className="h-8 w-12 bg-[#ede9e2] rounded-full" />
        <div className="h-8 w-14 bg-[#ede9e2] rounded-full" />
      </div>
    </div>
  )
}

// ─── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-[#26211d] text-[#f8f5ef] text-sm font-medium shadow-lg transition-all duration-300 whitespace-nowrap ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      {message}
    </div>
  )
}

// ─── Share modal ───────────────────────────────────────────────────────────────

function ShareModal({
  counts,
  onClose,
}: {
  counts: Record<StatusKey, number>
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  // Build the shareable URL — assumes /collection/[username] or a public share route
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/share/collection`
      : ''

  const shareText = `🎛 My Patchlog collection: ${counts.have} owned · ${counts.had} past · ${counts.want} on wishlist — ${shareUrl}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older Safari
      const el = document.createElement('textarea')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Patchlog Collection', text: shareText, url: shareUrl })
      } catch { /* user cancelled */ }
    }
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center pb-0"
      onClick={onClose}
    >
      {/* Sheet */}
      <div
        className="w-full max-w-md bg-[#faf7f2] rounded-t-[2rem] p-6 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-[#c8beb1] rounded-full mx-auto mb-6" />

        <h2 className="text-xl font-serif font-medium text-[#26211d] mb-1">
          Share your collection
        </h2>
        <p className="text-sm text-[#5b544c] mb-6">
          Let others see the pedals you've owned, played, and dream of.
        </p>

        {/* Stats summary */}
        <div className="flex gap-3 mb-6">
          {(['have', 'had', 'want'] as const).map((s) => (
            <div key={s} className="flex-1 bg-[#f3efe8] rounded-2xl p-3 text-center">
              <p className="text-xl font-serif font-medium text-[#26211d]">{counts[s]}</p>
              <p className="text-[10px] uppercase tracking-widest text-[#8a7e72] mt-0.5 capitalize">{s}</p>
            </div>
          ))}
        </div>

        {/* Link preview */}
        <div className="flex items-center gap-2 bg-[#f3efe8] border border-[#ddd7ce] rounded-2xl px-4 py-3 mb-4">
          <span className="text-[13px] text-[#5b544c] truncate flex-1">{shareUrl}</span>
          <button
            onClick={copyLink}
            className="shrink-0 text-xs font-medium text-[#26211d] bg-white border border-[#c8beb1] px-3 py-1.5 rounded-full"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        {/* Native share (mobile) */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={nativeShare}
            className="w-full bg-[#26211d] text-[#f8f5ef] rounded-full py-4 text-sm font-medium mb-3"
          >
            Share via…
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full border border-[#c8beb1] text-[#5b544c] rounded-full py-3.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function readFilters() {
  if (typeof window === 'undefined') return {}
  try {
    const f = sessionStorage.getItem('collection_filters')
    return f ? JSON.parse(f) : {}
  } catch { return {} }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CollectionPage() {
  const router = useRouter()
  const restoredRef = useRef(false)

  const [pedals, setPedals]     = useState<Pedal[]>([])
  const [brands, setBrands]     = useState<Brand[]>([])
  const [types, setTypes]       = useState<Type[]>([])
  const [subtypes, setSubtypes] = useState<Subtype[]>([])
  const [loading, setLoading]   = useState(true)
  const [counts, setCounts]     = useState<Record<StatusKey, number>>({ all: 0, have: 0, had: 0, want: 0 })
  const [pendingScroll, setPendingScroll] = useState<number | null>(null)
  const [showShare, setShowShare] = useState(false)
  const [saving, setSaving]     = useState<string | null>(null)

  // Toast
  const [toast, setToast]       = useState({ message: '', visible: false })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Filters — seeded from sessionStorage synchronously
  const init = readFilters()
  const [statusFilter,  setStatusFilter]  = useState<string>(init.status  ?? 'all')
  const [brandFilter,   setBrandFilter]   = useState<string>(init.brand   ?? 'all')
  const [modelFilter,   setModelFilter]   = useState<string>(init.model   ?? 'all')
  const [typeFilter,    setTypeFilter]    = useState<string>(init.type    ?? 'all')
  const [subtypeFilter, setSubtypeFilter] = useState<string>(init.subtype ?? 'all')

  // ── Restore scroll ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    sessionStorage.removeItem('collection_filters')
    const saved = sessionStorage.getItem('collection_scrollY')
    if (saved) {
      sessionStorage.removeItem('collection_scrollY')
      setPendingScroll(parseInt(saved))
    }
  }, [])

  useEffect(() => {
    if (pendingScroll === null || pedals.length === 0) return
    const t = setTimeout(() => {
      window.scrollTo({ top: pendingScroll, behavior: 'instant' })
      setPendingScroll(null)
    }, 80)
    return () => clearTimeout(t)
  }, [pedals, pendingScroll])

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchCollection = useCallback(async () => {
    setLoading(true)

    // Fetch all statuses for counts (unfiltered)
    const { data: allStatuses } = await supabase.from('user_pedals').select('*')
    const allData = allStatuses || []
    setCounts({
      all:  allData.length,
      have: allData.filter((p) => p.status === 'have').length,
      had:  allData.filter((p) => p.status === 'had').length,
      want: allData.filter((p) => p.status === 'want').length,
    })

    // Filtered user_pedals
    let userQuery = supabase.from('user_pedals').select('*')
    if (statusFilter !== 'all') userQuery = userQuery.eq('status', statusFilter)
    const { data: userPedalsData } = await userQuery

    if (!userPedalsData || userPedalsData.length === 0) {
      setPedals([])
      setBrands([])
      setTypes([])
      setSubtypes([])
      setLoading(false)
      return
    }

    const pedalIds = userPedalsData.map((p) => p.pedal_id)

    let pedalsQuery = supabase
      .from('pedals')
      .select('*')
      .in('pedal_id', pedalIds)
      .order('name', { ascending: true })

    if (brandFilter   !== 'all') pedalsQuery = pedalsQuery.eq('brand_id',   brandFilter)
    if (modelFilter   !== 'all') pedalsQuery = pedalsQuery.eq('pedal_id',   modelFilter)
    if (typeFilter    !== 'all') pedalsQuery = pedalsQuery.eq('type_id',    typeFilter)
    if (subtypeFilter !== 'all') pedalsQuery = pedalsQuery.eq('subtype_id', subtypeFilter)

    const [pedalsRes, brandsRes, typesRes, subtypesRes] = await Promise.all([
      pedalsQuery,
      supabase.from('brand').select('*').order('brand', { ascending: true }),
      supabase.from('type').select('*').order('type', { ascending: true }),
      supabase.from('subtype').select('*').order('subtype', { ascending: true }),
    ])

    const brandsData   = brandsRes.data   || []
    const typesData    = typesRes.data    || []
    const subtypesData = subtypesRes.data || []

    const enriched: Pedal[] = (pedalsRes.data || []).map((pedal) => ({
      ...pedal,
      brand_name:   brandsData.find((b) => Number(b.brand_id)   === Number(pedal.brand_id))?.brand    || '',
      type_name:    typesData.find((t)  => Number(t.type_id)    === Number(pedal.type_id))?.type      || '',
      subtype_name: subtypesData.find((s) => Number(s.subtype_id) === Number(pedal.subtype_id))?.subtype || '',
      status:       userPedalsData.find((u) => Number(u.pedal_id) === Number(pedal.pedal_id))?.status || '',
    }))

    setPedals(enriched)
    setBrands([
      ...new Map(enriched.map((p) => [p.brand_id, { brand_id: p.brand_id, brand: p.brand_name }])).values(),
    ])
    setTypes([
      ...new Map(enriched.map((p) => [p.type_id, { type_id: p.type_id, type: p.type_name }])).values(),
    ])
    setSubtypes([
      ...new Map(enriched.map((p) => [p.subtype_id, { subtype_id: p.subtype_id, subtype: p.subtype_name }])).values(),
    ])
    setLoading(false)
  }, [statusFilter, brandFilter, modelFilter, typeFilter, subtypeFilter])

  useEffect(() => { fetchCollection() }, [fetchCollection])

  // ── Toast helper ───────────────────────────────────────────────────────────

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message: msg, visible: true })
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000)
  }

  // ── Status / Remove ────────────────────────────────────────────────────────

  async function moveStatus(pedalId: number, status: string) {
    setSaving(`${pedalId}-${status}`)
    await supabase.from('user_pedals').update({ status }).eq('pedal_id', pedalId)
    showToast(`Moved to "${status}"`)
    setSaving(null)
    fetchCollection()
  }

  async function removePedal(pedalId: number) {
    setSaving(`${pedalId}-remove`)
    await supabase.from('user_pedals').delete().eq('pedal_id', pedalId)
    showToast('Removed from collection')
    setSaving(null)
    fetchCollection()
  }

  // ── Models dropdown ────────────────────────────────────────────────────────

  const models = useMemo(() =>
    [...pedals].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
  [pedals])

  // ── Navigate to detail ─────────────────────────────────────────────────────

  function goToPedal(pedalId: number) {
    sessionStorage.setItem('collection_scrollY', window.scrollY.toString())
    sessionStorage.setItem('collection_filters', JSON.stringify({
      status: statusFilter, brand: brandFilter, model: modelFilter,
      type: typeFilter, subtype: subtypeFilter,
    }))
    sessionStorage.setItem('pedal_back', 'collection')
    router.push(`/pedal/${pedalId}`)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#f5f1ea] flex justify-center overflow-x-hidden">
      <div className="w-full max-w-md px-6 py-4">

        {/* HEADER */}
        <div className="mb-6">
          <img
            src="https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/logo/patchlogo.png"
            alt="Patchlog"
            className="w-[92%] mx-auto object-contain mb-5 pt-2"
          />
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-serif font-medium text-[#26211d] leading-none mb-1">
                Collection
              </h1>
              <p className="text-[#5b544c] text-sm">
                Your personal pedal archive.
              </p>
            </div>

            {/* Share button */}
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#26211d] text-[#f8f5ef] text-xs font-medium mt-1 hover:bg-[#3a342e] transition-colors"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              Share
            </button>
          </div>
        </div>

        {/* STATUS FILTER TABS */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mb-6 -mx-1 px-1">
          {(['all', 'have', 'had', 'want'] as StatusKey[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 cursor-pointer px-4 py-2.5 rounded-full text-sm font-medium capitalize transition-all duration-150 ${
                statusFilter === s
                  ? 'bg-[#26211d] text-[#f8f5ef]'
                  : 'bg-[#faf7f2] border border-[#c8beb1] text-[#26211d] hover:bg-[#f3efe8]'
              }`}
            >
              {s} <span className={statusFilter === s ? 'text-[#c8beb1]' : 'text-[#8a7e72]'}>{counts[s]}</span>
            </button>
          ))}
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <select
            value={brandFilter}
            onChange={(e) => { setBrandFilter(e.target.value); setModelFilter('all'); setTypeFilter('all'); setSubtypeFilter('all') }}
            className="cursor-pointer bg-[#faf7f2] border border-[#c8beb1] rounded-2xl px-4 py-3.5 text-sm text-[#26211d] focus:outline-none focus:ring-2 focus:ring-[#26211d]/20"
          >
            <option value="all">All Brands</option>
            {brands.map((b) => <option key={b.brand_id} value={b.brand_id}>{b.brand}</option>)}
          </select>

          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="cursor-pointer bg-[#faf7f2] border border-[#c8beb1] rounded-2xl px-4 py-3.5 text-sm text-[#26211d] focus:outline-none focus:ring-2 focus:ring-[#26211d]/20"
          >
            <option value="all">All Models</option>
            {models.map((p) => <option key={p.pedal_id} value={p.pedal_id}>{p.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setSubtypeFilter('all') }}
            className="cursor-pointer bg-[#faf7f2] border border-[#c8beb1] rounded-2xl px-4 py-3.5 text-sm text-[#26211d] focus:outline-none focus:ring-2 focus:ring-[#26211d]/20"
          >
            <option value="all">All Types</option>
            {types.map((t) => <option key={t.type_id} value={t.type_id}>{t.type}</option>)}
          </select>

          <select
            value={subtypeFilter}
            onChange={(e) => setSubtypeFilter(e.target.value)}
            className="cursor-pointer bg-[#faf7f2] border border-[#c8beb1] rounded-2xl px-4 py-3.5 text-sm text-[#26211d] focus:outline-none focus:ring-2 focus:ring-[#26211d]/20"
          >
            <option value="all">All Subtypes</option>
            {subtypes.map((s) => <option key={s.subtype_id} value={s.subtype_id}>{s.subtype}</option>)}
          </select>
        </div>

        {/* GRID */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : pedals.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🎛</p>
            <p className="text-[#26211d] font-serif text-xl mb-2">
              {counts.all === 0 ? 'Your collection is empty' : 'No pedals match these filters'}
            </p>
            <p className="text-[#5b544c] text-sm mb-6">
              {counts.all === 0
                ? "Start exploring the catalog and mark pedals as Have, Had, or Want."
                : 'Try adjusting the filters above.'}
            </p>
            {counts.all === 0 && (
              <Link
                href="/discover"
                className="inline-block bg-[#26211d] text-[#f8f5ef] text-sm font-medium px-6 py-3 rounded-full"
              >
                Explore catalog →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {pedals.map((pedal) => {
              const imageUrl = `https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/pedal_images/${pedal.image_path}`
              return (
                <div
                  key={pedal.pedal_id}
                  className="cursor-pointer"
                  onClick={() => goToPedal(pedal.pedal_id)}
                >
                  <div className="bg-[#faf7f2] rounded-[2rem] p-4 border border-[#ebe6df] hover:border-[#c8beb1] transition-colors">
                    {/* Image */}
                    <div className="bg-[#f3efe8] rounded-[1.5rem] h-44 flex items-center justify-center mb-4">
                      <img
                        src={imageUrl}
                        alt={pedal.name}
                        className="h-36 w-full object-contain"
                        loading="lazy"
                      />
                    </div>

                    {/* Brand */}
                    <p className="text-[10px] uppercase tracking-[0.25em] text-[#8a7e72] mb-1">
                      {pedal.brand_name}
                    </p>

                    {/* Name */}
                    <h2 className="text-xl font-serif font-medium text-[#26211d] leading-snug mb-2">
                      {pedal.name}
                    </h2>

                    {/* Type / Subtype */}
                    <div className="mb-4">
                      <p className="text-[13px] text-[#3a342e]">{pedal.type_name}</p>
                      <p className="text-[11px] text-[#8a7e72]">{pedal.subtype_name}</p>
                    </div>

                    {/* Status buttons */}
                    <div
                      className="flex flex-wrap gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(['have', 'had', 'want'] as const).map((s) => {
                        const active = pedal.status === s
                        const isSaving = saving === `${pedal.pedal_id}-${s}`
                        return (
                          <button
                            key={s}
                            disabled={!!saving}
                            onClick={() => moveStatus(pedal.pedal_id, s)}
                            className={`cursor-pointer text-xs font-medium px-3 py-1.5 rounded-full capitalize transition-all duration-150 ${
                              active
                                ? 'bg-[#26211d] text-[#f8f5ef] scale-95'
                                : 'bg-[#faf7f2] border border-[#c8beb1] text-[#26211d] hover:bg-[#f3efe8]'
                            } ${isSaving ? 'opacity-50' : ''}`}
                          >
                            {isSaving ? '···' : (active ? `✓ ${s}` : s)}
                          </button>
                        )
                      })}
                      <button
                        disabled={!!saving}
                        onClick={(e) => { e.stopPropagation(); removePedal(pedal.pedal_id) }}
                        className={`cursor-pointer text-xs font-medium px-3 py-1.5 rounded-full bg-[#fdf0ee] border border-[#f5c9c2] text-[#b84c3e] hover:bg-[#fde8e5] transition-colors ${saving === `${pedal.pedal_id}-remove` ? 'opacity-50' : ''}`}
                      >
                        {saving === `${pedal.pedal_id}-remove` ? '···' : '✕'}
                      </button>
                    </div>
                  </div>
                </div>
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

      {/* SHARE MODAL */}
      {showShare && (
        <ShareModal counts={counts} onClose={() => setShowShare(false)} />
      )}

      {/* TOAST */}
      <Toast message={toast.message} visible={toast.visible} />
    </main>
  )
}
