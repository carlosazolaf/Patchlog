'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PedalDetailPage({
  params
}: {
  params: {
    slug: string
  }
}) {
  const [pedal, setPedal] =
    useState<any>(null)

  const [stats, setStats] = useState({
    have: 0,
    had: 0,
    want: 0
  })

  useEffect(() => {
    fetchPedal()
  }, [])

  async function fetchPedal() {
    /*
      PEDAL
    */

    const { data: pedalData } =
      await supabase
        .from('pedals')
        .select('*')
        .eq('slug', params.slug)
        .single()

    if (!pedalData) return

    /*
      BRAND
    */

    const { data: brandData } =
      await supabase
        .from('brand')
        .select('*')
        .eq('brand_id', pedalData.brand_id)
        .single()

    /*
      TYPE
    */

    const { data: typeData } =
      await supabase
        .from('type')
        .select('*')
        .eq('type_id', pedalData.type_id)
        .single()

    /*
      SUBTYPE
    */

    const { data: subtypeData } =
      await supabase
        .from('subtype')
        .select('*')
        .eq(
          'subtype_id',
          pedalData.subtype_id
        )
        .single()

    /*
      COMMUNITY STATS
    */

    const { data: userPedals } =
      await supabase
        .from('user_pedals')
        .select('*')
        .eq('pedal_id', pedalData.pedal_id)

    setStats({
      have:
        userPedals?.filter(
          (p) => p.status === 'have'
        ).length || 0,

      had:
        userPedals?.filter(
          (p) => p.status === 'had'
        ).length || 0,

      want:
        userPedals?.filter(
          (p) => p.status === 'want'
        ).length || 0
    })

    /*
      ENRICH
    */

    setPedal({
      ...pedalData,

      brand_name:
        brandData?.brand || '',

      type_name:
        typeData?.type || '',

      subtype_name:
        subtypeData?.subtype || ''
    })
  }

  if (!pedal) {
    return (
      <main className="min-h-screen bg-[#f5f1ea] flex items-center justify-center">
        Loading...
      </main>
    )
  }

  const imageUrl = `https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/pedal_images/${pedal.image_path}`

  return (
    <main className="min-h-screen bg-[#f5f1ea] flex justify-center">
      <div className="w-full max-w-md px-5 py-8">
        {/* BACK */}
        <div className="mb-8">
          <Link
            href="/discover"
            className="text-sm text-[#6f675d]"
          >
            ← Back
          </Link>
        </div>

        {/* IMAGE */}
        <div className="bg-[#f3efe8] rounded-[2rem] h-80 flex items-center justify-center mb-8">
          <img
            src={imageUrl}
            alt={pedal.name}
            className="h-56 object-contain"
          />
        </div>

        {/* BRAND */}
        <p className="text-xs tracking-[0.35em] uppercase text-[#8d857a] mb-3">
          {pedal.brand_name}
        </p>

        {/* NAME */}
        <h1 className="text-5xl font-serif text-[#171717] leading-none mb-8">
          {pedal.name}
        </h1>

        {/* COMMUNITY */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white rounded-2xl p-4 text-center">
            <p className="text-2xl font-serif">
              {stats.have}
            </p>

            <p className="text-xs text-[#6f675d]">
              Have
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 text-center">
            <p className="text-2xl font-serif">
              {stats.had}
            </p>

            <p className="text-xs text-[#6f675d]">
              Had
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 text-center">
            <p className="text-2xl font-serif">
              {stats.want}
            </p>

            <p className="text-xs text-[#6f675d]">
              Want
            </p>
          </div>
        </div>

        {/* SPECS */}
        <div className="bg-white rounded-[2rem] p-6 space-y-4">
          <div>
            <p className="text-xs text-[#8d857a] mb-1">
              Type
            </p>

            <p className="text-[#171717]">
              {pedal.type_name}
            </p>
          </div>

          <div>
            <p className="text-xs text-[#8d857a] mb-1">
              Subtype
            </p>

            <p className="text-[#171717]">
              {pedal.subtype_name}
            </p>
          </div>

          <div>
            <p className="text-xs text-[#8d857a] mb-1">
              Width
            </p>

            <p className="text-[#171717]">
              {pedal.w_mm} mm
            </p>
          </div>

          <div>
            <p className="text-xs text-[#8d857a] mb-1">
              Height
            </p>

            <p className="text-[#171717]">
              {pedal.h_mm} mm
            </p>
          </div>

          <div>
            <p className="text-xs text-[#8d857a] mb-1">
              Stereo
            </p>

            <p className="text-[#171717]">
              {pedal.stereo || 'Unknown'}
            </p>
          </div>

          <div>
            <p className="text-xs text-[#8d857a] mb-1">
              Analog / Digital
            </p>

            <p className="text-[#171717]">
              {pedal.analog_digital ||
                'Unknown'}
            </p>
          </div>

          <div>
            <p className="text-xs text-[#8d857a] mb-1">
              Release Year
            </p>

            <p className="text-[#171717]">
              {pedal.release_year ||
                'Unknown'}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
