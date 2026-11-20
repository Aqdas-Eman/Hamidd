import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Gift, Heart, Lock, RotateCcw } from 'lucide-react';
import type { PublicSettings } from '../types/app';
import { getThemePalette } from '../utils/theme';
import { ImageWithFallback } from '../components/ImageWithFallback';

interface SurprisePageProps {
  settings: PublicSettings;
  onBack?: () => void;
  onReplayJourney: () => void;
  onOpenAdmin: () => void;
}

export function SurprisePage({
  settings,
  onBack,
  onReplayJourney,
  onOpenAdmin,
}: SurprisePageProps) {
  const palette = getThemePalette(settings.themeAccent);
  const [opened, setOpened] = useState(false);
  const [visibleWords, setVisibleWords] = useState(0);

  // Split letter preserving newlines so paragraphs type smoothly word by word
  const tokens = useMemo(() => {
    return settings.finalLetter.split(/(\s+)/).filter((t) => t.length > 0);
  }, [settings.finalLetter]);

  const wordIndices = useMemo(() => {
    const indices: number[] = [];
    tokens.forEach((tok, idx) => {
      if (!/^\s+$/.test(tok)) indices.push(idx);
    });
    return indices;
  }, [tokens]);

  useEffect(() => {
    if (!opened) return;
    setVisibleWords(1);
    const total = wordIndices.length;
    if (total <= 1) return;

    const timer = window.setInterval(() => {
      setVisibleWords((prev) => {
        if (prev >= total) {
          window.clearInterval(timer);
          return total;
        }
        return prev + 1;
      });
    }, 115);

    return () => window.clearInterval(timer);
  }, [opened, wordIndices.length]);

  const handleOpen = () => {
    setOpened(true);
    const colors = ['#e28794', '#d9b37c', '#faf6f0', '#f7b2bd'];
    confetti({ particleCount: 95, spread: 85, origin: { y: 0.6 }, colors });
    window.setTimeout(() => {
      confetti({ particleCount: 60, angle: 60, spread: 65, origin: { x: 0.12, y: 0.65 }, colors });
      confetti({ particleCount: 60, angle: 120, spread: 65, origin: { x: 0.88, y: 0.65 }, colors });
    }, 340);
  };

  const maxTokenIndex =
    visibleWords > 0 && visibleWords <= wordIndices.length
      ? wordIndices[visibleWords - 1]
      : visibleWords > wordIndices.length
        ? tokens.length - 1
        : -1;
  const isTyping = opened && visibleWords < wordIndices.length;
  const hasRealMedia = Boolean(
    settings.finalMediaUrl && settings.finalMediaUrl.trim().length > 0
  );

  return (
    <div className="min-h-screen px-4 sm:px-6 pt-24 pb-16 relative z-10 flex flex-col justify-between">
      <div className="max-w-3xl mx-auto w-full my-auto">
        <div className="text-center mb-10">
          <p className="font-serif-editorial italic text-sm text-[#d9b37c] tracking-wide mb-2">
            From {settings.wifeName} to {settings.husbandName}
          </p>
          <h1
            className="font-script text-5xl sm:text-6xl text-[#faf6f0]"
            style={{ textWrap: 'balance' }}
          >
            {settings.finalSurpriseTitle}
          </h1>
        </div>

        <AnimatePresence mode="wait">
          {!opened ? (
            <motion.div
              key="sealed"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="glass-surface rounded-2xl p-10 sm:p-14 text-center max-w-xl mx-auto"
            >
              <div
                className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ backgroundColor: palette.softBg, border: `1px solid ${palette.border}` }}
              >
                <Gift className="w-7 h-7" style={{ color: palette.primary }} />
              </div>
              <p className="font-serif-editorial text-xl text-[#faf6f0]/85 leading-relaxed mb-8">
                You made it through every chapter of our story. Ready for my final letter to you?
              </p>
              <button
                type="button"
                onClick={handleOpen}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-sm font-semibold text-[#120c14] shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{
                  backgroundColor: palette.primary,
                  boxShadow: `0 0 28px ${palette.glow}`,
                }}
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>Open your surprise</span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="glass-surface rounded-2xl p-6 sm:p-12"
            >
              {hasRealMedia && (
                <div className="mb-8 rounded-2xl overflow-hidden max-h-[420px] bg-[#130e17] border border-[#faf6f0]/10">
                  {settings.finalMediaType === 'video' ? (
                    <video
                      src={settings.finalMediaUrl}
                      controls
                      className="w-full max-h-[420px] object-contain mx-auto"
                    />
                  ) : (
                    <ImageWithFallback
                      src={settings.finalMediaUrl}
                      alt={settings.finalSurpriseTitle}
                      className="w-full max-h-[420px] object-cover"
                    />
                  )}
                </div>
              )}

              {/* Word-by-word Typewriter Love Letter */}
              <div className="font-serif-editorial text-xl sm:text-[1.4rem] leading-[1.85] text-[#faf6f0]/92 whitespace-pre-wrap">
                {tokens.slice(0, maxTokenIndex + 1).map((tok, idx) => {
                  const isCurrentWord = isTyping && idx === maxTokenIndex;
                  if (/^\s+$/.test(tok)) {
                    return <span key={idx}>{tok}</span>;
                  }
                  return (
                    <span
                      key={idx}
                      className="inline-block rounded px-0.5 -mx-0.5 transition-all duration-150"
                      style={
                        isCurrentWord
                          ? {
                              backgroundColor: palette.softBg,
                              color: palette.secondary,
                              boxShadow: `0 0 12px ${palette.glow}`,
                            }
                          : undefined
                      }
                    >
                      {tok}
                    </span>
                  );
                })}
                {isTyping && (
                  <span
                    className="inline-block w-[2px] h-5 align-middle ml-1 animate-pulse"
                    style={{ backgroundColor: palette.primary }}
                    aria-hidden="true"
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Step Controls */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-[#faf6f0]/65 hover:text-[#faf6f0] border border-[#faf6f0]/12 hover:border-[#faf6f0]/28 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
          <button
            type="button"
            onClick={onReplayJourney}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium text-[#faf6f0]/80 hover:text-[#faf6f0] border border-[#faf6f0]/15 hover:border-[#d9b37c]/45 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay From Beginning</span>
          </button>
        </div>
      </div>

      {/* Discreet footer link for Admin Studio */}
      <footer className="mt-12 pt-6 border-t border-[#faf6f0]/10 max-w-3xl mx-auto w-full flex items-center justify-between text-xs text-[#faf6f0]/45">
        <span>{settings.coupleNames}</span>
        <button
          type="button"
          onClick={onOpenAdmin}
          className="inline-flex items-center gap-1.5 hover:text-[#d9b37c] transition-colors cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Admin Studio</span>
        </button>
      </footer>
    </div>
  );
}
