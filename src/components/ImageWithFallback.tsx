import { useState } from 'react';
import { Heart } from 'lucide-react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fallbackTitle?: string;
}

export function ImageWithFallback({
  src,
  alt,
  className = '',
  loading = 'lazy',
  fallbackTitle,
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#2a1b2d] via-[#1c1322] to-[#110c15] text-center p-6 ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="w-12 h-12 rounded-full bg-[#e28794]/12 border border-[#d9b37c]/30 flex items-center justify-center mb-3">
          <Heart className="w-5 h-5 text-[#e28794]" />
        </div>
        <p className="font-serif-editorial italic text-base text-[#faf6f0]/80 max-w-[220px] leading-relaxed">
          {fallbackTitle || alt}
        </p>
        <p className="text-[11px] text-[#d9b37c]/70 mt-1">
          Sample — replace from admin
        </p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
