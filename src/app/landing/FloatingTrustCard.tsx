export function FloatingTrustCard() {
  return (
    <div
      className="bento-floating-card bento-float-5 group relative flex items-center gap-3 rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50/90 to-white/95 p-3.5 shadow-lg backdrop-blur-md transition-all duration-300 hover:rotate-0 hover:scale-105 hover:shadow-xl"
      style={{
        transform: 'rotate(-2deg)',
        maxWidth: '280px',
      }}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-500/20">
        <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </div>

      <div className="flex flex-col">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Audit Safeguard</span>
        <span className="text-xs font-bold text-slate-800">100% Human-Approved</span>
      </div>

      <span className="ml-auto rounded-full bg-[#00A99D]/15 px-2 py-0.5 text-[11px] font-bold text-[#00A99D]">
        Verified
      </span>
    </div>
  )
}
