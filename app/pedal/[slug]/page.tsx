import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/server'
import BackButton from './BackButton'
import StatusButtons from './StatusButtons'

/*
  METADATA
*/
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params
  const pedalId = Number(resolvedParams.slug)

  const { data: pedal } = await supabase
    .from('pedals')
    .select('name')
    .eq('pedal_id', pedalId)
    .single()

  return {
    title: pedal ? `${pedal.name} — Patchlog` : 'Patchlog',
    description: 'Archive and explore guitar pedals.'
  }
}

/*
  PAGE
*/
export default async function PedalDetailPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params
  const pedalId = Number(resolvedParams.slug)

  /*
    FETCH EN PARALELO — pedal + community stats juntos
  */
  const [
    { data: pedal },
    { data: userPedals }
  ] = await Promise.all([
    supabase.from('pedals').select('*').eq('pedal_id', pedalId).single(),
    supabase.from('user_pedals').select('*').eq('pedal_id', pedalId)
  ])

  /*
    NOT FOUND
  */
  if (!pedal) {
    return (
      <main className="min-h-screen bg-[#f5f1ea] flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-4xl mb-4">🎛</p>
          <p className="font-serif text-2xl text-[#3d3935] mb-2">Pedal not found</p>
          <Link href="/discover" className="text-sm text-[#6f675f] underline underline-offset-2">
            ← Back to Discover
          </Link>
        </div>
      </main>
    )
  }

  /*
    BRAND / TYPE / SUBTYPE EN PARALELO
  */
  const [
    { data: brand },
    { data: type },
    { data: subtype }
  ] = await Promise.all([
    supabase.from('brand').select('*').eq('brand_id', pedal.brand_id).single(),
    supabase.from('type').select('*').eq('type_id', pedal.type_id).single(),
    supabase.from('subtype').select('*').eq('subtype_id', pedal.subtype_id).single()
  ])

  /*
    COMMUNITY STATS
  */
  const stats = {
    have: userPedals?.filter((p) => p.status === 'have').length || 0,
    had:  userPedals?.filter((p) => p.status === 'had').length  || 0,
    want: userPedals?.filter((p) => p.status === 'want').length || 0
  }

  /*
    CURRENT USER STATUS
  */
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  const currentStatus: string = userPedals?.find((p) => p.user_id === user?.id)?.status ?? ''

  /*
    IMAGE
  */
  const imageUrl = `https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/pedal_images/${pedal.image_path}`

  /*
    SPECS — filtra filas sin valor para no mostrar "Unknown" innecesario
  */
  const specs: { label: string; value: string }[] = [
    { label: 'Type',             value: type?.type            ?? '' },
    { label: 'Subtype',          value: subtype?.subtype      ?? '' },
    { label: 'Width',            value: pedal.w_mm            ? `${pedal.w_mm} mm`    : '' },
    { label: 'Height',           value: pedal.h_mm            ? `${pedal.h_mm} mm`    : '' },
    { label: 'Stereo',           value: pedal.stereo          ?? '' },
    { label: 'Analog / Digital', value: pedal.analog_digital  ?? '' },
    { label: 'Release Year',     value: pedal.release_year    ? String(pedal.release_year) : '' },
  ].filter((s) => s.value.trim() !== '')

  return (
    <main className="min-h-screen bg-[#f5f1ea] flex justify-center">
      <div className="w-full max-w-md px-5 py-8">

        {/* LOGO */}
        <div className="mb-6">
          <Link href="/discover">
            <img
              src="https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/logo/patchlogo.png"
              alt="Patchlog"
              className="w-[92%] mx-auto object-contain"
            />
          </Link>
        </div>

        {/* BACK — client component para leer sessionStorage */}
        <div className="mb-6">
          <BackButton />
        </div>

        {/* IMAGE */}
        <div className="bg-[#f3efe8] rounded-[2rem] h-80 flex items-center justify-center mb-8 overflow-hidden">
          <img
            src={imageUrl}
            alt={pedal.name}
            className="h-64 w-full object-contain"
          />
        </div>

        {/* BRAND */}
        <p className="text-[10px] tracking-[0.35em] uppercase text-[#8a7e72] mb-2">
          {brand?.brand}
        </p>

        {/* NAME */}
        <h1 className="text-5xl font-serif font-medium text-[#3d3935] leading-none mb-6">
          {pedal.name}
        </h1>

        {/* TYPE CHIPS */}
        <div className="flex flex-wrap gap-2 mb-8">
          {type?.type && (
            <span className="text-xs px-3 py-1.5 bg-[#f3efe8] border border-[#ddd7ce] rounded-full text-[#5b544c]">
              {type.type}
            </span>
          )}
          {subtype?.subtype && (
            <span className="text-xs px-3 py-1.5 bg-[#f3efe8] border border-[#ddd7ce] rounded-full text-[#8a7e72]">
              {subtype.subtype}
            </span>
          )}
          {pedal.release_year && (
            <span className="text-xs px-3 py-1.5 bg-[#f3efe8] border border-[#ddd7ce] rounded-full text-[#8a7e72]">
              {pedal.release_year}
            </span>
          )}
        </div>

        {/* STATUS BUTTONS — client component (necesita interactividad) */}
        <div className="mb-8">
          <StatusButtons pedalId={pedal.pedal_id} initialStatus={currentStatus} />
        </div>

        {/* COMMUNITY STATS */}
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a7e72] mb-3">
            Community
          </p>
          <div className="grid grid-cols-3 gap-3">
            {(['have', 'had', 'want'] as const).map((s) => (
              <div
                key={s}
                className="bg-[#faf7f2] rounded-2xl p-4 text-center border border-[#e7dfd3]"
              >
                <p className="text-2xl font-serif text-[#3d3935]">{stats[s]}</p>
                <p className="text-xs text-[#6f675d] capitalize mt-0.5">{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SPECS */}
        {specs.length > 0 && (
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a7e72] mb-3">
              Specs
            </p>
            <div className="bg-[#faf7f2] rounded-[2rem] border border-[#e7dfd3] divide-y divide-[#ede8e1]">
              {specs.map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center px-5 py-3.5">
                  <p className="text-sm text-[#8b8175]">{label}</p>
                  <p className="text-sm text-[#3d3935] font-medium text-right max-w-[55%]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NAV */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#f5f1ea]/95 backdrop-blur border-t border-[#e8e1d8]">
          <div className="max-w-md mx-auto flex justify-around py-3">
            <Link href="/discover" className="flex flex-col items-center gap-0.5 text-[#8a7e72]">
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
    </main>
  )
}
