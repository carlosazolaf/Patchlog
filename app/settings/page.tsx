import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from '@/app/components/SettingsForm'

export const metadata = {
  title: 'Settings — Patchlog',
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <SettingsForm
      email={user.email ?? ''}
      initialUsername={profile?.username ?? ''}
    />
  )
}
