'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

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

// ─── Component ─────────────────────────────────────────────────────────────────

interface Props {
  pedalId: number
  initialStatus: string
}

export default function StatusButtons({ pedalId, initialStatus }: Props) {
  const [status, setStatus]   = useState(initialStatus)
  const [saving, setSaving]   = useState<string | null>(null)
  const [toast, setToast]     = useState({ message: '', visible: false })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message: msg, visible: true })
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      2000
    )
  }

  async function handleStatus(newStatus: string) {
    setSaving(newStatus)

    const { data: existing } = await supabase
      .from('user_pedals')
      .select('*')
      .eq('pedal_id', pedalId)
      .maybeSingle()

    if (existing) {
      if (existing.status === newStatus) {
        // Toggle off
        await supabase.from('user_pedals').delete().eq('pedal_id', pedalId)
        setStatus('')
        showToast('Removed from collection')
      } else {
        await supabase.from('user_pedals').update({ status: newStatus }).eq('pedal_id', pedalId)
        setStatus(newStatus)
        showToast(`Moved to "${newStatus}"`)
      }
    } else {
      await supabase.from('user_pedals').insert({ pedal_id: pedalId, status: newStatus })
      setStatus(newStatus)
      showToast(`Added to "${newStatus}"`)
    }

    setSaving(null)
  }

  const LABELS: Record<string, string> = {
    have: 'have',
    had: 'had',
    want: 'want',
    sell: 'for sale',
  }

  return (
    <>
      <div className="flex gap-2">
        {(['have', 'had', 'want', 'sell'] as const).map((s) => {
          const active    = status === s
          const isSaving  = saving === s
          const isSell    = s === 'sell'

          return (
            <button
              key={s}
              disabled={!!saving}
              onClick={() => handleStatus(s)}
              className={`flex-1 py-3.5 rounded-full text-sm font-medium capitalize transition-all duration-200 ${
                active
                  ? isSell
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30 scale-[0.97]'
                    : 'bg-[#26211d] text-[#f8f5ef] scale-[0.97]'
                  : isSell
                    ? 'border border-amber-300 bg-[#fff8ec] text-amber-700 hover:bg-amber-50'
                    : 'bg-[#faf7f2] border border-[#c8beb1] text-[#26211d] hover:bg-[#f3efe8]'
              } ${isSaving ? 'opacity-50' : ''}`}
            >
              {isSaving ? '···' : active ? `✓ ${LABELS[s]}` : LABELS[s]}
            </button>
          )
        })}
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </>
  )
}
