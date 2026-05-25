export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />
        <p className="text-emerald-400 font-medium tracking-widest text-sm uppercase">
          Loading Menu...
        </p>
      </div>
    </div>
  )
}