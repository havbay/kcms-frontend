export function FloatingReplyCard() {
  return (
    <div
      className="bento-floating-card bento-float-3 group relative flex flex-col gap-2.5 rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-xl backdrop-blur-md transition-all duration-300 hover:rotate-0 hover:scale-105 hover:shadow-2xl"
      style={{
        transform: 'rotate(6deg)',
        maxWidth: '280px',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00A99D]/15 text-[#00A99D]">
            <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="text-[11px] font-semibold text-slate-800">Smart Assistant</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#00A99D]/10 px-2 py-0.5 text-[10px] font-semibold text-[#00A99D] border border-[#00A99D]/20">
          Auto-Replied ✓
        </span>
      </div>

      <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100/80">
        <p className="font-['Kantumruy_Pro',sans-serif] text-[11px] text-slate-700 leading-relaxed" lang="km">
          &ldquo;សូមអរគុណ! ក្រុមការងារនឹងឆ្លើយតបឆាប់ៗនេះ&rdquo;
        </p>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span>Channel: Messenger / Post</span>
        <span className="font-medium text-[#00A99D]">0.2s latency</span>
      </div>
    </div>
  )
}
