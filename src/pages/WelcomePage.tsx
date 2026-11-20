import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { PublicSettings } from '../types/app';
import { getThemePalette } from '../utils/theme';
import { StepFooterControls } from '../components/StepNavigation';

interface WelcomePageProps {
  settings: PublicSettings;
  onBack?: () => void;
  onNext: () => void;
}

interface DurationBreakdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeElapsed(sinceIso: string): DurationBreakdown {
  const start = new Date(sinceIso).getTime();
  const now = Date.now();
  const diffMs = Number.isFinite(start) && now > start ? now - start : 0;
  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function WelcomePage({ settings, onBack, onNext }: WelcomePageProps) {
  const palette = getThemePalette(settings.themeAccent);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videos = settings.welcomeVideos || [];
  const [videoIndex, setVideoIndex] = useState(0);
  const safeVideoIndex = Math.min(videoIndex, Math.max(0, videos.length - 1));
  const activeVideo = videos[safeVideoIndex];

  const openVideoFullscreen = () => {
    const v = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!v) return;
    v.play().catch(() => undefined);
    if (v.requestFullscreen) {
      v.requestFullscreen().catch(() => undefined);
    } else if (v.webkitEnterFullscreen) {
      v.webkitEnterFullscreen();
    }
  };
  const [elapsed, setElapsed] = useState<DurationBreakdown>(() =>
    computeElapsed(settings.togetherSinceDate)
  );

  useEffect(() => {
    setElapsed(computeElapsed(settings.togetherSinceDate));
    const id = window.setInterval(() => {
      setElapsed(computeElapsed(settings.togetherSinceDate));
    }, 1000);
    return () => window.clearInterval(id);
  }, [settings.togetherSinceDate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-20 pb-12 relative z-10 overflow-x-hidden">
      <div className="max-w-3xl w-full text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="text-xs sm:text-sm font-serif-editorial italic tracking-widest text-[#d9b37c] mb-4"
        >
          {settings.coupleNames} · From {settings.wifeName} to {settings.husbandName}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="font-script text-6xl sm:text-7xl md:text-[5.5rem] text-[#faf6f0] leading-[1.08] mb-6"
          style={{ textWrap: 'balance' }}
        >
          Happy Birthday {settings.husbandName}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.16 }}
          className="font-serif-editorial text-xl sm:text-2xl text-[#faf6f0]/82 leading-relaxed max-w-2xl mx-auto mb-12"
        >
          {settings.heroIntro}
        </motion.p>

        {activeVideo && (
          <div className="relative left-1/2 -translate-x-1/2 w-screen mb-10 bg-black">
            <div className="relative w-full h-[100svh] flex items-center justify-center">
              <video
                key={activeVideo.id}
                ref={videoRef}
                src={activeVideo.url}
                controls
                playsInline
                preload="metadata"
                className="w-full h-full object-contain bg-black"
              />

              {videos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setVideoIndex(Math.max(0, safeVideoIndex - 1))}
                    disabled={safeVideoIndex === 0}
                    aria-label="Previous video"
                    className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/55 border border-white/25 text-white text-xl disabled:opacity-30 cursor-pointer"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoIndex(Math.min(videos.length - 1, safeVideoIndex + 1))}
                    disabled={safeVideoIndex === videos.length - 1}
                    aria-label="Next video"
                    className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/55 border border-white/25 text-white text-xl disabled:opacity-30 cursor-pointer"
                  >
                    ›
                  </button>
                  <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {videos.map((v, i) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVideoIndex(i)}
                        aria-label={`Video ${i + 1}`}
                        className="h-2 rounded-full transition-all cursor-pointer"
                        style={{
                          width: i === safeVideoIndex ? '22px' : '8px',
                          backgroundColor:
                            i === safeVideoIndex ? palette.primary : 'rgba(250, 246, 240, 0.4)',
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {(activeVideo.title || activeVideo.text) && (
              <div className="max-w-2xl mx-auto px-5 py-8 text-left">
                {activeVideo.title && (
                  <h2 className="font-script text-4xl sm:text-5xl text-[#faf6f0] mb-3">
                    {activeVideo.title}
                  </h2>
                )}
                {activeVideo.text && (
                  <p className="font-serif-editorial text-lg sm:text-xl text-[#faf6f0]/85 leading-relaxed whitespace-pre-line">
                    {activeVideo.text}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Live Together Since Counter */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.24 }}
          className="glass-surface rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 pb-4 border-b border-[#faf6f0]/10">
            <h2 className="font-serif-editorial text-lg text-[#faf6f0]/90">Together Since</h2>
            <p className="text-xs text-[#faf6f0]/60 tabular-nums">
              {new Date(settings.togetherSinceDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {[
              { label: 'Days', value: elapsed.days.toLocaleString() },
              { label: 'Hours', value: String(elapsed.hours).padStart(2, '0') },
              { label: 'Minutes', value: String(elapsed.minutes).padStart(2, '0') },
              { label: 'Seconds', value: String(elapsed.seconds).padStart(2, '0') },
            ].map((unit) => (
              <div key={unit.label} className="text-center">
                <div
                  className="font-mono-tabular text-3xl sm:text-4xl font-semibold tracking-tight"
                  style={{ color: palette.secondary }}
                >
                  {unit.value}
                </div>
                <div className="text-xs text-[#faf6f0]/55 mt-1">{unit.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <StepFooterControls
          onBack={onBack}
          onNext={onNext}
          nextLabel={settings.nextButtonLabels.welcome || 'Begin Our Story 💕'}
          accent={settings.themeAccent}
        />
      </div>
    </div>
  );
}
