'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PedalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const pedalId = Number(params.slug)

  const [pedal, setPedal] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPedalDetail() {
      if (!pedalId) return
      
      const { data } = await supabase
        .from('pedals')
        .select('*')
        .eq('pedal_id', pedalId)
        .single()

      setPedal(data)
      setLoading(false)
    }

    fetchPedalDetail()
  }, [pedalId])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f1ea] flex items-center justify-center">
        <p className="text-[#5b544c] font-serif animate-pulse">Loading pedal...</p>
      </main>
    )
  }

  if (!pedal) {
    return (
      <main className="min-h-screen bg-[#f5f1ea] flex items-center justify-center">
        <div className="text-[#4f4942]">Pedal not found</div>
      </main>
    )
  }

  const imageUrl = `https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/pedal_images/${pedal.image_path}`

  return (
    <main className="min-h-screen bg-[#f5f1ea] flex justify-center overflow-x-hidden pb-24">
      <div className="w-full max-w-md px-6 py-4">
        
        {/* BOTÓN BACK CORREGIDO */}
        <div className="mb-6">
          <button
            onClick={(e) => {
              e.preventDefault()
              router.back()
            }}
            className="cursor-pointer text-sm text-[#6f675d] hover:underline bg-transparent border-none p-0 font-sans"
          >
            ← Back
          </button>
        </div>

        {/* DETALLE DEL PEDAL */}
        <div className="bg-[#faf7f2] rounded-[2.5rem] p-6 border border-[#ebe6df] mb-6">
          <div className="bg-[#f3efe8] rounded-[2rem] h-64 flex items-center justify-center mb-6">
            <img src={imageUrl} alt={pedal.name} className="h-48 object-contain" />
          </div>
          
          <p className="text-xs uppercase tracking-[0.25em] text-[#8b8175] mb-2">
            {pedal.brand_name || 'Brand'}
          </p>
          <h1 className="text-4xl font-serif font-medium text-[#26211d] leading-tight mb-4">
            {pedal.name}
          </h1>
          <p className="text-[#5c544c] text-sm leading-relaxed mb-6">
            {pedal.description || 'No description available.'}
          </p>
        </div>

        {/* ESPECIFICACIONES TÉCNICAS */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-6 px-2 text-sm border-t border-[#ebe6df] pt-6">
          <div>
            <p className="text-xs text-[#8b8175] mb-1">Dimensions</p>
            <p className="text-[#3d3935]">
              {pedal.w_mm || '—'} x {pedal.l_mm || '—'} x {pedal.h_mm || '—'} mm
            </p>
          </div>

          <div>
            <p className="text-xs text-[#8b8175] mb-1">Stereo</p>
            <p className="text-[#3d3935] capitalize">
              {pedal.stereo ? 'Yes' : 'No'}
            </p>
          </div>

          <div>
            <p className="text-xs text-[#8b8175] mb-1">Analog / Digital</p>
            <p className="text-[#3d3935] capitalize">
              {pedal.analog_digital || 'Unknown'}
            </p>
          </div>

          <div>
            <p className="text-xs text-[#8b8175] mb-1">Release Year</p>
            <p className="text-[#3d3935]">
              {pedal.release_year || '—'}
            </p>
          </div>
        </div>

        {/* NAV FIJA INFERIOR */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#f5f1ea]/95 backdrop-blur border-t border-[#e8e1d8]">
          <div className="max-w-md mx-auto flex justify-around py-4 text-sm">
            <Link href="/discover" className="cursor-pointer text-[#26211d] font-medium">
              Discover
            </Link>
            <Link href="/collection" className="cursor-pointer text-[#8c8479]">
              Collection
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}
