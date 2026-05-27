export default function LoadingTabs({ text = "Loading patchlog..." }: { text?: string }) {
  return (
    <main className="min-h-screen bg-[#f5f1ea] flex items-center justify-center">
      <p className="text-[#5b544c] font-serif animate-pulse">{text}</p>
    </main>
  )
}
