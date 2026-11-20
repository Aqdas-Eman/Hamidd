import { motion } from 'motion/react';
import type { PublicSettings, TimelineItem } from '../types/app';
import { getThemePalette } from '../utils/theme';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { StepFooterControls } from '../components/StepNavigation';

interface StoryPageProps {
  items: TimelineItem[];
  settings: PublicSettings;
  onBack?: () => void;
  onNext: () => void;
}

export function StoryPage({ items, settings, onBack, onNext }: StoryPageProps) {
  const palette = getThemePalette(settings.themeAccent);

  return (
    <div className="min-h-screen px-4 sm:px-6 pt-24 pb-16 relative z-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="font-serif-editorial italic text-sm text-[#d9b37c] tracking-wide mb-2">
            Chapter One
          </p>
          <h1
            className="font-script text-5xl sm:text-6xl text-[#faf6f0] mb-4"
            style={{ textWrap: 'balance' }}
          >
            Our Story
          </h1>
          <p className="font-serif-editorial text-lg sm:text-xl text-[#faf6f0]/75">
            From our very first meeting to every quiet and unforgettable milestone since.
          </p>
        </div>

        <div className="relative">
          <div
            className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#d9b37c]/35 to-transparent sm:-translate-x-1/2"
            aria-hidden="true"
          />

          <div className="space-y-12">
            {items.map((item, idx) => {
              const isLeft = idx % 2 === 0;
              const hasPhoto = Boolean(item.imageUrl && item.imageUrl.trim().length > 0);
              return (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="relative grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-12 items-center"
                >
                  <div
                    className="absolute left-4 sm:left-1/2 top-6 sm:top-1/2 w-3.5 h-3.5 rounded-full -translate-x-1/2 sm:-translate-y-1/2 ring-4 ring-[#0d0a10] z-10"
                    style={{
                      backgroundColor: item.isFirstMeeting ? palette.primary : palette.secondary,
                    }}
                    aria-hidden="true"
                  />

                  <div
                    className={`pl-11 sm:pl-0 ${
                      isLeft ? 'sm:pr-8 sm:text-right' : 'sm:col-start-2 sm:pl-8'
                    }`}
                  >
                    <div className="glass-surface rounded-2xl p-6 sm:p-7">
                      <div
                        className={`flex items-center gap-2 text-xs text-[#d9b37c] mb-2 ${
                          isLeft ? 'sm:justify-end' : ''
                        }`}
                      >
                        <span className="tabular-nums font-medium">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.dateLabel}</span>
                        {item.isFirstMeeting && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span style={{ color: palette.primary }}>First Meeting</span>
                          </>
                        )}
                      </div>
                      <h2 className="font-serif-editorial text-2xl font-semibold text-[#faf6f0] mb-2">
                        {item.title}
                      </h2>
                      <p className="text-sm text-[#faf6f0]/75 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`pl-11 sm:pl-0 ${
                      isLeft ? 'sm:col-start-2 sm:pl-8' : 'sm:col-start-1 sm:row-start-1 sm:pr-8'
                    }`}
                  >
                    <div className="rounded-2xl overflow-hidden aspect-[4/3] glass-surface-soft">
                      <ImageWithFallback
                        src={hasPhoto ? item.imageUrl : ''}
                        alt={item.title}
                        fallbackTitle={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>

        <StepFooterControls
          onBack={onBack}
          onNext={onNext}
          nextLabel={settings.nextButtonLabels.story || 'Next: My Promises 💕'}
          accent={settings.themeAccent}
        />
      </div>
    </div>
  );
}
