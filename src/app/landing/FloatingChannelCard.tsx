import { useState } from 'react'

export function FloatingChannelCard() {
  const [active, setActive] = useState(true)

  return (
    <div
      className="bento-floating-card bento-float-4 group relative flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-md transition-all duration-300 hover:rotate-0 hover:scale-105 hover:shadow-2xl"
      style={{
        transform: 'rotate(3deg)',
        maxWidth: '290px',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-emerald-100 text-[#00A99D] border border-teal-200/60 shadow-sm">
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <rect height="14" rx="2" width="20" x="2" y="3" />
              <line x1="8" x2="16" y1="21" y2="21" />
              <line x1="12" x2="12" y1="17" y2="21" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Official Business Page</h4>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Webhook · 0.3s sync</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-400">Status</span>
          <span className="text-[11px] font-semibold text-slate-700">{active ? 'Syncing Active' : 'Paused'}</span>
        </div>
        <button
          className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
            active
              ? 'bg-[#00A99D] text-white shadow-sm shadow-[#00A99D]/20 hover:bg-[#008F85]'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          onClick={() => setActive(!active)}
          type="button"
        >
          {active ? 'Connected ✓' : 'Connect'}
        </button>
      </div>
    </div>
  )
}
