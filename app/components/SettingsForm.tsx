'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// ─── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-[#26211d] text-[#f8f5ef] text-sm font-medium shadow-lg transition-all duration-300 whitespace-nowrap ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      {message}
    </div>
  )
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface Props {
  email: string
  initialUsername: string
  initialInstagram: string
  initialTwitter: string
  initialWebsite: string
}

const USERNAME_RE = /^[A-Za-z0-9_.-]{3,20}$/
const HANDLE_RE   = /^[A-Za-z0-9_.]{1,30}$/

export default function SettingsForm({ email, initialUsername, initialInstagram, initialTwitter, initialWebsite }: Props) {
  const [username, setUsername]   = useState(initialUsername)
  const [instagram, setInstagram] = useState(initialInstagram)
  const [twitter, setTwitter]     = useState(initialTwitter)
  const [website, setWebsite]     = useState(initialWebsite)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState({ message: '', visible: false })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message: msg, visible: true })
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500)
  }

  async function handleSave() {
    const clean = username.trim()

    if (!USERNAME_RE.test(clean)) {
      showToast('Username: 3-20 chars — letters, numbers, _ . -')
      return
    }

    const cleanInstagram = instagram.trim().replace(/^@/, '')
    if (cleanInstagram && !HANDLE_RE.test(cleanInstagram)) {
      showToast('Instagram: letters, numbers, _ . only')
      return
    }

    const cleanTwitter = twitter.trim().replace(/^@/, '')
    if (cleanTwitter && !HANDLE_RE.test(cleanTwitter)) {
      showToast('X/Twitter: letters, numbers, _ . only')
      return
    }

    let cleanWebsite = website.trim()
    if (cleanWebsite && !/^https?:\/\//i.test(cleanWebsite)) {
      cleanWebsite = `https://${cleanWebsite}`
    }

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      showToast('Sign in to update your profile')
      return
    }

    const payload = {
      username: clean,
      instagram: cleanInstagram || null,
      twitter: cleanTwitter || null,
      website: cleanWebsite || null,
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    const { error } = existing
      ? await supabase.from('profiles').update(payload).eq('user_id', user.id)
      : await supabase.from('profiles').insert({ user_id: user.id, ...payload })

    setSaving(false)

    if (error) {
      console.error('profiles save error:', error)
      showToast(error.code === '23505' ? 'That username is already taken' : 'Something went wrong — try again')
      return
    }

    setUsername(clean)
    setInstagram(cleanInstagram)
    setTwitter(cleanTwitter)
    setWebsite(cleanWebsite)
    showToast('Saved')
  }

  return (
    <main className="min-h-screen bg-[#f5f1ea] flex justify-center overflow-x-hidden">
      <div className="w-full max-w-md px-6 py-4">

        {/* HEADER */}
        <div className="pb-4 mb-6">
          <Link href="/discover">
            <img
              src="https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/logo/patchlogo.png"
              alt="Patchlog"
              className="w-[92%] mx-auto object-contain mb-5 pt-4"
            />
          </Link>

          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-serif font-medium text-[#26211d] leading-none">
              Settings
            </h1>
            <Link href="/collection" className="text-xs text-[#8a7e72] underline underline-offset-2">
              Back to Collection
            </Link>
          </div>
          <p className="text-[#5b544c] text-base">
            Manage your account.
          </p>
        </div>

        {/* FORM */}
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#8a7e72] mb-2">
              Email
            </label>
            <div className="bg-[#f3efe8] border border-[#ddd7ce] rounded-2xl px-4 py-3.5 text-sm text-[#5b544c]">
              {email}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#8a7e72] mb-2">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yourname"
              maxLength={20}
              className="w-full bg-[#faf7f2] border border-[#c8beb1] rounded-2xl px-4 py-3.5 text-sm text-[#26211d] focus:outline-none focus:ring-2 focus:ring-[#26211d]/20"
            />
            <p className="mt-2 text-xs text-[#8a7e72]">
              Your collection will be shareable at /u/{username.trim() || 'username'}
            </p>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#8a7e72] mb-2">
              Social links <span className="text-[#c8beb1]">(optional)</span>
            </label>

            <div className="space-y-2.5">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#8a7e72]">@</span>
                <input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Instagram"
                  maxLength={30}
                  className="w-full bg-[#faf7f2] border border-[#c8beb1] rounded-2xl pl-8 pr-4 py-3.5 text-sm text-[#26211d] focus:outline-none focus:ring-2 focus:ring-[#26211d]/20"
                />
              </div>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#8a7e72]">@</span>
                <input
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="X / Twitter"
                  maxLength={30}
                  className="w-full bg-[#faf7f2] border border-[#c8beb1] rounded-2xl pl-8 pr-4 py-3.5 text-sm text-[#26211d] focus:outline-none focus:ring-2 focus:ring-[#26211d]/20"
                />
              </div>

              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Website (yourdomain.com)"
                className="w-full bg-[#faf7f2] border border-[#c8beb1] rounded-2xl px-4 py-3.5 text-sm text-[#26211d] focus:outline-none focus:ring-2 focus:ring-[#26211d]/20"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-3.5 rounded-full text-sm font-medium transition-all bg-[#26211d] text-[#f8f5ef] hover:bg-[#3a342e] ${
              saving ? 'opacity-60' : ''
            }`}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div className="h-24" />
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </main>
  )
}
