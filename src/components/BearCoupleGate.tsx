import {
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowLeft, ArrowRight, CalendarHeart, Lock, Sparkles } from 'lucide-react';
import type { PublicSettings, VerifyGateResponse } from '../types/app';
import { getThemePalette } from '../utils/theme';
import { BearCouple, type BearMood } from './BearCouple';

interface BearCoupleGateProps {
  gate?: 'gate1' | 'gate2';
  settings: PublicSettings;
  onUnlock: () => void;
  onBack?: () => void;
  onOpenAdmin?: () => void;
}


export function BearCoupleGate({
  gate = 'gate1',
  settings,
  onUnlock,
  onBack,
  onOpenAdmin,
}: BearCoupleGateProps) {
  const palette = getThemePalette(settings.themeAccent);
  const isGate2 = gate === 'gate2';

  const title = isGate2 ? settings.gate2Title : settings.gateTitle;
  const question = isGate2 ? settings.gate2Question : settings.gateQuestion;
  const hints = isGate2 ? settings.gate2Hints : settings.hints;
  const defaultSuccess = isGate2
    ? settings.gate2SuccessMessage || `Yes! You remembered our official day, ${settings.husbandName} 💕`
    : settings.gate1SuccessMessage || `Yes! You remembered our day, ${settings.husbandName} ❤️`;

  const [digits, setDigits] = useState<string[]>(Array(8).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [mood, setMood] = useState<BearMood>('idle');
  const [feedback, setFeedback] = useState<string>('');
  const [extraHint, setExtraHint] = useState<string>('');
  const [checking, setChecking] = useState(false);
  const [curtainOpen, setCurtainOpen] = useState(false);

  const code = digits.join('');
  const isComplete = code.length === 8 && /^\d{8}$/.test(code);

  const handleDigitChange = (idx: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (!cleaned) {
      const next = [...digits];
      next[idx] = '';
      setDigits(next);
      return;
    }

    // Handle multi-digit paste or fast mobile autofill
    if (cleaned.length > 1) {
      const next = [...digits];
      for (let i = 0; i < cleaned.length && idx + i < 8; i++) {
        next[idx + i] = cleaned[i];
      }
      setDigits(next);
      const focusIdx = Math.min(7, idx + cleaned.length);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    const next = [...digits];
    next[idx] = cleaned[0];
    setDigits(next);
    if (idx < 7) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = '';
        setDigits(next);
      } else if (idx > 0) {
        const next = [...digits];
        next[idx - 1] = '';
        setDigits(next);
        inputRefs.current[idx - 1]?.focus();
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < 7) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(8).fill('');
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    const focusIdx = Math.min(7, pasted.length);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (checking || mood === 'celebrating') return;

    if (!isComplete) {
      setFeedback('Please enter all 8 digits in DD MM YYYY format.');
      return;
    }

    const nextAttempt = attempts + 1;
    setChecking(true);

    try {
      const res = await fetch('/api/gate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gate, code, attempt: nextAttempt }),
      });
      const data = (await res.json()) as VerifyGateResponse;

      if (data.ok) {
        setMood('celebrating');
        setFeedback(data.message || defaultSuccess);
        setExtraHint('');

        confetti({
          particleCount: 95,
          spread: 78,
          origin: { y: 0.55 },
          colors: ['#e28794', '#d9b37c', '#faf6f0', '#f4a2b1'],
        });

        window.setTimeout(() => {
          setCurtainOpen(true);
        }, 1250);

        window.setTimeout(() => {
          onUnlock();
        }, 2150);
      } else {
        setAttempts(nextAttempt);
        setFeedback(data.message || 'Wrong! Go back, you forgot our day 😤');
        if (data.extraHint) {
          setExtraHint(data.extraHint);
        }
        setMood('bonk');
        window.setTimeout(() => {
          setMood((prev) => (prev === 'bonk' ? 'crying' : prev));
        }, 680);
      }
    } catch {
      setFeedback('Could not verify right now. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const renderDigitBox = (idx: number) => (
    <input
      key={idx}
      ref={(el) => {
        inputRefs.current[idx] = el;
      }}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={1}
      autoComplete="off"
      aria-label={`Date digit ${idx + 1}`}
      value={digits[idx]}
      onChange={(e) => handleDigitChange(idx, e.target.value)}
      onKeyDown={(e) => handleKeyDown(idx, e)}
      onPaste={handlePaste}
      className="w-9 h-12 sm:w-11 sm:h-14 rounded-xl bg-[#130e17] border border-[#faf6f0]/18 text-center font-mono-tabular text-lg sm:text-xl font-semibold text-[#faf6f0] focus:outline-none focus:border-[#d9b37c] focus:ring-2 focus:ring-[#d9b37c]/30 transition-all"
    />
  );

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 overflow-hidden z-10">
      {/* Split Velvet Curtain / Door Opening Overlay */}
      <AnimatePresence>
        {curtainOpen && (
          <div className="fixed inset-0 z-50 pointer-events-none flex">
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: '-100%' }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="w-1/2 h-full bg-gradient-to-r from-[#0a070d] via-[#1b1121] to-[#261628] border-r border-[#d9b37c]/30"
            />
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: '100%' }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="w-1/2 h-full bg-gradient-to-l from-[#0a070d] via-[#1b1121] to-[#261628] border-l border-[#d9b37c]/30"
            />
          </div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl glass-surface rounded-2xl p-6 sm:p-10 shadow-2xl relative"
      >
        {/* Sweet editable hints at the top */}
        {hints.length > 0 && (
          <div className="mb-6 pb-5 border-b border-[#faf6f0]/10 text-center space-y-1.5">
            <p className="text-xs font-medium text-[#d9b37c] tracking-wide">
              Little Clues From {settings.wifeName}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs sm:text-sm text-[#faf6f0]/75">
              {hints.map((hint, idx) => (
                <span key={idx} className="inline-flex items-center gap-2">
                  {idx > 0 && (
                    <span aria-hidden="true" className="text-[#d9b37c]/50">
                      ·
                    </span>
                  )}
                  <span>{hint}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Heading */}
        <div className="text-center mb-3">
          <h1
            className="font-script text-4xl sm:text-5xl text-[#faf6f0] leading-tight mb-2"
            style={{ textWrap: 'balance' }}
          >
            {title}
          </h1>
          <p className="font-serif-editorial text-lg sm:text-xl text-[#faf6f0]/82">{question}</p>
        </div>

        {/* Original Animated Cartoon Bear Couple SVG */}
        <div className="relative flex justify-center items-center my-3 h-44 sm:h-48 select-none">
          <BearCouple mood={mood} palette={palette} />
        </div>

        {/* Dynamic reaction message */}
        <AnimatePresence mode="wait">
          {feedback && (
            <motion.div
              key={feedback}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-5 text-center px-4 py-3 rounded-xl text-sm font-medium"
              style={{
                backgroundColor:
                  mood === 'celebrating' ? 'rgba(217, 179, 124, 0.16)' : 'rgba(226, 135, 148, 0.14)',
                border: `1px solid ${
                  mood === 'celebrating' ? 'rgba(217, 179, 124, 0.35)' : 'rgba(226, 135, 148, 0.3)'
                }`,
                color: mood === 'celebrating' ? '#f7dcb4' : '#ffd5dc',
              }}
            >
              <p>{feedback}</p>
              {extraHint && <p className="mt-1.5 text-xs text-[#d9b37c]">{extraHint}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 8-Digit OTP-Style DD MM YYYY Input */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center gap-6 sm:gap-8 text-[11px] font-mono-tabular tracking-widest text-[#d9b37c]/80 mb-2">
              <span>DD</span>
              <span>MM</span>
              <span>YYYY</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1">
                {renderDigitBox(0)}
                {renderDigitBox(1)}
              </div>
              <span className="text-[#d9b37c]/40 font-mono-tabular px-0.5" aria-hidden="true">
                /
              </span>
              <div className="flex items-center gap-1">
                {renderDigitBox(2)}
                {renderDigitBox(3)}
              </div>
              <span className="text-[#d9b37c]/40 font-mono-tabular px-0.5" aria-hidden="true">
                /
              </span>
              <div className="flex items-center gap-1">
                {renderDigitBox(4)}
                {renderDigitBox(5)}
                {renderDigitBox(6)}
                {renderDigitBox(7)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="min-h-[46px] px-4 py-3 rounded-xl text-xs font-medium text-[#faf6f0]/75 hover:text-[#faf6f0] border border-[#faf6f0]/15 hover:border-[#faf6f0]/30 transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
            <button
              type="submit"
              disabled={checking || mood === 'celebrating' || !isComplete}
              className="flex-1 min-h-[46px] px-6 py-3 rounded-xl font-semibold text-sm text-[#120c14] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shadow-lg"
              style={{
                backgroundColor: palette.primary,
                boxShadow: isComplete ? `0 0 24px ${palette.glow}` : undefined,
              }}
            >
              {mood === 'celebrating' ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Unlocking Next Chapter...</span>
                </>
              ) : (
                <>
                  <CalendarHeart className="w-4 h-4" />
                  <span>{checking ? 'Checking Memory...' : 'Unlock'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-[#faf6f0]/10 flex items-center justify-between text-xs text-[#faf6f0]/50">
          <span>Crafted for {settings.coupleNames}</span>
          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 hover:text-[#d9b37c] transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Studio</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
