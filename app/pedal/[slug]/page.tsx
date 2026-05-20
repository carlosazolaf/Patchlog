import { supabase } from '@/lib/supabase'

type Props = {
  params: Promise<{
    slug: string
  }>
}

export default async function PedalPage({ params }: Props) {
  const { slug } = await params

  const { data: pedal } = await supabase
    .from('pedals')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!pedal) {
    return <div>Pedal not found</div>
  }

  const imageUrl = `https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/pedal_images/${pedal.image_path}`

  return (
    <main className="min-h-screen bg-[#f5f1ea] px-5 py-8">
      <div className="max-w-md mx-auto">
        <a
          href="/"
          className="text-sm text-[#7d7469] mb-6 inline-block"
        >
          ← Back
        </a>

        <div className="bg-[#f3efe8] rounded-[2rem] h-96 flex items-center justify-center mb-6">
          <img
            src={imageUrl}
            alt={pedal.name}
            className="h-80 object-contain"
          />
        </div>

        <p className="text-xs tracking-[0.3em] uppercase text-[#9b9388] mb-3">
          Pedal Archive
        </p>

        <h1 className="text-5xl font-serif leading-none tracking-tight text-[#171717] mb-4">
          {pedal.name}
        </h1>

        <div className="flex gap-2 mb-6 flex-wrap">
          {pedal.power && (
            <span className="bg-white px-4 py-2 rounded-full text-sm">
              {pedal.power}
            </span>
          )}

          {pedal.stereo && (
            <span className="bg-white px-4 py-2 rounded-full text-sm">
              Stereo
            </span>
          )}

          {pedal.analog_digital && (
            <span className="bg-white px-4 py-2 rounded-full text-sm">
              {pedal.analog_digital}
            </span>
          )}
        </div>

        <div className="bg-white rounded-[2rem] p-6">
          <h2 className="text-xl font-semibold mb-4">
            Specifications
          </h2>

          <div className="space-y-4 text-[#5f5b56]">
            <div className="flex justify-between">
              <span>Width</span>
              <span>{pedal.w_mm} mm</span>
            </div>

            <div className="flex justify-between">
              <span>Height</span>
              <span>{pedal.h_mm} mm</span>
            </div>

            <div className="flex justify-between">
              <span>Released</span>
              <span>{pedal.release_year || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}