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
    redirect('/login')
  }

  const { data: rawPedals, error } = await supabase
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

  const userPedals = (rawPedals ?? []).map((up) => ({
    ...up,
    pedals: up.pedals
      ? {
          ...up.pedals,
          brand: Array.isArray(up.pedals.brand) ? (up.pedals.brand[0] ?? null) : up.pedals.brand,
          type: Array.isArray(up.pedals.type) ? (up.pedals.type[0] ?? null) : up.pedals.type,
          subtype: Array.isArray(up.pedals.subtype) ? (up.pedals.subtype[0] ?? null) : up.pedals.subtype,
        }
      : null,
  }))

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
