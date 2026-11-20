import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';
import { BearCouple, type BearMood } from '../BearCouple';
import { getThemePalette } from '../../utils/theme';

interface AdminLoginProps {
  onSuccess: () => void;
  onBackHome: () => void;
}

export function AdminLogin({ onSuccess, onBackHome }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mood, setMood] = useState<BearMood>('idle');
  const [wrongCount, setWrongCount] = useState(0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim() || submitting) return;
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWrongCount((n) => n + 1);
        setError(data.error || 'Authentication failed.');
        setMood('bonk');
        window.setTimeout(() => setMood('crying'), 700);
        return;
      }
      setMood('celebrating');
      window.setTimeout(() => onSuccess(), 1300);
    } catch {
      setError('Unable to reach server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0a10] text-[#faf6f0] flex items-center justify-center px-4 py-12 relative z-10">
      <div className="w-full max-w-md glass-surface rounded-2xl p-8 shadow-2xl">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-1.5 text-xs text-[#faf6f0]/65 hover:text-[#faf6f0] mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Surprise Site</span>
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#e28794]/15 border border-[#e28794]/30 flex items-center justify-center text-[#e28794]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#faf6f0]">Admin Studio</h1>
            <p className="text-xs text-[#faf6f0]/60">Manage memories, dates &amp; wishes</p>
          </div>
        </div>

        <div className="flex justify-center h-36 mt-4 select-none">
          <BearCouple mood={mood} palette={getThemePalette('rose-gold')} />
        </div>
        <p className="text-center text-xs text-[#faf6f0]/60 -mt-1">
          {mood === 'celebrating'
            ? 'Yay! Welcome back ❤️'
            : mood === 'bonk' || mood === 'crying'
              ? wrongCount > 2
                ? 'He is crying again... check the password 😭'
                : 'Wrong password! Try again 😤'
              : 'Only the birthday planner may enter 🐻'}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="admin-password" className="block text-xs font-medium text-[#faf6f0]/75 mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (mood === 'crying') setMood('idle');
                }}
                placeholder="Enter your secret password"
                autoFocus
                className="w-full h-11 pl-3.5 pr-11 rounded-xl bg-[#130e17] border border-[#faf6f0]/15 text-sm text-[#faf6f0] placeholder:text-[#faf6f0]/35 focus:outline-none focus:border-[#d9b37c]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#faf6f0]/55 hover:text-[#faf6f0] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-3.5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-400/30 text-xs text-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !password.trim()}
            className="w-full h-11 rounded-xl bg-[#e28794] hover:bg-[#d37280] text-[#120c14] font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Signing In...' : 'Sign In to Studio'}
          </button>
        </form>

      </div>
    </div>
  );
}
