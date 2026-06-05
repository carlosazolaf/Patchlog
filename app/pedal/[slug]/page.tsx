'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PedalDetail {
  pedal_id: number
  name: string
  brand_id: number
  type_id: number
  subtype_id: number
  image_path: string
  description?: string
  year?: number
  controls?: string
  true_bypass?: boolean
  brand_name: string
  type_name: string
  subtype_name: string
  status: string
}

// ─── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-[#26211d] text-[#f8f5ef] text-sm font-medium shadow-lg transition-all duration-300 whitespace-nowrap ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      {message}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PedalSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Image area */}
      <div className="bg-[#ede9e2] h-72 rounded-[2rem] mb-8 mx-6" />
      <div className="px-6">
        <div className="h-3 bg-[#ede9e2] rounded w-24 mb-3" />
        <div className="h-8 bg-[#ede9e2] rounded w-3/4 mb-2" />
        <div className="h-4 bg-[#ede9e2] rounded w-1/2 mb-8" />
        <div className="flex gap-2 mb-8">
          <div className="h-10 w-20 bg-[#ede9e2] rounded-full" />
          <div className="h-10 w-16 bg-[#ede9e2] rounded-full" />
          <div className="h-10 w-20 bg-[#ede9e2] rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-[#ede9e2] rounded w-full" />
          <div className="h-4 bg-[#ede9e2] rounded w-5/6" />
          <div className="h-4 bg-[#ede9e2] rounded w-4/6" />
        </div>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PedalDetailPage() {
  const router = useRouter()
  const params = useParams()
  const pedalId = Number(params?.id)

  const [pedal, setPedal]   = useState<PedalDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast]   = useState({ message: '', visible: false })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Where to go back to
  const backRoute =
    typeof window !== 'undefined'
      ? (sessionStorage.getItem('pedal_back') === 'collection' ? '/collection' : '/discover')
      : '/discover'

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!pedalId) return
    fetchPedal()
  }, [pedalId])

  async function fetchPedal() {
    setLoading(true)

    const [pedalRes, brandsRes, typesRes, subtypesRes, userPedalRes] = await Promise.all([
      supabase.from('pedals').select('*').eq('pedal_id', pedalId).single(),
      supabase.from('brand').select('*'),
      supabase.from('type').select('*'),
      supabase.from('subtype').select('*'),
      supabase.from('user_pedals').select('*').eq('pedal_id', pedalId).maybeSingle(),
    ])

    if (!pedalRes.data) { setLoading(false); return }

    const p = pedalRes.data
    setPedal({
      ...p,
      brand_name:   brandsRes.data?.find((b) => Number(b.brand_id)   === Number(p.brand_id))?.brand    || '',
      type_name:    typesRes.data?.find((t)  => Number(t.type_id)    === Number(p.type_id))?.type      || '',
      subtype_name: subtypesRes.data?.find((s) => Number(s.subtype_id) === Number(p.subtype_id))?.subtype || '',
      status:       userPedalRes.data?.status || '',
    })
    setLoading(false)
  }

  // ── Toast helper ───────────────────────────────────────────────────────────

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message: msg, visible: true })
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000)
  }

  // ── Status ─────────────────────────────────────────────────────────────────

  async function setStatus(status: string) {
    if (!pedal) return
    setSaving(status)

    const { data: existing } = await supabase
      .from('user_pedals')
      .select('*')
      .eq('pedal_id', pedalId)
      .maybeSingle()

    if (existing) {
      if (existing.status === status) {
        await supabase.from('user_pedals').delete().eq('pedal_id', pedalId)
        showToast('Removed from collection')
        setPedal((prev) => prev ? { ...prev, status: '' } : prev)
      } else {
        await supabase.from('user_pedals').update({ status }).eq('pedal_id', pedalId)
        showToast(`Moved to "${status}"`)
        setPedal((prev) => prev ? { ...prev, status } : prev)
      }
    } else {
      await supabase.from('user_pedals').insert({ pedal_id: pedalId, status })
      showToast(`Added to "${status}"`)
      setPedal((prev) => prev ? { ...prev, status } : prev)
    }

    setSaving(null)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f1ea] flex justify-center">
        <div className="w-full max-w-md py-6">
          {/* Back button placeholder */}
          <div className="px-6 mb-6">
            <div className="h-8 w-8 bg-[#ede9e2] rounded-full animate-pulse" />
          </div>
          <PedalSkeleton />
        </div>
      </main>
    )
  }

  if (!pedal) {
    return (
      <main className="min-h-screen bg-[#f5f1ea] flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-4xl mb-4">🎛</p>
          <p className="text-[#26211d] font-serif text-xl mb-2">Pedal not found</p>
          <button
            onClick={() => router.push('/discover')}
            className="text-[#5b544c] text-sm underline underline-offset-2"
          >
            ← Back to Discover
          </button>
        </div>
      </main>
    )
  }

  const imageUrl = `https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/pedal_images/${pedal.image_path}`

  return (
    <main className="min-h-screen bg-[#f5f1ea] flex justify-center">
      <div className="w-full max-w-md">

        {/* BACK BUTTON */}
        <div className="px-6 pt-6 pb-2 sticky top-0 z-10 bg-[#f5f1ea]">
          <button
            onClick={() => router.push(backRoute)}
            className="flex items-center gap-2 text-sm text-[#5b544c] hover:text-[#26211d] transition-colors"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back
          </button>
        </div>

        {/* HERO IMAGE */}
        <div className="mx-6 mt-4 mb-8 bg-[#f3efe8] rounded-[2rem] h-72 flex items-center justify-center overflow-hidden">
          <img
            src={imageUrl}
            alt={pedal.name}
            className="h-56 w-full object-contain"
          />
        </div>

        {/* CONTENT */}
        <div className="px-6">
          {/* Brand */}
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#8a7e72] mb-2">
            {pedal.brand_name}
          </p>

          {/* Name */}
          <h1 className="text-4xl font-serif font-medium text-[#26211d] leading-tight mb-2">
            {pedal.name}
          </h1>

          {/* Type chips */}
          <div className="flex items-center gap-2 mb-6">
            {pedal.type_name && (
              <span className="text-xs px-3 py-1 bg-[#f3efe8] border border-[#ddd7ce] rounded-full text-[#5b544c]">
                {pedal.type_name}
              </span>
            )}
            {pedal.subtype_name && (
              <span className="text-xs px-3 py-1 bg-[#f3efe8] border border-[#ddd7ce] rounded-full text-[#8a7e72]">
                {pedal.subtype_name}
              </span>
            )}
            {pedal.year && (
              <span className="text-xs px-3 py-1 bg-[#f3efe8] border border-[#ddd7ce] rounded-full text-[#8a7e72]">
                {pedal.year}
              </span>
            )}
          </div>

          {/* STATUS BUTTONS */}
          <div className="flex gap-2 mb-8">
            {(['have', 'had', 'want'] as const).map((s) => {
              const active = pedal.status === s
              const isSaving = saving === s
              return (
                <button
                  key={s}
                  disabled={!!saving}
                  onClick={() => setStatus(s)}
                  className={`cursor-pointer flex-1 py-3 rounded-full text-sm font-medium capitalize transition-all duration-200 ${
                    active
                      ? 'bg-[#26211d] text-[#f8f5ef] scale-[0.97]'
                      : 'bg-[#faf7f2] border border-[#c8beb1] text-[#26211d] hover:bg-[#f3efe8]'
                  } ${isSaving ? 'opacity-50' : ''}`}
                >
                  {isSaving ? '···' : (active ? `✓ ${s}` : s)}
                </button>
              )
            })}
          </div>

          {/* DESCRIPTION */}
          {pedal.description && (
            <div className="mb-8">
              <h2 className="text-xs uppercase tracking-[0.2em] text-[#8a7e72] mb-3">About</h2>
              <p className="text-[15px] text-[#3a342e] leading-relaxed">{pedal.description}</p>
            </div>
          )}

          {/* SPECS */}
          {(pedal.controls || pedal.true_bypass !== undefined) && (
            <div className="mb-8">
              <h2 className="text-xs uppercase tracking-[0.2em] text-[#8a7e72] mb-3">Specs</h2>
              <div className="bg-[#faf7f2] border border-[#ebe6df] rounded-2xl divide-y divide-[#ebe6df]">
                {pedal.controls && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-sm text-[#5b544c]">Controls</span>
                    <span className="text-sm text-[#26211d] font-medium">{pedal.controls}</span>
                  </div>
                )}
                {pedal.true_bypass !== undefined && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-sm text-[#5b544c]">True Bypass</span>
                    <span className="text-sm text-[#26211d] font-medium">{pedal.true_bypass ? 'Yes' : 'No'}</span>
                  </div>
                )}
                {pedal.brand_name && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-sm text-[#5b544c]">Brand</span>
                    <span className="text-sm text-[#26211d] font-medium">{pedal.brand_name}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-12" />
      </div>

      {/* TOAST */}
      <Toast message={toast.message} visible={toast.visible} />
    </main>
  )
}
