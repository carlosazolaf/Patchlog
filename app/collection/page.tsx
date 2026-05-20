'use client'

import Link from 'next/link'

export default function CollectionPage() {
  return (
    <main className="min-h-screen bg-[#f5f1ea] flex justify-center">
      <div className="w-full max-w-md px-5 py-8">
        {/* HEADER */}
        <div className="mb-10">
          <div className="mb-6">
            <p className="text-sm tracking-[0.45em] uppercase text-[#4f4942]">
              PATCHLOG
            </p>

            <div className="flex items-center mt-2">
              <div className="h-px bg-[#b8afa3] flex-1" />

              <img
                src="https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/logo/patchlogo.png"
                alt="Patchlog"
                className="h-4 mx-3 object-contain"
              />

              <div className="h-px bg-[#b8afa3] flex-1" />
            </div>
          </div>

          <h1 className="text-5xl font-serif font-medium text-[#3d3935] leading-none mb-4">
            Collection
          </h1>

          <p className="text-[#4f4942]">
            Your personal pedal archive.
          </p>
        </div>
      </div>
    </main>
  )
}
