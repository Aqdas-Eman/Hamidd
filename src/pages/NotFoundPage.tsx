import { ArrowLeft, HeartCrack } from 'lucide-react';

interface NotFoundPageProps {
  onGoHome: () => void;
}

export function NotFoundPage({ onGoHome }: NotFoundPageProps) {
  return (
    <div className="min-h-screen bg-[#0d0a10] text-[#faf6f0] flex flex-col items-center justify-center px-4 text-center relative z-10">
      <div className="glass-surface rounded-2xl p-10 max-w-md w-full">
        <div className="w-14 h-14 rounded-full bg-[#e28794]/15 border border-[#e28794]/30 flex items-center justify-center mx-auto mb-5 text-[#e28794]">
          <HeartCrack className="w-6 h-6" />
        </div>
        <p className="font-mono-tabular text-xs text-[#d9b37c] mb-2">404 · Page Not Found</p>
        <h1 className="font-script text-4xl sm:text-5xl text-[#faf6f0] mb-3">
          Lost Among the Stars
        </h1>
        <p className="text-sm text-[#faf6f0]/70 leading-relaxed mb-7">
          This little corner of our birthday surprise does not exist yet—let us bring you back to the main story.
        </p>
        <button
          type="button"
          onClick={onGoHome}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e28794] text-[#120c14] text-sm font-semibold hover:opacity-95 transition-opacity cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Celebration</span>
        </button>
      </div>
    </div>
  );
}
