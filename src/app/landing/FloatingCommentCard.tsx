import { useState } from 'react'

export function FloatingCommentCard() {
  const [hidden, setHidden] = useState(false)

  return (
    <div
      className="bento-floating-card bento-float-1 group relative flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-md transition-all duration-300 hover:rotate-0 hover:scale-105 hover:shadow-2xl font-['Kantumruy_Pro',sans-serif]"
      style={{
        transform: 'rotate(-2deg)',
        width: '300px',
      }}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Facebook Icon */}
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-sm">
              <svg aria-hidden="true" className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-slate-800 truncate">Rin Layheang</span>
          </div>
          <span className="inline-flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600 border border-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            🚨 98% Scam Risk
          </span>
        </div>
        <span className="pl-9 text-[11px] text-slate-400 truncate">Facebook Comment · 2m ago</span>
      </div>

      <p
        className={`font-['Kantumruy_Pro',sans-serif] text-xs leading-relaxed transition-all ${hidden ? 'line-through text-slate-400' : 'text-slate-700 font-medium'
          }`}
        lang="km"
      >
        ចុចតំណនេះទទួលលុយ $500 ថ្ងៃនេះ!
      </p>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
        <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">Status: {hidden ? 'Hidden on Page' : 'Pending Action'}</span>
        <button
          className={`flex-shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${hidden
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
            }`}
          onClick={() => setHidden(!hidden)}
          type="button"
        >
          {hidden ? 'Unhide Comment' : 'Hide Comment'}
        </button>
      </div>
    </div>
  )
}
