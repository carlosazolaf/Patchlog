'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import UserBadge from '@/app/components/UserBadge'

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

interface Brand  { brand_id: number; brand: string }
interface Type   { type_id: number; type: string }
interface Subtype { subtype_id: number; subtype: string }

type StatusKey = 'all' | 'have' | 'had' | 'want' | 'sell'

const STATUS_LABELS: Record<StatusKey, string> = {
  all: 'all',
  have: 'have',
  had: 'had',
  want: 'want',
  sell: 'for sale',
}

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
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-[#26211d] text-[#f8f5ef] text-sm font-medium shadow-lg transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      {message}
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function readFilters() {
  if (typeof window === 'undefined') return {}
  try {
    const f = sessionStorage.getItem('discover_filters')
    return f ? JSON.parse(f) : {}
  } catch { return {} }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const router = useRouter()
  const restoredRef = useRef(false)

  const [pedals, setPedals]         = useState<Pedal[]>([])
  const [userPedals, setUserPedals] = useState<any[]>([])
  const [brands, setBrands]         = useState<Brand[]>([])
  const [types, setTypes]           = useState<Type[]>([])
  const [subtypes, setSubtypes]     = useState<Subtype[]>([])
  const [loading, setLoading]       = useState(true)
  const [counts, setCounts]         = useState<Record<StatusKey, number>>({ all: 0, have: 0, had: 0, want: 0, sell: 0 })
  const [pendingScroll, setPendingScroll] = useState<number | null>(null)

  // Toast
  const [toast, setToast]           = useState({ message: '', visible: false })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Button loading state — tracks which pedal+status combo is saving
  const [saving, setSaving]         = useState<string | null>(null)

  // Filters — seeded from sessionStorage synchronously
  const init = readFilters()
  const [brandFilter,   setBrandFilter]   = useState<string>(init.brand   ?? 'all')
  const [modelFilter,   setModelFilter]   = useState<string>(init.model   ?? 'all')
  const [typeFilter,    setTypeFilter]    = useState<string>(init.type    ?? 'all')
  const [subtypeFilter, setSubtypeFilter] = useState<string>(init.subtype ?? 'all')

  // ── Restore scroll ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    sessionStorage.removeItem('discover_filters')
    const saved = sessionStorage.getItem('discover_scrollY')
    if (saved) {
      sessionStorage.removeItem('discover_scrollY')
      setPendingScroll(parseInt(saved))
    }
  }, [])

  useEffect(() => {
    if (pendingScroll === null || pedals.length === 0) return
    // Small timeout as a safety net if layout hasn't settled
    const t = setTimeout(() => {
      window.scrollTo({ top: pendingScroll, behavior: 'instant' })
      setPendingScroll(null)
    }, 80)
    return () => clearTimeout(t)
  }, [pedals, pendingScroll])

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    // Run all independent queries in parallel
    const [brandsRes, typesRes, subtypesRes, userPedalsRes] = await Promise.all([
      supabase.from('brand').select('*').order('brand', { ascending: true }),
      supabase.from('type').select('*').order('type', { ascending: true }),
      supabase.from('subtype').select('*').order('subtype', { ascending: true }),
      supabase.from('user_pedals').select('*'),
    ])

    let pedalsQuery = supabase
      .from('pedals')
      .select('*')
      .order('name', { ascending: true })
      .limit(300)

    if (brandFilter   !== 'all') pedalsQuery = pedalsQuery.eq('brand_id',   brandFilter)
    if (modelFilter   !== 'all') pedalsQuery = pedalsQuery.eq('pedal_id',   modelFilter)
    if (typeFilter    !== 'all') pedalsQuery = pedalsQuery.eq('type_id',    typeFilter)
    if (subtypeFilter !== 'all') pedalsQuery = pedalsQuery.eq('subtype_id', subtypeFilter)

    const { data: pedalsData } = await pedalsQuery

    const brandsData    = brandsRes.data    || []
    const typesData     = typesRes.data     || []
    const subtypesData  = subtypesRes.data  || []
    // Only this user's collection statuses — Discover shows the full catalog,
    // but per-card status badges must reflect the signed-in user only.
    const myUserPedals = (userPedalsRes.data || []).filter((p) => p.user_id === user?.id)

    const enriched: Pedal[] = (pedalsData || []).map((pedal) => ({
      ...pedal,
      brand_name:   brandsData.find((b) => Number(b.brand_id)   === Number(pedal.brand_id))?.brand    || '',
      type_name:    typesData.find((t)  => Number(t.type_id)    === Number(pedal.type_id))?.type      || '',
      subtype_name: subtypesData.find((s) => Number(s.subtype_id) === Number(pedal.subtype_id))?.subtype || '',
      status:       myUserPedals.find((u) => Number(u.pedal_id) === Number(pedal.pedal_id))?.status || '',
    }))

    setPedals(enriched)
    setUserPedals(myUserPedals)
    setBrands(brandsData)
    setTypes([
      ...new Map(enriched.map((p) => [p.type_id, { type_id: p.type_id, type: p.type_name }])).values(),
    ])
    setSubtypes([
      ...new Map(enriched.map((p) => [p.subtype_id, { subtype_id: p.subtype_id, subtype: p.subtype_name }])).values(),
    ])
    setCounts({
      all:  myUserPedals.length,
      have: myUserPedals.filter((p) => p.status === 'have').length,
      had:  myUserPedals.filter((p) => p.status === 'had').length,
      want: myUserPedals.filter((p) => p.status === 'want').length,
      sell: myUserPedals.filter((p) => p.status === 'sell').length,
    })

    setLoading(false)
  }, [brandFilter, modelFilter, typeFilter, subtypeFilter])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Toast helper ───────────────────────────────────────────────────────────

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message: msg, visible: true })
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000)
  }

  // ── Set status ─────────────────────────────────────────────────────────────

  async function setStatus(pedalId: number, status: string) {
    const key = `${pedalId}-${status}`
    setSaving(key)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      showToast('Sign in to save pedals to your collection')
      setSaving(null)
      return
    }

    const existing = userPedals.find((p) => Number(p.pedal_id) === Number(pedalId))
    let error = null

    if (existing) {
      if (existing.status === status) {
        ;({ error } = await supabase.from('user_pedals').delete().eq('pedal_id', pedalId).eq('user_id', user.id))
        if (!error) showToast('Removed from Collection')
      } else {
        ;({ error } = await supabase.from('user_pedals').update({ status }).eq('pedal_id', pedalId).eq('user_id', user.id))
        if (!error) showToast(`Moved to "${status}"`)
      }
    } else {
      ;({ error } = await supabase.from('user_pedals').insert({ pedal_id: pedalId, status, user_id: user.id }))
      if (!error) showToast(`Added to "${status}"`)
    }

    if (error) {
      console.error(error)
      showToast('Something went wrong — try again')
    }

    setSaving(null)
    fetchData()
  }

  // ── Models dropdown (sorted by name) ──────────────────────────────────────

  const models = useMemo(() =>
    [...pedals].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
  [pedals])

  // ── Navigate to detail ─────────────────────────────────────────────────────

  function goToPedal(pedalId: number) {
    sessionStorage.setItem('discover_scrollY', window.scrollY.toString())
    sessionStorage.setItem('discover_filters', JSON.stringify({
      brand: brandFilter, model: modelFilter, type: typeFilter, subtype: subtypeFilter,
    }))
    sessionStorage.setItem('pedal_back', 'discover')
    router.push(`/pedal/${pedalId}`)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#f5f1ea] flex justify-center overflow-x-hidden">
      <div className="w-full max-w-md px-6 py-4">

        {/* HEADER */}
        <div className="sticky top-0 z-10 bg-[#f5f1ea] pb-4 mb-4">
          <Link href="/discover">
            <img
              src="https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/logo/patchlogo.png"
              alt="Patchlog"
              className="w-[92%] mx-auto object-contain mb-5 pt-4"
            />
          </Link>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-3xl font-serif font-medium text-[#26211d] leading-none">
              Discover
            </h1>
            <UserBadge />
          </div>
          <p className="text-[#5b544c] text-base mb-4">
            Explore the world of pedals.
          </p>

          {/* Status chips — informational only; styled differently from filter buttons */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'have', 'had', 'want', 'sell'] as StatusKey[]).map((s) => (
              <div
                key={s}
                className={`px-3 py-2 rounded-full text-xs font-medium capitalize ${
                  s === 'sell'
                    ? 'bg-[#fff3df] border border-amber-200 text-amber-700'
                    : 'bg-[#f3efe8] border border-[#ddd7ce] text-[#5b544c]'
                }`}
              >
                {STATUS_LABELS[s]} <span className={`font-semibold ${s === 'sell' ? 'text-amber-700' : 'text-[#26211d]'}`}>{counts[s]}</span>
              </div>
            ))}
          </div>
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
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : pedals.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🎛</p>
            <p className="text-[#26211d] font-serif text-xl mb-2">No pedals found</p>
            <p className="text-[#5b544c] text-sm">Try adjusting your filters.</p>
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
                      {(['have', 'had', 'want', 'sell'] as const).map((s) => {
                        const active = pedal.status === s
                        const isSaving = saving === `${pedal.pedal_id}-${s}`
                        const isSell = s === 'sell'
                        return (
                          <button
                            key={s}
                            disabled={!!saving}
                            onClick={() => setStatus(pedal.pedal_id, s)}
                            className={`cursor-pointer text-xs font-medium px-3 py-1.5 rounded-full capitalize transition-all duration-150 ${
                              active
                                ? isSell
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/30 scale-95'
                                  : 'bg-[#26211d] text-[#f8f5ef] scale-95'
                                : isSell
                                  ? 'border border-amber-300 bg-[#fff8ec] text-amber-700 hover:bg-amber-50'
                                  : 'bg-[#faf7f2] border border-[#c8beb1] text-[#26211d] hover:bg-[#f3efe8]'
                            } ${isSaving ? 'opacity-50' : ''}`}
                          >
                            {isSaving ? '···' : (active ? `✓ ${STATUS_LABELS[s]}` : STATUS_LABELS[s])}
                          </button>
                        )
                      })}
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
            <Link href="/discover" className="flex flex-col items-center gap-0.5 text-[#26211d] font-medium">
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
          </div>
        </div>

        <div className="h-24" />
      </div>

      {/* TOAST */}
      <Toast message={toast.message} visible={toast.visible} />
    </main>
  )
}
