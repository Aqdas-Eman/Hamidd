import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import type { ThemeAccent } from '../types/app';
import { getThemePalette } from '../utils/theme';

interface MusicPlayerProps {
  musicUrl?: string;
  accent?: ThemeAccent;
}

const CHORD_SEQUENCE = [
  [261.63, 329.63, 392.0, 493.88],
  [220.0, 261.63, 329.63, 392.0],
  [174.61, 220.0, 261.63, 329.63],
  [196.0, 246.94, 293.66, 329.63],
];

export function MusicPlayer({ musicUrl, accent = 'rose-gold' }: MusicPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const stepRef = useRef(0);
  const palette = getThemePalette(accent);

  const stopAmbientSynth = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
  };

  const startAmbientSynth = () => {
    stopAmbientSynth();
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    ctxRef.current = ctx;

    const playNote = (freq: number, delaySec: number, durationSec: number) => {
      if (!ctxRef.current || ctxRef.current.state === 'closed') return;
      const now = ctx.currentTime + delaySec;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.036, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + durationSec + 0.05);
    };

    const triggerBar = () => {
      const chord = CHORD_SEQUENCE[stepRef.current % CHORD_SEQUENCE.length];
      stepRef.current += 1;
      chord.forEach((freq, idx) => {
        playNote(freq, idx * 0.42, 2.4);
      });
    };

    triggerBar();
    timerRef.current = window.setInterval(triggerBar, 2600);
  };

  useEffect(() => {
    return () => {
      stopAmbientSynth();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (musicUrl && musicUrl.trim().length > 0) {
      stopAmbientSynth();
      if (audioRef.current) {
        audioRef.current.src = musicUrl;
        audioRef.current.play().catch(() => {});
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      startAmbientSynth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicUrl]);

  const toggle = async () => {
    if (playing) {
      if (audioRef.current) audioRef.current.pause();
      stopAmbientSynth();
      setPlaying(false);
      return;
    }

    if (musicUrl && musicUrl.trim().length > 0) {
      if (!audioRef.current) {
        const el = new Audio(musicUrl);
        el.loop = true;
        el.volume = 0.55;
        audioRef.current = el;
      } else {
        audioRef.current.src = musicUrl;
      }
      try {
        await audioRef.current.play();
        setPlaying(true);
      } catch {
        startAmbientSynth();
        setPlaying(true);
      }
    } else {
      startAmbientSynth();
      setPlaying(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? 'Mute background music' : 'Play background music'}
      title={playing ? 'Mute music' : 'Play music'}
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-40 w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
      style={{
        backgroundColor: playing ? palette.softBg : 'rgba(22, 16, 26, 0.72)',
        border: `1px solid ${playing ? palette.primary : 'rgba(217, 179, 124, 0.25)'}`,
        color: playing ? palette.secondary : 'rgba(250, 246, 240, 0.78)',
        boxShadow: playing ? `0 0 18px ${palette.glow}` : undefined,
      }}
    >
      {playing ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
    </button>
  );
}
