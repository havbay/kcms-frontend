import { useEffect, useRef, useState } from 'react'

export function HeroBackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Detect prefers-reduced-motion safely
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(motionQuery.matches)

      const handleMotionChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches)
      }

      if (typeof motionQuery.addEventListener === 'function') {
        motionQuery.addEventListener('change', handleMotionChange)
      }

      // Responsive asset selection (< 768px loads mobile-optimized video)
      const mobileQuery = window.matchMedia('(max-width: 767px)')
      setIsMobile(mobileQuery.matches)

      const handleMobileChange = (e: MediaQueryListEvent) => {
        setIsMobile(e.matches)
      }

      if (typeof mobileQuery.addEventListener === 'function') {
        mobileQuery.addEventListener('change', handleMobileChange)
      }

      return () => {
        if (typeof motionQuery.removeEventListener === 'function') {
          motionQuery.removeEventListener('change', handleMotionChange)
        }
        if (typeof mobileQuery.removeEventListener === 'function') {
          mobileQuery.removeEventListener('change', handleMobileChange)
        }
      }
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || prefersReducedMotion) return

    // If playback has already started (e.g. from fast cache)
    if (!video.paused && video.currentTime > 0) {
      setIsPlaying(true)
    }

    const handlePlaying = () => {
      setIsPlaying(true)
    }

    video.addEventListener('playing', handlePlaying)

    // Explicitly request playback for browsers with strict policy
    if (typeof video.play === 'function') {
      const playPromise = video.play()
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Autoplay blocked by browser policy (e.g. low-power mode); stays seamlessly on poster
        })
      }
    }

    return () => {
      video.removeEventListener('playing', handlePlaying)
    }
  }, [prefersReducedMotion, isMobile])

  return (
    <div className="lp-hero-media" aria-hidden="true">
      {/* 1. High-priority poster image (z-index: 0) — renders immediately, prevents CLS & flashes */}
      <img
        alt=""
        className="lp-hero-poster"
        decoding="async"
        fetchPriority="high"
        loading="eager"
        src="/videos/hero-poster.webp"
      />

      {/* 2. Responsive video stream (z-index: 1) — only rendered if motion is not reduced */}
      {!prefersReducedMotion && (
        <video
          aria-hidden="true"
          autoPlay
          className={`lp-hero-video ${isPlaying ? 'is-playing' : ''}`}
          loop
          muted
          playsInline
          preload="metadata"
          ref={videoRef}
          tabIndex={-1}
        >
          {isMobile ? (
            <source src="/videos/hero-background-mobile.mp4" type="video/mp4" />
          ) : (
            <>
              <source src="/videos/hero-background.webm" type="video/webm" />
              <source src="/videos/hero-background.mp4" type="video/mp4" />
            </>
          )}
        </video>
      )}

      {/* 3. Readability Overlay (z-index: 2) — soft white & teal SaaS gradient wash */}
      <div className="lp-hero-overlay" />
    </div>
  )
}
