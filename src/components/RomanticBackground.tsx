import { motion } from 'motion/react';
import type { ThemeAccent } from '../types/app';
import { getThemePalette } from '../utils/theme';

interface RomanticBackgroundProps {
  accent?: ThemeAccent;
  subtle?: boolean;
}

const PARTICLES = [
  { id: 1, x: '8%', y: '18%', size: 12, delay: 0, duration: 14, kind: 'heart' },
  { id: 2, x: '22%', y: '72%', size: 8, delay: 2.5, duration: 17, kind: 'spark' },
  { id: 3, x: '36%', y: '34%', size: 10, delay: 1.2, duration: 15, kind: 'heart' },
  { id: 4, x: '54%', y: '82%', size: 7, delay: 3.4, duration: 19, kind: 'spark' },
  { id: 5, x: '68%', y: '24%', size: 11, delay: 0.8, duration: 16, kind: 'heart' },
  { id: 6, x: '82%', y: '62%', size: 8, delay: 4.1, duration: 18, kind: 'spark' },
  { id: 7, x: '91%', y: '29%', size: 10, delay: 2.0, duration: 15, kind: 'heart' },
  { id: 8, x: '15%', y: '48%', size: 6, delay: 5.0, duration: 20, kind: 'spark' },
];

export function RomanticBackground({ accent = 'rose-gold', subtle = false }: RomanticBackgroundProps) {
  const palette = getThemePalette(accent);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
      {/* Deep velvet night base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 18% 15%, ${palette.glow} 0%, transparent 45%),
                       radial-gradient(circle at 82% 28%, rgba(217, 179, 124, 0.12) 0%, transparent 42%),
                       radial-gradient(circle at 50% 85%, ${palette.softBg} 0%, transparent 50%),
                       linear-gradient(180deg, #0d0a10 0%, #140e19 52%, #0c0910 100%)`,
        }}
      />

      {/* Floating gentle hearts & sparkles */}
      {!subtle &&
        PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute"
            style={{ left: p.x, top: p.y }}
            animate={{
              y: [-16, -54, -16],
              x: [-6, 8, -6],
              opacity: [0.14, 0.42, 0.14],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {p.kind === 'heart' ? (
              <svg
                width={p.size}
                height={p.size}
                viewBox="0 0 24 24"
                fill={palette.primary}
                opacity="0.45"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <svg
                width={p.size}
                height={p.size}
                viewBox="0 0 24 24"
                fill={palette.secondary}
                opacity="0.55"
              >
                <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z" />
              </svg>
            )}
          </motion.div>
        ))}
    </div>
  );
}
