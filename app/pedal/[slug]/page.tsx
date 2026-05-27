import Link from 'next/link'
import { supabase } from '@/lib/supabase'

/*
  METADATA
*/

export async function generateMetadata({
  params
}: {
  params: Promise<{
    slug: string
  }>
}) {
  const resolvedParams =
    await params

  const pedalId = Number(
    resolvedParams.slug
  )

  const { data: pedal } = await supabase
    .from('pedals')
    .select('name')
    .eq('pedal_id', pedalId)
    .single()

  return {
    title: pedal
      ? `${pedal.name} — Patchlog`
      : 'Patchlog',

    description:
      'Archive and explore guitar pedals.'
  }
}

/*
  PAGE
*/

export default async function PedalDetailPage({
  params
}: {
  params: Promise<{
    slug: string
  }>
}) {
  const resolvedParams =
    await params

  const pedalId = Number(
    resolvedParams.slug
  )

  /*
    PEDAL
  */

  const { data: pedal } = await supabase
    .from('pedals')
    .select('*')
    .eq('pedal_id', pedalId)
    .single()

  /*
    NOT FOUND
  */

  if (!pedal) {
    return (
      <main className="min-h-screen bg-[#f5f1ea] flex items-center justify-center">
        <div className="text-[#4f4942]">
          Pedal not found
        </div>
      </main>
    )
  }

  /*
    BRAND
  */

  const { data: brand } = await supabase
    .from('brand')
    .select('*')
    .eq('brand_id', pedal.brand_id)
    .single()

  /*
    TYPE
  */

  const { data: type } = await supabase
    .from('type')
    .select('*')
    .eq('type_id', pedal.type_id)
    .single()

  /*
    SUBTYPE
  */

  const { data: subtype } =
    await supabase
      .from('subtype')
      .select('*')
      .eq(
        'subtype_id',
        pedal.subtype_id
      )
      .single()

  /*
    COMMUNITY
  */

  const { data: userPedals } =
    await supabase
      .from('user_pedals')
      .select('*')
      .eq('pedal_id', pedal.pedal_id)

  const stats = {
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
  }

  /*
    IMAGE
  */

  const imageUrl = `https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/pedal_images/${pedal.image_path}`

  return (
    <main className="min-h-screen bg-[#f5f1ea] flex justify-center">
      <div className="w-full max-w-md px-5 py-8">
        {/* HEADER */}
        <div className="flex items-center gap-2 mb-8">
          <img
            src="https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/logo/patchlogo.png"
            alt="Patchlog"
            className="w-8 h-8 object-contain"
          />

          <p className="text-sm tracking-[0.35em] uppercase text-[#4f4942]">
            PATCHLOG
          </p>
        </div>

        {/* BACK BUTTON */}
        <div className="mb-8">
          <button
            onClick={(e) => {
              if (typeof window !== 'undefined') {
                window.history.back();
              }
            }}
            className="cursor-pointer text-sm text-[#6f675d] bg-transparent border-none p-0 outline-none select-none text-left font-normal"
          >
            ← Back
          </button>
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
        <p className="text-xs tracking-[0.35em] uppercase text-[#6f675f] mb-3">
          {brand?.brand}
        </p>

        {/* NAME */}
        <h1 className="text-5xl font-serif font-medium text-[#3d3935] leading-none mb-8">
          {pedal.name}
        </h1>

        {/* COMMUNITY */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-[#faf7f2] rounded-2xl p-4 text-center border border-[#e7dfd3]">
            <p className="text-2xl font-serif text-[#3d3935]">
              {stats.have}
            </p>

            <p className="text-xs text-[#6f675d]">
              Have
            </p>
          </div>

          <div className="bg-[#faf7f2] rounded-2xl p-4 text-center border border-[#e7dfd3]">
            <p className="text-2xl font-serif text-[#3d3935]">
              {stats.had}
            </p>

            <p className="text-xs text-[#6f675d]">
              Had
            </p>
          </div>

          <div className="bg-[#faf7f2] rounded-2xl p-4 text-center border border-[#e7dfd3]">
            <p className="text-2xl font-serif text-[#3d3935]">
              {stats.want}
            </p>

            <p className="text-xs text-[#6f675d]">
              Want
            </p>
          </div>
        </div>

        {/* SPECS */}
        <div className="bg-[#faf7f2] rounded-[2rem] p-6 space-y-5 border border-[#e7dfd3]">
          <div>
            <p className="text-xs text-[#8b8175] mb-1">
              Type
            </p>

            <p className="text-[#3d3935]">
              {type?.type || 'Unknown'}
            </p>
          </div>

          <div>
            <p className="text-xs text-[#8b8175] mb-1">
              Subtype
            </p>

            <p className="text-[#3d3935]">
              {subtype?.subtype ||
                'Unknown'}
            </p>
          </div>

          <div>
            <p className="text-xs text-[#8b8175] mb-1">
              Width
            </p>

            <p className="text-[#3d3935]">
              {pedal.w_mm || 'Unknown'} mm
            </p>
          </div>

          <div>
            <p className="text-xs text-[#8b8175] mb-1">
              Height
            </p>

            <p className="text-[#3d3935]">
              {pedal.h_mm || 'Unknown'} mm
            </p>
          </div>

          <div>
            <p className="text-xs text-[#8b8175] mb-1">
              Stereo
            </p>

            <p className="text-[#3d3935]">
              {pedal.stereo ||
                'Unknown'}
            </p>
          </div>

          <div>
            <p className="text-xs text-[#8b8175] mb-1">
              Analog / Digital
            </p>

            <p className="text-[#3d3935]">
              {pedal.analog_digital ||
                'Unknown'}
            </p>
          </div>

          <div>
            <p className="text-xs text-[#8b8175] mb-1">
              Release Year
            </p>

            <p className="text-[#3d3935]">
              {pedal.release_year ||
                'Unknown'}
            </p>
          </div>
        </div>

        {/* NAV */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#f5f1ea]/95 backdrop-blur border-t border-[#e8e1d8]">
          <div className="max-w-md mx-auto flex justify-around py-4 text-sm">
            <Link
              href="/discover"
              className="cursor-pointer text-black font-medium"
            >
              Discover
            </Link>

            <Link
              href="/collection"
              className="cursor-pointer text-[#8c8479]"
            >
              Collection
            </Link>
          </div>
        </div>

        <div className="h-24" />
      </div>
    </main>
  )
}
