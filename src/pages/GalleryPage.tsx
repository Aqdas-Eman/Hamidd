import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Heart, X } from 'lucide-react';
import type { GalleryItem, PublicSettings } from '../types/app';
import { getThemePalette } from '../utils/theme';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { StepFooterControls } from '../components/StepNavigation';

interface GalleryPageProps {
  items: GalleryItem[];
  settings: PublicSettings;
  onBack?: () => void;
  onNext: () => void;
}

// How many panels are visible at the same time in the "wardrobe" strip
const WINDOW_SIZE = 5;

const hasPhoto = (item?: GalleryItem) => Boolean(item?.imageUrl && item.imageUrl.trim().length > 0);

export function GalleryPage({ items, settings, onBack, onNext }: GalleryPageProps) {
  const palette = getThemePalette(settings.themeAccent);
  const total = items.length;
  const [active, setActive] = useState(Math.min(2, Math.max(0, total - 1)));
  const [lightbox, setLightbox] = useState<number | null>(null);

  const safeActive = Math.min(active, Math.max(0, total - 1));
  const start = Math.max(0, Math.min(safeActive - 2, total - WINDOW_SIZE));
  const visible = items.slice(start, start + WINDOW_SIZE);

  const photoIndexes = items.map((it, i) => (hasPhoto(it) ? i : -1)).filter((i) => i >= 0);

  const goPrev = () => setActive((a) => Math.max(0, Math.min(a, total - 1) - 1));
  const goNext = () => setActive((a) => Math.min(total - 1, Math.min(a, total - 1) + 1));

  const lightboxStep = (dir: 1 | -1) => {
    setLightbox((curr) => {
      if (curr === null || photoIndexes.length === 0) return curr;
      const pos = photoIndexes.indexOf(curr);
      const nextPos = (pos + dir + photoIndexes.length) % photoIndexes.length;
      return photoIndexes[nextPos];
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightbox !== null) {
        if (e.key === 'Escape') setLightbox(null);
        if (e.key === 'ArrowRight') lightboxStep(1);
        if (e.key === 'ArrowLeft') lightboxStep(-1);
        return;
      }
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, total, photoIndexes.length]);

  const lightboxItem = lightbox !== null ? items[lightbox] : null;

  return (
    <div className="min-h-screen px-3 sm:px-6 pt-20 pb-8 relative z-10 flex flex-col">
      <div className="text-center mb-4 sm:mb-5">
        <p className="font-serif-editorial italic text-sm text-[#d9b37c] tracking-wide mb-1">
          {settings.coupleNames}
        </p>
        <h1 className="font-script text-4xl sm:text-6xl text-[#faf6f0]" style={{ textWrap: 'balance' }}>
          Through My Eyes
        </h1>
      </div>

      {total === 0 ? (
        <div className="glass-surface rounded-2xl p-10 text-center text-sm text-[#faf6f0]/65 max-w-xl mx-auto">
          No photos added yet. Upload from Admin Studio.
        </div>
      ) : (
        <>
          {/* Expanding panels: the selected photo opens wide, the others stay as narrow strips */}
          <div className="flex flex-col md:flex-row gap-2 sm:gap-3 h-[62vh] md:h-[70vh] w-full max-w-7xl mx-auto">
            {visible.map((item, i) => {
              const globalIndex = start + i;
              const isActive = globalIndex === safeActive;
              const photo = hasPhoto(item);
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  aria-label={item.caption || `Photo ${globalIndex + 1}`}
                  onClick={() => (isActive ? (photo ? setLightbox(globalIndex) : undefined) : setActive(globalIndex))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (isActive) {
                        if (photo) setLightbox(globalIndex);
                      } else {
                        setActive(globalIndex);
                      }
                    }
                  }}
                  className="relative min-h-0 min-w-0 overflow-hidden rounded-2xl cursor-pointer bg-[#140e19] border border-[#faf6f0]/10"
                  style={{
                    flexGrow: isActive ? 7 : 1,
                    flexBasis: 0,
                    transition: 'flex-grow 0.65s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    boxShadow: isActive ? `0 18px 50px rgba(0,0,0,0.55), 0 0 0 1px ${palette.primary}55` : undefined,
                  }}
                >
                  {photo ? (
                    <ImageWithFallback
                      src={item.imageUrl}
                      alt={item.caption || `Photo ${globalIndex + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center text-center p-4"
                      style={{
                        background: `radial-gradient(circle at 50% 40%, ${palette.glow} 0%, #1d1324 55%, #120b17 100%)`,
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-[#e28794]/12 border border-[#d9b37c]/35 flex items-center justify-center text-[#e28794]">
                        <Heart className="w-5 h-5" />
                      </div>
                      {isActive && (
                        <p className="font-serif-editorial italic text-base text-[#faf6f0]/80 mt-3">
                          Sample — replace from admin
                        </p>
                      )}
                    </div>
                  )}

                  {/* Dim the closed panels, light up the open one */}
                  <div
                    className="absolute inset-0 transition-colors duration-500 pointer-events-none"
                    style={{ backgroundColor: isActive ? 'rgba(13,10,16,0)' : 'rgba(13,10,16,0.5)' }}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0d0a10]/85 to-transparent pointer-events-none" />

                  {!isActive && (
                    <span className="absolute left-3 bottom-3 font-mono-tabular text-xs text-[#faf6f0]/80">
                      {String(globalIndex + 1).padStart(2, '0')}
                    </span>
                  )}

                  <AnimatePresence>
                    {isActive && (item.caption || item.capturedDate) && (
                      <motion.div
                        key="caption"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.45, delay: 0.25 }}
                        className="absolute inset-x-0 bottom-0 p-4 sm:p-6 text-left"
                      >
                        {item.capturedDate && (
                          <p className="text-xs tracking-widest text-[#d9b37c] mb-1">{item.capturedDate}</p>
                        )}
                        {item.caption && (
                          <p className="font-script text-3xl sm:text-4xl text-[#faf6f0] leading-tight">
                            {item.caption}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              type="button"
              onClick={goPrev}
              disabled={safeActive === 0}
              aria-label="Previous photo"
              className="w-10 h-10 rounded-full border border-[#faf6f0]/20 flex items-center justify-center text-[#faf6f0]/85 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-[#faf6f0]/70 tabular-nums min-w-[64px] text-center">
              {safeActive + 1} / {total}
            </span>
            <button
              type="button"
              onClick={goNext}
              disabled={safeActive === total - 1}
              aria-label="Next photo"
              className="w-10 h-10 rounded-full border border-[#faf6f0]/20 flex items-center justify-center text-[#faf6f0]/85 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-[11px] text-[#faf6f0]/45 mt-2">
            Tap a photo to open it, tap the open photo again to see it full screen
          </p>
        </>
      )}

      <StepFooterControls
        onBack={onBack}
        onNext={onNext}
        nextLabel={settings.nextButtonLabels.gallery || 'Next: Birthday Wishes 💕'}
        accent={settings.themeAccent}
      />

      {/* Full screen viewer */}
      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            {photoIndexes.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous"
                  onClick={(e) => {
                    e.stopPropagation();
                    lightboxStep(-1);
                  }}
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  onClick={(e) => {
                    e.stopPropagation();
                    lightboxStep(1);
                  }}
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            <div className="max-w-[94vw] max-h-[92vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <ImageWithFallback
                src={lightboxItem.imageUrl}
                alt={lightboxItem.caption}
                className="max-w-[94vw] max-h-[82vh] object-contain rounded-lg"
              />
              {(lightboxItem.caption || lightboxItem.capturedDate) && (
                <p className="mt-3 text-center text-[#faf6f0]/85 font-serif-editorial text-lg">
                  {lightboxItem.caption}
                  {lightboxItem.capturedDate ? ` · ${lightboxItem.capturedDate}` : ''}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}