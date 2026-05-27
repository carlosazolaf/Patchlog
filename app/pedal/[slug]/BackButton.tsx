'use client'

import { useRouter } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className="cursor-pointer text-sm text-[#6f675d]"
    >
      ← Back
    </button>
  )
}
