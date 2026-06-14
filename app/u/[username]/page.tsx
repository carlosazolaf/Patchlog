import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import FollowButton from '@/app/components/FollowButton'
import UserBadge from '@/app/components/UserBadge'

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('username', username)
    .single()

  if (!profile) return { title: 'Patchlog' }
  return {
    title: `${profile.display_name ?? profile.username} — Patchlog`,
    description: `${profile.display_name ?? profile.username}'s pedal collection on Patchlog.`,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Avatar({ url, name, size = 56 }: { url?: string | null; name: string; size?: number }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="rounded-full bg-[#e0d9d0] flex items-center justify-center text-[#5b544c] font-serif font-medium"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name[0]?.toUpperCase()}
    </div>
  )
}

// ─── Section component ────────────────────────────────────────────────────────

function PedalSection({
  title,
  pedals,
  emptyMsg,
  accent,
}: {
  title: string
  pedals: any[]
  emptyMsg: string
  accent?: 'green'
}) {
  if (pedals.length === 0) return null

  const borderClass = accent === 'green' ? 'border-[#b7dfc9]' : 'border-[#ebe6df]'
  const bgClass     = accent === 'green' ? 'bg-[#f7fdf9]'     : 'bg-[#faf7f2]'

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#8a7e72] font-medium">{title}</h2>
        <span className="text-xs text-[#8a7e72]">{pedals.length}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {pedals.map((pedal) => {
          const imageUrl = `https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/pedal_images/${pedal.image_path}`
          return (
            <Link key={pedal.pedal_id} href={`/pedal/${pedal.pedal_id}`}>
              <div className={`${bgClass} rounded-[2rem] p-4 border ${borderClass} hover:brightness-95 transition-all`}>
                {accent === 'green' && (
                  <div className="flex justify-end mb-1 -mt-1">
                    <span className="text-[10px] font-medium text-[#2d6a4f] bg-[#d8f3e8] px-2 py-0.5 rounded-full">
                      For Sale
                    </span>
                  </div>
                )}
                <div className="bg-[#f3efe8] rounded-[1.5rem] h-36 flex items-center justify-center mb-3">
                  <img src={imageUrl} alt={pedal.name} className="h-28 w-full object-contain" loading="lazy" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a7e72] mb-0.5">{pedal.brand_name}</p>
                <h3 className="text-base font-serif font-medium text-[#26211d] leading-snug mb-1">{pedal.name}</h3>
                <p className="text-[11px] text-[#8a7e72]">{pedal.type_name}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

// ─── Bottom nav ────────────────────────────────────────────────────────────────

function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#f5f1ea]/95 backdrop-blur border-t border-[#e8e1d8]">
      <div className="max-w-md mx-auto flex justify-around py-3 text-sm">
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
        <Link href="/feed" className="flex flex-col items-center gap-0.5 text-[#8a7e72]">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span className="text-[10px] uppercase tracking-widest">Community</span>
        </Link>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  // Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  // Follower count
  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.user_id)

  // Pedales públicos de este usuario
  const { data: userPedalsRaw } = await supabase
    .from('user_pedals')
    .select('pedal_id, status')
    .eq('user_id', profile.user_id)

  // Filtra según privacidad del perfil (por defecto visible salvo que se oculte explícitamente)
  const visibleEntries = (userPedalsRaw || []).filter((up) => {
    if (up.status === 'have' && profile.public_have === false) return false
    if (up.status === 'had'  && profile.public_had  === false) return false
    if (up.status === 'want' && profile.public_want === false) return false
    if (up.status === 'sell' && profile.public_sell === false) return false
    return true
  })

  if (visibleEntries.length === 0) {
    return (
      <main className="min-h-screen bg-[#f5f1ea] flex justify-center">
        <div className="w-full max-w-md px-6 py-8">
          <div className="flex justify-end mb-2">
            <UserBadge />
          </div>
          <ProfileHeader profile={profile} followerCount={followerCount ?? 0} />
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔒</p>
            <p className="font-serif text-xl text-[#26211d] mb-2">This collection is private</p>
            <p className="text-sm text-[#5b544c]">{profile.display_name ?? profile.username} hasn&apos;t made their pedals public yet.</p>
          </div>
          <div className="h-24" />
        </div>
        <BottomNav />
      </main>
    )
  }

  const pedalIds = visibleEntries.map((e) => e.pedal_id)

  // Fetch pedal details + lookups en paralelo
  const [pedalsRes, brandsRes, typesRes] = await Promise.all([
    supabase.from('pedals').select('*').in('pedal_id', pedalIds),
    supabase.from('brand').select('*'),
    supabase.from('type').select('*'),
  ])

  const pedals   = pedalsRes.data   || []
  const brands   = brandsRes.data   || []
  const types    = typesRes.data    || []

  // Enrich
  const enriched = pedals.map((pedal) => ({
    ...pedal,
    brand_name: brands.find((b) => Number(b.brand_id) === Number(pedal.brand_id))?.brand || '',
    type_name:  types.find((t)  => Number(t.type_id)  === Number(pedal.type_id))?.type   || '',
    status:     visibleEntries.find((e) => Number(e.pedal_id) === Number(pedal.pedal_id))?.status || '',
  }))

  // Agrupa por status
  const have = enriched.filter((p) => p.status === 'have')
  const had  = enriched.filter((p) => p.status === 'had')
  const want = enriched.filter((p) => p.status === 'want')
  const sell = enriched.filter((p) => p.status === 'sell')

  // Counts totales para el resumen (incluyendo privados, los que el perfil permite)
  const totalPublic = visibleEntries.length

  return (
    <main className="min-h-screen bg-[#f5f1ea] flex justify-center">
      <div className="w-full max-w-md px-6 py-8">

        {/* Logo */}
        <div className="mb-8">
          <div className="flex justify-end mb-2">
            <UserBadge />
          </div>
          <Link href="/discover">
            <img
              src="https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/logo/patchlogo.png"
              alt="Patchlog"
              className="w-[70%] mx-auto object-contain"
            />
          </Link>
        </div>

        {/* Profile header */}
        <ProfileHeader profile={profile} followerCount={followerCount ?? 0} />

        {/* Stats summary */}
        <div className="grid grid-cols-4 gap-2 mb-10">
          {[
            { label: 'Have', count: have.length,  show: profile.public_have !== false },
            { label: 'Had',  count: had.length,   show: profile.public_had  !== false },
            { label: 'Want', count: want.length,  show: profile.public_want !== false },
            { label: 'Sell', count: sell.length,  show: profile.public_sell !== false, green: true },
          ].filter((s) => s.show).map(({ label, count, green }) => (
            <div
              key={label}
              className={`rounded-2xl p-3 text-center ${
                green ? 'bg-[#f0faf5] border border-[#b7dfc9]' : 'bg-[#faf7f2] border border-[#ddd7ce]'
              }`}
            >
              <p className={`text-xl font-serif font-medium ${green ? 'text-[#2d6a4f]' : 'text-[#26211d]'}`}>{count}</p>
              <p className="text-[10px] uppercase tracking-widest text-[#8a7e72] mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        {profile.public_sell !== false && (
          <PedalSection title="For Sale" pedals={sell} emptyMsg="Nothing for sale" accent="green" />
        )}
        {profile.public_have !== false && (
          <PedalSection title="Have" pedals={have} emptyMsg="No pedals" />
        )}
        {profile.public_had !== false && (
          <PedalSection title="Had" pedals={had} emptyMsg="No pedals" />
        )}
        {profile.public_want !== false && (
          <PedalSection title="Want" pedals={want} emptyMsg="No pedals" />
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link href="/discover" className="text-xs text-[#8a7e72] underline underline-offset-2">
            Explore the full catalog →
          </Link>
        </div>

        <div className="h-24" />
      </div>
      <BottomNav />
    </main>
  )
}

// ─── Social links ──────────────────────────────────────────────────────────────

function SocialLinks({ profile }: { profile: { instagram?: string | null; twitter?: string | null; website?: string | null } }) {
  if (!profile.instagram && !profile.twitter && !profile.website) return null

  return (
    <div className="flex items-center gap-3 mt-2">
      {profile.instagram && (
        <a
          href={`https://instagram.com/${profile.instagram}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="text-[#8a7e72] hover:text-[#26211d] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
        </a>
      )}
      {profile.twitter && (
        <a
          href={`https://x.com/${profile.twitter}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="X / Twitter"
          className="text-[#8a7e72] hover:text-[#26211d] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.736l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
      )}
      {profile.website && (
        <a
          href={profile.website}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Website"
          className="text-[#8a7e72] hover:text-[#26211d] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </a>
      )}
    </div>
  )
}

// ─── Profile header (server, no interactividad) ───────────────────────────────

function ProfileHeader({ profile, followerCount }: { profile: any; followerCount: number }) {
  const displayName = profile.display_name ?? profile.username

  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-4">
        <Avatar url={profile.avatar_url} name={displayName} size={52} />
        <div>
          <h1 className="text-xl font-serif font-medium text-[#26211d] leading-tight">{displayName}</h1>
          <p className="text-xs text-[#8a7e72]">@{profile.username}</p>
          {profile.bio && <p className="text-sm text-[#5b544c] mt-1 max-w-[200px]">{profile.bio}</p>}
          <SocialLinks profile={profile} />
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        {/* FollowButton es Client Component — necesita saber si el visitante ya sigue */}
        <FollowButton targetUserId={profile.user_id} />
        <p className="text-xs text-[#8a7e72]">{followerCount} follower{followerCount !== 1 ? 's' : ''}</p>
      </div>
    </div>
  )
}
