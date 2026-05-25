'use client'

import Link from 'next/link'

export default function CollectionPage() {
  return (
    <main className="min-h-screen bg-[#f5f1ea] flex justify-center">
      <div className="w-full max-w-md px-5 py-8">
        {/* HEADER */}
        <div className="mb-8">
          <img
            src="https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/logo/patchlogo.png"
            alt="Patchlog"
            className="w-full scale-125 object-contain mb-6"
          />

          <h1 className="text-4xl font-serif font-medium text-[#3d3935] leading-none mb-3">
            Collection
          </h1>

          <p className="text-[#4f4942]">
            Your personal pedal archive.
          </p>
        </div>

        {/* NAV */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#f5f1ea]/95 backdrop-blur border-t border-[#e8e1d8]">
          <div className="max-w-md mx-auto flex justify-around py-4 text-sm">
            <Link
              href="/discover"
              className="cursor-pointer text-[#8c8479]"
            >
              Discover
            </Link>

            <Link
              href="/collection"
              className="cursor-pointer text-[#3d3935] font-medium"
            >
              Collection
            </Link>
          </div>
        </div>

        <div className="h-24" />
      </div>
    </main>
  )
}
