import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CollectionClient from '@/app/components/CollectionClient'

export const metadata = {
  title: 'My Collection — Patchlog',
}

export default async function CollectionPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: userPedalsRaw, error } = await supabase
    .from('user_pedals')
    .select('pedal_id, status, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching collection:', error)
  }

  const entries = userPedalsRaw || []
  const pedalIds = entries.map((e) => e.pedal_id)

  const [brandsRes, typesRes, subtypesRes, profileRes, pedalsRes] = await Promise.all([
    supabase.from('brand').select('*'),
    supabase.from('type').select('*'),
    supabase.from('subtype').select('*'),
    supabase.from('profiles').select('username').eq('id', user.id).single(),
    pedalIds.length > 0
      ? supabase.from('pedals').select('*').in('pedal_id', pedalIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ])

  const brands   = brandsRes.data   || []
  const types    = typesRes.data    || []
  const subtypes = subtypesRes.data || []
  const pedals   = (pedalsRes.data  || []) as {
    pedal_id: number
    name: string
    image_path: string
    brand_id: number
    type_id: number
    subtype_id: number
  }[]

  const userPedals = entries
    .map((entry) => {
      const pedal = pedals.find((p) => Number(p.pedal_id) === Number(entry.pedal_id))
      if (!pedal) return null
      return {
        status: entry.status,
        updated_at: entry.updated_at,
        pedal_id: pedal.pedal_id,
        name: pedal.name,
        image_path: pedal.image_path,
        brand_name:   brands.find((b)   => Number(b.brand_id)   === Number(pedal.brand_id))?.brand     || '',
        type_name:    types.find((t)    => Number(t.type_id)    === Number(pedal.type_id))?.type       || '',
        subtype_name: subtypes.find((s) => Number(s.subtype_id) === Number(pedal.subtype_id))?.subtype || '',
      }
    })
    .filter((up): up is NonNullable<typeof up> => up !== null)

  return (
    <CollectionClient
      userPedals={userPedals}
      username={profileRes.data?.username ?? null}
    />
  )
}
