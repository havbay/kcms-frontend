import { useState } from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

export function FloatingReactionCard() {
  const [counts, setCounts] = useState({
    love: 1420,
    like: 892,
    angry: 14,
  })
  const [activeReaction, setActiveReaction] = useState<string | null>(null)

  const handleReact = (type: 'love' | 'like' | 'angry') => {
    setCounts((prev) => ({
      ...prev,
      [type]: prev[type] + 1,
    }))
    setActiveReaction(type)
    setTimeout(() => setActiveReaction(null), 600)
  }

  return (
    <div
      className="bento-floating-card bento-float-2 group relative flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-md transition-all duration-300 hover:rotate-0 hover:scale-105 hover:shadow-2xl font-['Kantumruy_Pro',sans-serif]"
      style={{
        transform: 'rotate(2deg)',
        width: '300px',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Facebook Icon, matching FloatingCommentCard's badge */}
          <div className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-sm">
            <svg aria-hidden="true" className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full border border-white bg-rose-500" />
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-800 truncate">Facebook Live Stream</span>
        </div>
        <span className="flex-shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
          Live Moderation
        </span>
      </div>

      {/* Lottie Animation Header */}
      <div className="relative h-20 w-full overflow-hidden rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
        <DotLottieReact
          autoplay
          className="h-full w-full object-cover"
          loop
          src="/animation/Facebookactivity.lottie"
        />
      </div>

      {/* Interactive Reaction Buttons with Lottie Emojis */}
      <div className="grid grid-cols-3 gap-1.5 pt-1">
        {/* Love */}
        <button
          aria-label={`Love reaction, ${counts.love} reactions`}
          className={`flex items-center justify-center gap-1 rounded-xl border p-1.5 transition-all cursor-pointer ${
            activeReaction === 'love'
              ? 'scale-110 border-rose-300 bg-rose-50 shadow-sm'
              : 'border-slate-100 bg-slate-50/70 hover:border-slate-200 hover:bg-white'
          }`}
          onClick={() => handleReact('love')}
          type="button"
        >
          <div className="h-5 w-5 flex-shrink-0 flex items-center justify-center">
            <DotLottieReact
              autoplay
              loop
              src="/animation/Emojis - Love.lottie"
            />
          </div>
          <span className="text-[11px] font-semibold text-slate-700">{counts.love.toLocaleString()}</span>
        </button>

        {/* Like */}
        <button
          aria-label={`Like reaction, ${counts.like} reactions`}
          className={`flex items-center justify-center gap-1 rounded-xl border p-1.5 transition-all cursor-pointer ${
            activeReaction === 'like'
              ? 'scale-110 border-sky-300 bg-sky-50 shadow-sm'
              : 'border-slate-100 bg-slate-50/70 hover:border-slate-200 hover:bg-white'
          }`}
          onClick={() => handleReact('like')}
          type="button"
        >
          <div className="h-5 w-5 flex-shrink-0 flex items-center justify-center">
            <DotLottieReact
              autoplay
              loop
              src="/animation/Emojis - Like.lottie"
            />
          </div>
          <span className="text-[11px] font-semibold text-slate-700">{counts.like.toLocaleString()}</span>
        </button>

        {/* Angry */}
        <button
          aria-label={`Angry reaction, ${counts.angry} reactions`}
          className={`flex items-center justify-center gap-1 rounded-xl border p-1.5 transition-all cursor-pointer ${
            activeReaction === 'angry'
              ? 'scale-110 border-amber-300 bg-amber-50 shadow-sm'
              : 'border-slate-100 bg-slate-50/70 hover:border-slate-200 hover:bg-white'
          }`}
          onClick={() => handleReact('angry')}
          type="button"
        >
          <div className="h-5 w-5 flex-shrink-0 flex items-center justify-center">
            <DotLottieReact
              autoplay
              loop
              src="/animation/Angry Emoji.lottie"
            />
          </div>
          <span className="text-[11px] font-semibold text-slate-700">{counts.angry.toLocaleString()}</span>
        </button>
      </div>
    </div>
  )
}
