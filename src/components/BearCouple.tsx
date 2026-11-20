import { motion, AnimatePresence } from 'motion/react';
import { getThemePalette } from '../utils/theme';

export type BearMood = 'idle' | 'bonk' | 'crying' | 'celebrating';

interface BearCoupleProps {
  mood: BearMood;
  palette: ReturnType<typeof getThemePalette>;
}

export function BearCouple({ mood, palette }: BearCoupleProps) {
  return (
  <svg
    viewBox="0 0 360 190"
    className="w-full max-w-[320px] h-full overflow-visible"
    aria-label="Animated bear couple reacting to your answer"
  >
    <ellipse cx="180" cy="172" rx="125" ry="11" fill="#000000" opacity="0.35" />

    {(mood === 'idle' || mood === 'celebrating') && (
      <motion.g
        animate={
          mood === 'celebrating'
            ? { y: [-4, -22, -4], scale: [1, 1.3, 1], opacity: [0.85, 1, 0.85] }
            : { y: [0, -8, 0], opacity: [0.65, 1, 0.65] }
        }
        transition={{ duration: mood === 'celebrating' ? 0.9 : 2.6, repeat: Infinity }}
      >
        <path
          d="M180 42 C173 30 155 34 157 48 C159 60 180 72 180 72 C180 72 201 60 203 48 C205 34 187 30 180 42 Z"
          fill={palette.primary}
        />
      </motion.g>
    )}

    {/* MALE BEAR */}
    <motion.g
      animate={
        mood === 'bonk'
          ? { x: [-6, 8, -7, 6, 0], y: [0, 5, 2, 4, 0], rotate: [0, -8, 6, -4, 0] }
          : mood === 'crying'
            ? { y: [0, 2, 0], rotate: -2 }
            : mood === 'celebrating'
              ? { x: 24, y: [0, -14, 0] }
              : { y: [0, -2.5, 0] }
      }
      transition={{
        duration: mood === 'bonk' ? 0.55 : mood === 'celebrating' ? 0.7 : 3,
        repeat: mood === 'bonk' ? 0 : Infinity,
      }}
      style={{ transformOrigin: '125px 130px' }}
    >
      <circle cx="94" cy="64" r="16" fill="#8b5a3c" />
      <circle cx="94" cy="64" r="9" fill="#c99574" />
      <circle cx="152" cy="64" r="16" fill="#8b5a3c" />
      <circle cx="152" cy="64" r="9" fill="#c99574" />
      <ellipse cx="123" cy="134" rx="34" ry="34" fill="#8b5a3c" />
      <ellipse cx="123" cy="138" rx="20" ry="22" fill="#d9ad8b" />
      <polygon points="113,118 123,123 113,128" fill={palette.primary} />
      <polygon points="133,118 123,123 133,128" fill={palette.primary} />
      <circle cx="123" cy="123" r="3" fill={palette.secondary} />
      <ellipse cx="123" cy="88" rx="36" ry="32" fill="#9c6644" />
      <ellipse cx="123" cy="96" rx="14" ry="11" fill="#e6c3a5" />
      <ellipse cx="123" cy="92" rx="5.5" ry="4" fill="#2c1b18" />

      {mood === 'bonk' ? (
        <g stroke="#2c1b18" strokeWidth="2.4" strokeLinecap="round">
          <path d="M104 82 L111 87 M111 82 L104 87" />
          <path d="M135 82 L142 87 M142 82 L135 87" />
        </g>
      ) : mood === 'crying' ? (
        <g>
          <path d="M103 85 Q108 81 113 85" fill="none" stroke="#2c1b18" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M133 85 Q138 81 143 85" fill="none" stroke="#2c1b18" strokeWidth="2.4" strokeLinecap="round" />
          <motion.path
            d="M106 90 Q102 99 106 104 Q110 99 106 90 Z"
            fill="#7cc6fe"
            animate={{ y: [0, 12, 0], opacity: [0.95, 0.2, 0.95] }}
            transition={{ duration: 0.95, repeat: Infinity }}
          />
          <motion.path
            d="M140 90 Q136 99 140 104 Q144 99 140 90 Z"
            fill="#7cc6fe"
            animate={{ y: [3, 14, 3], opacity: [0.9, 0.2, 0.9] }}
            transition={{ duration: 0.95, delay: 0.3, repeat: Infinity }}
          />
        </g>
      ) : mood === 'celebrating' ? (
        <g stroke="#2c1b18" strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d="M103 86 Q108 80 113 86" />
          <path d="M133 86 Q138 80 143 86" />
        </g>
      ) : (
        <g>
          <circle cx="108" cy="84" r="3.6" fill="#2c1b18" />
          <circle cx="109.2" cy="82.7" r="1.2" fill="#ffffff" />
          <circle cx="138" cy="84" r="3.6" fill="#2c1b18" />
          <circle cx="139.2" cy="82.7" r="1.2" fill="#ffffff" />
        </g>
      )}

      {mood === 'crying' || mood === 'bonk' ? (
        <path d="M117 103 Q123 97 129 103" fill="none" stroke="#2c1b18" strokeWidth="2.2" strokeLinecap="round" />
      ) : (
        <path d="M117 99 Q123 105 129 99" fill="none" stroke="#2c1b18" strokeWidth="2.2" strokeLinecap="round" />
      )}

      <ellipse cx="98" cy="93" rx="5.5" ry="3.2" fill="#e28794" opacity="0.55" />
      <ellipse cx="148" cy="93" rx="5.5" ry="3.2" fill="#e28794" opacity="0.55" />
      <ellipse cx="96" cy="132" rx="10" ry="8" fill="#8b5a3c" />
      <ellipse cx="152" cy="132" rx="10" ry="8" fill="#8b5a3c" />
      <ellipse cx="106" cy="166" rx="12" ry="8" fill="#77492f" />
      <ellipse cx="140" cy="166" rx="12" ry="8" fill="#77492f" />
    </motion.g>

    <AnimatePresence>
      {mood === 'bonk' && (
        <motion.g
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: [0.8, 1.2, 1], opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <polygon
            points="155,34 163,46 177,42 169,54 181,64 166,65 162,78 153,66 139,70 146,57 136,46 150,47"
            fill="#ffd166"
            stroke="#e63946"
            strokeWidth="2"
          />
          <text x="159" y="61" textAnchor="middle" fill="#1a0b12" fontSize="10" fontWeight="800">
            BONK!
          </text>
          <text x="108" y="42" fontSize="13">⭐</text>
          <text x="132" y="34" fontSize="11">💫</text>
        </motion.g>
      )}
    </AnimatePresence>

    {/* FEMALE BEAR */}
    <motion.g
      animate={
        mood === 'bonk'
          ? { x: -44, rotate: -14, y: -4 }
          : mood === 'crying'
            ? { x: -6, rotate: -4 }
            : mood === 'celebrating'
              ? { x: -24, y: [0, -14, 0] }
              : { y: [0, -2.5, 0] }
      }
      transition={{
        duration: mood === 'bonk' ? 0.32 : mood === 'celebrating' ? 0.7 : 3,
        delay: mood === 'idle' ? 0.4 : 0,
        repeat: mood === 'bonk' || mood === 'crying' ? 0 : Infinity,
      }}
      style={{ transformOrigin: '238px 130px' }}
    >
      <circle cx="211" cy="66" r="15" fill="#e6ccb2" />
      <circle cx="211" cy="66" r="8.5" fill="#f3b6c0" />
      <circle cx="265" cy="66" r="15" fill="#e6ccb2" />
      <circle cx="265" cy="66" r="8.5" fill="#f3b6c0" />
      <g transform="translate(254, 58) rotate(18)">
        <polygon points="-10,-6 0,0 -10,6" fill={palette.primary} />
        <polygon points="10,-6 0,0 10,6" fill={palette.primary} />
        <circle cx="0" cy="0" r="3.2" fill={palette.secondary} />
      </g>
      <ellipse cx="238" cy="135" rx="32" ry="33" fill="#e6ccb2" />
      <ellipse cx="238" cy="139" rx="19" ry="21" fill="#faf0e6" />
      <ellipse cx="238" cy="90" rx="34" ry="30" fill="#edd6be" />
      <ellipse cx="238" cy="97" rx="13" ry="10" fill="#fff7ee" />
      <ellipse cx="238" cy="93" rx="5" ry="3.8" fill="#3a2521" />

      {mood === 'bonk' || mood === 'crying' ? (
        <g>
          <line x1="217" y1="78" x2="229" y2="83" stroke="#3a2521" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="259" y1="78" x2="247" y2="83" stroke="#3a2521" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="224" cy="86" r="3.4" fill="#3a2521" />
          <circle cx="252" cy="86" r="3.4" fill="#3a2521" />
          <path d="M232 103 Q238 99 244 103" fill="none" stroke="#3a2521" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      ) : mood === 'celebrating' ? (
        <g stroke="#3a2521" strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d="M219 87 Q224 81 229 87" />
          <path d="M247 87 Q252 81 257 87" />
          <path d="M232 100 Q238 106 244 100" strokeWidth="2.2" />
        </g>
      ) : (
        <g>
          <circle cx="224" cy="86" r="3.5" fill="#3a2521" />
          <circle cx="225.2" cy="84.7" r="1.1" fill="#ffffff" />
          <circle cx="252" cy="86" r="3.5" fill="#3a2521" />
          <circle cx="253.2" cy="84.7" r="1.1" fill="#ffffff" />
          <path d="M232 100 Q238 105 244 100" fill="none" stroke="#3a2521" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}

      <ellipse cx="213" cy="94" rx="5.5" ry="3.2" fill="#e28794" opacity="0.6" />
      <ellipse cx="263" cy="94" rx="5.5" ry="3.2" fill="#e28794" opacity="0.6" />
      <motion.ellipse
        cx="206"
        cy="128"
        rx="11"
        ry="8"
        fill="#e6ccb2"
        animate={
          mood === 'bonk'
            ? { cx: 184, cy: 102, rotate: -35 }
            : { cx: 208, cy: 132, rotate: 0 }
        }
        transition={{ duration: 0.25 }}
      />
      <ellipse cx="266" cy="132" rx="10" ry="8" fill="#e6ccb2" />
      <ellipse cx="222" cy="166" rx="11" ry="7.5" fill="#d5b89c" />
      <ellipse cx="254" cy="166" rx="11" ry="7.5" fill="#d5b89c" />
    </motion.g>
  </svg>
  );
}
