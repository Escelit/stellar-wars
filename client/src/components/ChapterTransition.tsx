import { useEffect, useState } from 'react';

interface ChapterTransitionProps {
  fromChapter: number;
  toChapter: number;
  onDismiss: () => void;
}

export default function ChapterTransition({ fromChapter, toChapter, onDismiss }: ChapterTransitionProps) {
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter');

  useEffect(() => {
    requestAnimationFrame(() => {
      setPhase('visible');
    });

    const timer = setTimeout(() => {
      setPhase('exit');
    }, 2500);

    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, 3500);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-stellar-950 transition-all duration-700 ${
        phase === 'enter' ? 'opacity-0' : phase === 'exit' ? 'opacity-0 scale-105' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-4 text-stellar-500">
          <span className="text-lg font-medium">Chapter {fromChapter}</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span className="text-lg font-medium text-cosmic-400">Chapter {toChapter}</span>
        </div>

        <h1 className="text-5xl font-bold tracking-tight text-stellar-100">
          Chapter {toChapter}
        </h1>

        <div className="flex items-center gap-3 text-sm text-stellar-500">
          <div className="h-px w-12 bg-stellar-700" />
          <span>A new chapter begins</span>
          <div className="h-px w-12 bg-stellar-700" />
        </div>

        <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-stellar-800">
          <div
            className={`h-full rounded-full bg-cosmic-600 transition-all duration-1000 ${
              phase === 'visible' ? 'w-full' : 'w-0'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
