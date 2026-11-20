import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MailOpen, X } from 'lucide-react';
import type { PromiseItem, PublicSettings } from '../types/app';
import { getThemePalette } from '../utils/theme';
import { StepFooterControls } from '../components/StepNavigation';

interface PromisesPageProps {
  items: PromiseItem[];
  settings: PublicSettings;
  onBack?: () => void;
  onNext: () => void;
}

export function PromisesPage({ items, settings, onBack, onNext }: PromisesPageProps) {
  const palette = getThemePalette(settings.themeAccent);
  const [openedIds, setOpenedIds] = useState<string[]>([]);
  const [activePromise, setActivePromise] = useState<PromiseItem | null>(null);
  const [flapOpened, setFlapOpened] = useState(false);
  const [visibleWords, setVisibleWords] = useState(0);

  const words = useMemo(
    () => (activePromise ? activePromise.text.trim().split(/\s+/) : []),
    [activePromise]
  );

  // Trigger 3D flap opening then live handwritten typewriter when an envelope is tapped
  useEffect(() => {
    if (!activePromise) {
      setFlapOpened(false);
      setVisibleWords(0);
      return;
    }

    setFlapOpened(false);
    setVisibleWords(0);

    const openTimer = window.setTimeout(() => {
      setFlapOpened(true);
    }, 180);

    let typeTimer: number | null = null;
    const startTypingTimer = window.setTimeout(() => {
      setVisibleWords(1);
      const total = words.length;
      if (total > 1) {
        typeTimer = window.setInterval(() => {
          setVisibleWords((prev) => {
            if (prev >= total) {
              if (typeTimer !== null) window.clearInterval(typeTimer);
              return total;
            }
            return prev + 1;
          });
        }, 170);
      }
    }, 620);

    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(startTypingTimer);
      if (typeTimer !== null) window.clearInterval(typeTimer);
    };
  }, [activePromise, words.length]);

  const handleCloseLetter = () => {
    if (activePromise && !openedIds.includes(activePromise.id)) {
      setOpenedIds((prev) => [...prev, activePromise.id]);
    }
    setActivePromise(null);
  };

  const allOpened = items.length === 0 || openedIds.length >= items.length;
  const isTyping = activePromise !== null && visibleWords < words.length;

  return (
    <div className="min-h-screen px-4 sm:px-6 pt-24 pb-16 relative z-10 flex flex-col justify-between">
      <div className="max-w-5xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="font-serif-editorial italic text-sm text-[#d9b37c] tracking-wide mb-2">
            Sealed With Love
          </p>
          <h1
            className="font-script text-5xl sm:text-6xl text-[#faf6f0] mb-3"
            style={{ textWrap: 'balance' }}
          >
            Promises for You
          </h1>
          <p className="font-serif-editorial text-lg text-[#faf6f0]/75">
            Tap each sealed envelope to break the wax and read my vow as it is written.
          </p>
          <p className="mt-4 font-mono-tabular text-xs text-[#d9b37c]">
            {openedIds.length} of {items.length} opened
          </p>
        </div>

        {/* Envelopes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {items.map((promise, idx) => {
            const isOpened = openedIds.includes(promise.id);
            return (
              <motion.button
                key={promise.id}
                type="button"
                onClick={() => setActivePromise(promise)}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: idx * 0.06 }}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="group relative text-left rounded-2xl overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: isOpened
                    ? 'linear-gradient(155deg, rgba(36, 26, 42, 0.72), rgba(20, 15, 25, 0.85))'
                    : 'linear-gradient(155deg, rgba(48, 30, 44, 0.88), rgba(24, 16, 28, 0.96))',
                  border: `1px solid ${isOpened ? 'rgba(217, 179, 124, 0.22)' : palette.border}`,
                  boxShadow: '0 18px 36px rgba(0, 0, 0, 0.35)',
                }}
              >
                {/* Envelope Geometric SVG Flap Lines */}
                <div className="relative h-48 sm:h-52 w-full flex flex-col items-center justify-center p-6">
                  <svg
                    viewBox="0 0 320 180"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    {/* Envelope body diagonal fold lines */}
                    <path
                      d="M0 180 L160 88 L320 180"
                      fill="none"
                      stroke="rgba(217, 179, 124, 0.16)"
                      strokeWidth="1.2"
                    />
                    {isOpened ? (
                      <path
                        d="M0 0 L160 54 L320 0"
                        fill="rgba(250, 246, 240, 0.03)"
                        stroke="rgba(217, 179, 124, 0.24)"
                        strokeWidth="1.2"
                      />
                    ) : (
                      <path
                        d="M0 0 L160 105 L320 0 Z"
                        fill="rgba(250, 246, 240, 0.04)"
                        stroke="rgba(217, 179, 124, 0.28)"
                        strokeWidth="1.2"
                      />
                    )}
                  </svg>

                  {/* Top left envelope number */}
                  <span className="absolute top-4 left-5 font-mono-tabular text-xs text-[#d9b37c]/85">
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  {/* Top right state */}
                  {isOpened && (
                    <span className="absolute top-4 right-5 inline-flex items-center gap-1.5 text-[11px] text-[#d9b37c]">
                      <MailOpen className="w-3.5 h-3.5" />
                      <span>Opened</span>
                    </span>
                  )}

                  {/* Wax Heart Seal (closed) or Open Letter Glimpse */}
                  {!isOpened ? (
                    <div
                      className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background:
                          'radial-gradient(circle at 35% 30%, #e26b7c 0%, #9f2d42 75%, #6e1a2a 100%)',
                        boxShadow:
                          '0 6px 18px rgba(159, 45, 66, 0.45), inset 0 2px 4px rgba(255,255,255,0.28)',
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#fbe7ea">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="relative z-10 flex flex-col items-center gap-1.5 text-[#faf6f0]/75">
                      <span className="text-2xl">{promise.icon || '❤️'}</span>
                      <span className="text-[11px] text-[#faf6f0]/55">Tap to read again</span>
                    </div>
                  )}

                  {/* Bottom label */}
                  <div className="absolute bottom-4 left-5 right-5 text-center">
                    <p className="font-serif-editorial text-base sm:text-lg font-medium text-[#faf6f0] truncate">
                      {promise.title}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <StepFooterControls
          onBack={onBack}
          onNext={onNext}
          nextLabel={settings.nextButtonLabels.promises || 'Next: Memory Lane 💕'}
          nextDisabled={!allOpened}
          disabledHint={
            !allOpened
              ? `Open all ${items.length} envelopes (${openedIds.length} of ${items.length} opened) to continue`
              : undefined
          }
          accent={settings.themeAccent}
        />
      </div>

      {/* 3D Opening Envelope + Live Handwritten Letter Modal */}
      <AnimatePresence>
        {activePromise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={activePromise.title}
          >
            <div className="relative w-full max-w-xl perspective-1000">
              {/* 3D Top Flap Opening Animation */}
              <motion.div
                initial={{ rotateX: 0, opacity: 1 }}
                animate={flapOpened ? { rotateX: -180, opacity: 0 } : { rotateX: 0, opacity: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: 'top center', transformStyle: 'preserve-3d' }}
                className="pointer-events-none absolute -top-2 left-4 right-4 h-24 rounded-t-2xl bg-gradient-to-b from-[#3d2538] to-[#281926] border border-[#d9b37c]/30 z-20"
              />

              {/* Sliding & Expanding Letter Parchment Card */}
              <motion.div
                initial={{ y: 48, scale: 0.86, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 24, scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.55, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-2xl p-7 sm:p-11 shadow-2xl border border-[#d9b37c]/35"
                style={{
                  background:
                    'linear-gradient(165deg, #fbf6ee 0%, #f5ecdf 55%, #efe2d0 100%)',
                  color: '#241822',
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseLetter}
                  aria-label="Close promise letter"
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#241822]/10 hover:bg-[#241822]/20 text-[#241822] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2.5 text-xs font-medium text-[#7e4a58] mb-3">
                  <span>{activePromise.icon || '❤️'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-serif-editorial italic text-sm">A Promise For You</span>
                </div>

                <h2 className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-[#241822] mb-5">
                  {activePromise.title}
                </h2>

                {/* Live Handwritten Typewriter with Reading Highlight + Blinking Pen Cursor */}
                <div className="min-h-[150px] py-2">
                  <p className="font-handwriting text-[1.75rem] sm:text-[2rem] leading-[1.45] text-[#2a1c24]">
                    {words.slice(0, visibleWords).map((word, wIdx) => {
                      const isCurrent = isTyping && wIdx === visibleWords - 1;
                      return (
                        <span key={`${activePromise.id}-w-${wIdx}`}>
                          <span
                            className="inline-block rounded px-1 -mx-0.5 transition-all duration-150"
                            style={
                              isCurrent
                                ? {
                                    backgroundColor: 'rgba(226, 135, 148, 0.28)',
                                    color: '#6b1d32',
                                  }
                                : undefined
                            }
                          >
                            {word}
                          </span>{' '}
                        </span>
                      );
                    })}
                    {/* Blinking Pen Cursor */}
                    <span
                      className="inline-flex items-center align-baseline ml-0.5 animate-pulse text-[#9f2d42]"
                      aria-hidden="true"
                    >
                      ✒️
                    </span>
                  </p>
                </div>

                <div className="mt-8 pt-5 border-t border-[#241822]/12 flex items-center justify-between">
                  <span className="font-handwriting text-xl text-[#7e4a58]">
                    With all my love, {settings.wifeName}
                  </span>
                  <button
                    type="button"
                    onClick={handleCloseLetter}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#241822] text-[#fbf6ee] hover:bg-[#382534] transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
