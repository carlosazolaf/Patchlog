import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { GoogleSignInButton } from '@/components/GoogleSignInButton'

/*
  PAGE — Server Component
  Fetches live stats (pedal count + user count) at request time.
*/
export default async function LandingPage() {

  /*
    LIVE STATS
    Ambas queries en paralelo. Si fallan, mostramos 0 sin romper la página.
  */
  const [pedalsRes, usersRes] = await Promise.all([
    supabase.from('pedals').select('pedal_id', { count: 'exact', head: true }),
    supabase.from('user_pedals').select('user_id', { count: 'exact', head: true })
  ])

  const pedalCount = pedalsRes.count ?? 0
  const userCount  = usersRes.count  ?? 0

  // Formato con + si es número redondo o grande
  function fmt(n: number) {
    if (n === 0) return '—'
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k+`
    // Redondea a la decena más cercana para no mostrar un número exacto raro
    const rounded = Math.floor(n / 10) * 10
    return rounded < n ? `${rounded}+` : `${n}`
  }

  return (
    <main className="min-h-screen bg-[#f5f1ea] flex justify-center">
      <div className="w-full max-w-md px-6 flex flex-col min-h-screen">

        {/* LOGO */}
        <div className="pt-12 pb-2">
          <Link href="/discover">
            <img
              src="https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/logo/patchlogo.png"
              alt="Patchlog"
              className="w-[80%] mx-auto object-contain"
            />
          </Link>
        </div>

        {/* HERO */}
        <div className="text-center pt-6 pb-8">
          <h1 className="text-4xl font-serif font-medium text-[#26211d] leading-tight mb-3">
            Your pedal collection,<br />archived.
          </h1>
          <p className="text-[#5b544c] text-[15px] leading-relaxed">
            Discover, track and catalog every pedal<br />you&apos;ve owned, played, or dreamed of.
          </p>
        </div>

        {/* LIVE STATS */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-[#faf7f2] border border-[#ddd7ce] rounded-[1.5rem] p-5 text-center">
            <p className="text-3xl font-serif font-medium text-[#26211d] leading-none mb-1">
              {fmt(pedalCount)}
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a7e72]">Pedals</p>
          </div>
          <div className="bg-[#faf7f2] border border-[#ddd7ce] rounded-[1.5rem] p-5 text-center">
            <p className="text-3xl font-serif font-medium text-[#26211d] leading-none mb-1">
              {fmt(userCount)}
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a7e72]">Collectors</p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 mb-8">
          {/*
            GoogleSignInButton es un Client Component.
            Llama a supabase.auth.signInWithOAuth({ provider: 'google' })
          */}
          <GoogleSignInButton className="flex items-center justify-center gap-3 w-full bg-[#26211d] text-[#f8f5ef] rounded-full py-4 text-sm font-medium hover:bg-[#3a342e] transition-colors">
            <GoogleIcon />
            Continue with Google
          </GoogleSignInButton>

          <Link
            href="/discover"
            className="flex items-center justify-center w-full border border-[#c8beb1] text-[#5b544c] rounded-full py-3.5 text-sm hover:bg-[#f3efe8] transition-colors"
          >
            Browse without an account
          </Link>
        </div>

        {/* SOCIAL PROOF */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <AvatarStack />
          <p className="text-xs text-[#8a7e72]">
            {fmt(userCount)} collectors and growing
          </p>
        </div>

        {/* DIVIDER */}
        <div className="border-t border-[#ddd7ce] mb-8" />

        {/* FEATURE LIST */}
        <div className="flex flex-col gap-5 pb-12">
          {[
            {
              icon: (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              ),
              title: 'Have · Had · Want',
              desc: 'Three states to document your full history with every pedal.'
            },
            {
              icon: (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              ),
              title: 'Filter by brand & type',
              desc: 'Overdrive, delay, fuzz and more — find exactly what you\'re looking for.'
            },
            {
              icon: (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              ),
              title: 'Community stats',
              desc: 'See how many collectors own, owned or want each pedal.'
            },
            {
              icon: (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
              ),
              title: 'Share your collection',
              desc: 'Send your archive to anyone with a single link.'
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="w-9 h-9 bg-[#f3efe8] border border-[#ddd7ce] rounded-xl flex items-center justify-center shrink-0 text-[#5b544c]">
                {icon}
              </div>
              <div>
                <p className="text-sm font-medium text-[#26211d] mb-0.5">{title}</p>
                <p className="text-xs text-[#8a7e72] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#f8f5ef"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#c8beb1"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#a09588"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#f8f5ef"/>
    </svg>
  )
}

function AvatarStack() {
  // Colores neutros que encajan con la paleta
  const colors = ['#7a6f62', '#9b8a7b', '#bfad9e']
  const initials = ['M', 'R', 'A']

  return (
    <div className="flex">
      {colors.map((color, i) => (
        <div
          key={i}
          className="w-6 h-6 rounded-full border-2 border-[#f5f1ea] flex items-center justify-center text-white text-[9px] font-medium"
          style={{ background: color, marginLeft: i === 0 ? 0 : -8 }}
        >
          {initials[i]}
        </div>
      ))}
    </div>
  )
}
