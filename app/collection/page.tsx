import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CollectionClient from '@/app/components/CollectionClient'

export const metadata = {
  title: 'My Collection — Patchlog',
}

type RawPedal = {
  id: string
  slug: string
  name: string
  image_url: string | null
  brand: { name: string }[] | { name: string } | null
  type: { name: string }[] | { name: string } | null
  subtype: { name: string }[] | { name: string } | null
}

type RawUserPedal = {
  status: 'have' | 'had' | 'want' | 'sell'
  updated_at: string
  pedals: RawPedal[] | RawPedal | null
}

function toSingle<T>(val: T[] | T | null): T | null {
  if (val === null || val === undefined) return null
  if (Array.isArray(val)) return val[0] ?? null
  return val
}

export default async function CollectionPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: rawData, error } = await supabase
    .from('user_pedals')
    .select(`
      status,
      updated_at,
      pedals (
        id,
        slug,
        name,
        image_url,
        brand (name),
        type (name),
        subtype (name)
      )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching collection:', error)
  }

  const raw = (rawData ?? []) as unknown as RawUserPedal[]

  const userPedals = raw.map((up) => {
    const pedal = toSingle(up.pedals)
    return {
      status: up.status,
      updated_at: up.updated_at,
      pedals: pedal
        ? {
            id: pedal.id,
            slug: pedal.slug,
            name: pedal.name,
            image_url: pedal.image_url,
            brand: toSingle(pedal.brand),
            type: toSingle(pedal.type),
            subtype: toSingle(pedal.subtype),
          }
        : null,
    }
  })

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  return (
    <CollectionClient
      userPedals={userPedals}
      username={profile?.username ?? null}
    />
  )
}
