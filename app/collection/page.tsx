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

  // Fetch pedales del usuario con info completa del pedal
  const { data: userPedals, error } = await supabase
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

  // Fetch perfil del usuario para el Share modal
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  return (
    <CollectionClient
      userPedals={userPedals ?? []}
      username={profile?.username ?? null}
    />
  )
}
