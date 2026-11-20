import { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, RotateCcw } from 'lucide-react';
import type { PublicSettings, WishItem } from '../types/app';
import { getThemePalette } from '../utils/theme';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { StepFooterControls } from '../components/StepNavigation';

interface WishesPageProps {
  items: WishItem[];
  settings: PublicSettings;
  onBack?: () => void;
  onNext: () => void;
}

const URDU_RE = /[\u0600-\u06FF]/;

export function WishesPage({ items, settings, onBack, onNext }: WishesPageProps) {
  const palette = getThemePalette(settings.themeAccent);
  const wish = items[0];
  const textBoxRef = useRef<HTMLDivElement>(null);
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  const [replayNonce, setReplayNonce] = useState(0);

  // Keep the author's own line breaks: every line stays its own line.
  const lines = useMemo(() => {
    const raw = wish ? wish.text.replace(/\r/g, '').split('\n') : [];
    let counter = 0;
    return raw.map((line) => {
      const words = line.trim().split(/\s+/).filter(Boolean);
      const start = counter;
      counter += words.length;
      return { words, start, urdu: URDU_RE.test(line) };
    });
  }, [wish]);

  const totalWords = lines.reduce((n, l) => n + l.words.length, 0);

  // Typing speed: change WORD_DELAY_MS to make it faster (smaller) or slower (bigger)
  const WORD_DELAY_MS = 300;
  const PUNCTUATION_PAUSE_MS = 250;
  const LINE_END_PAUSE_MS = 500;

  // Delay after each word: slower at punctuation and at the end of a line, so it can be read along
  const wordDelays = useMemo(() => {
    const delays: number[] = [];
    lines.forEach((line) => {
      line.words.forEach((word, wi) => {
        let d = WORD_DELAY_MS;
        if (/[.,!?;:،۔؟]$/.test(word)) d += PUNCTUATION_PAUSE_MS;
        if (wi === line.words.length - 1) d += LINE_END_PAUSE_MS;
        delays.push(d);
      });
    });
    return delays;
  }, [lines]);

  useEffect(() => {
    if (!wish || totalWords === 0) return;
    setVisibleWordCount(1);
    if (totalWords <= 1) return;
    let current = 1;
    let timer: number;
    const step = () => {
      timer = window.setTimeout(() => {
        current += 1;
        setVisibleWordCount(current);
        if (current < totalWords) step();
      }, wordDelays[current - 1] ?? WORD_DELAY_MS);
    };
    step();
    return () => window.clearTimeout(timer);
  }, [wish?.id, replayNonce, totalWords, wordDelays]);

  // Scroll the text box down while words are being written
  useEffect(() => {
    const box = textBoxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [visibleWordCount]);

  const isTyping = visibleWordCount < totalWords;
  const hasRealPhoto = Boolean(wish?.imageUrl && wish.imageUrl.trim().length > 0);

  return (
    <div className="min-h-screen px-4 sm:px-6 pt-24 pb-16 relative z-10 flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <p className="font-serif-editorial italic text-sm text-[#d9b37c] tracking-wide mb-2">
            From {settings.wifeName} to {settings.husbandName}
          </p>
          <h1 className="font-script text-5xl sm:text-6xl text-[#faf6f0]" style={{ textWrap: 'balance' }}>
            Birthday Wishes
          </h1>
        </div>

        {wish ? (
          <div className="glass-surface rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 items-stretch">
            {/* Photo: smaller, fixed height */}
            <div className="md:col-span-4 relative h-64 sm:h-72 md:h-auto md:min-h-[360px] md:max-h-[480px] bg-[#140e19]">
              {hasRealPhoto ? (
                <>
                  <ImageWithFallback
                    src={wish.imageUrl}
                    alt={wish.title}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0a10]/55 via-transparent to-transparent" />
                </>
              ) : (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
                  style={{
                    background: `radial-gradient(circle at 50% 42%, ${palette.glow} 0%, #1d1324 55%, #120b17 100%)`,
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-[#e28794]/12 border border-[#d9b37c]/35 flex items-center justify-center mb-3 text-[#e28794]">
                    <Heart className="w-5 h-5" />
                  </div>
                  <p className="font-serif-editorial italic text-lg text-[#faf6f0]/85">{wish.title}</p>
                </div>
              )}
            </div>

            {/* Text: line by line, scrolls inside if long */}
            <div className="md:col-span-8 p-5 sm:p-8 flex flex-col">
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="font-serif-editorial italic text-base text-[#d9b37c]">{wish.title}</span>
                <button
                  type="button"
                  onClick={() => setReplayNonce((n) => n + 1)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#faf6f0]/70 hover:text-[#faf6f0] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Replay</span>
                </button>
              </div>

              <div ref={textBoxRef} className="max-h-[50vh] md:max-h-[420px] overflow-y-auto pr-2 space-y-1">
                {lines.map((line, li) => {
                  if (line.words.length === 0) {
                    return <div key={li} className="h-3" aria-hidden="true" />;
                  }
                  if (line.start >= visibleWordCount) return null;
                  return (
                    <p
                      key={li}
                      dir="auto"
                      className={
                        line.urdu
                          ? 'text-xl sm:text-2xl text-[#faf6f0]/92'
                          : 'font-serif-editorial text-lg sm:text-xl leading-relaxed text-[#faf6f0]/92'
                      }
                      style={
                        line.urdu
                          ? {
                              fontFamily: "'Noto Nastaliq Urdu', 'Noto Naskh Arabic', serif",
                              lineHeight: 2.2,
                            }
                          : undefined
                      }
                    >
                      {line.words.map((word, wi) => {
                        const globalIndex = line.start + wi;
                        if (globalIndex >= visibleWordCount) return null;
                        const isCurrent = isTyping && globalIndex === visibleWordCount - 1;
                        return (
                          <span key={wi}>
                            <span
                              className="inline-block rounded px-0.5 transition-all duration-150"
                              style={
                                isCurrent
                                  ? {
                                      backgroundColor: palette.softBg,
                                      color: palette.secondary,
                                      boxShadow: `0 0 12px ${palette.glow}`,
                                    }
                                  : undefined
                              }
                            >
                              {word}
                            </span>{' '}
                          </span>
                        );
                      })}
                    </p>
                  );
                })}
                {isTyping && (
                  <span
                    className="inline-block w-[2px] h-5 align-middle animate-pulse"
                    style={{ backgroundColor: palette.primary }}
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-surface rounded-2xl p-10 text-center text-sm text-[#faf6f0]/65">
            No wishes added yet.
          </div>
        )}

        <StepFooterControls
          onBack={onBack}
          onNext={onNext}
          nextLabel={settings.nextButtonLabels.wishes || 'Next: Final Surprise ✨'}
          accent={settings.themeAccent}
        />
      </div>
    </div>
  );
}