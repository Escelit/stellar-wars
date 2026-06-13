import type { Choice } from '@/stellar/api';
import { STAT_LABELS } from '@/stellar/factions';

interface ChoiceCardProps {
  choice: Choice;
  index: number;
  commanderStats?: number[];
  isSelected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

function isStatGateMet(choice: Choice, stats?: number[]): boolean {
  if (!choice.statGate || !stats) return true;
  const statIndex = STAT_LABELS.findIndex(
    (l) => l.toLowerCase() === choice.statGate!.stat.toLowerCase()
  );
  if (statIndex === -1) return true;
  return stats[statIndex]! >= choice.statGate.minValue;
}

export default function ChoiceCard({
  choice,
  index,
  commanderStats,
  isSelected = false,
  disabled = false,
  onClick,
}: ChoiceCardProps) {
  const gateMet = isStatGateMet(choice, commanderStats);
  const hasGate = !!choice.statGate;
  const locked = hasGate && !gateMet;

  return (
    <button
      onClick={onClick}
      disabled={disabled || locked}
      className={`group flex w-full flex-col rounded-xl border p-5 text-left shadow-sm transition-all ${
        isSelected
          ? 'border-cosmic-500 bg-cosmic-600/20 shadow-cosmic-900/20'
          : locked
            ? 'border-stellar-700 bg-stellar-800/30 opacity-50 cursor-not-allowed'
            : 'border-stellar-700 bg-stellar-800 hover:border-cosmic-600 hover:shadow-md hover:shadow-cosmic-900/10 cursor-pointer'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
            locked ? 'bg-stellar-700 text-stellar-500' : 'bg-cosmic-600/30 text-cosmic-300'
          }`}
        >
          {index + 1}
        </span>

        <div className="flex-1 min-w-0">
          <p
            className={`text-base font-medium ${
              locked ? 'text-stellar-500' : 'text-stellar-100'
            }`}
          >
            {choice.text}
          </p>

          {hasGate && (
            <div
              className={`mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
                gateMet
                  ? 'bg-green-600/20 text-green-400'
                  : 'bg-imperial-600/20 text-imperial-400'
              }`}
            >
              {gateMet ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z" />
                </svg>
              )}
              <span>
                {gateMet
                  ? `${choice.statGate!.stat.charAt(0).toUpperCase() + choice.statGate!.stat.slice(1)} ${choice.statGate!.minValue}+`
                  : `Requires ${choice.statGate!.stat.charAt(0).toUpperCase() + choice.statGate!.stat.slice(1)} ${choice.statGate!.minValue}+`}
              </span>
            </div>
          )}
        </div>

        {!locked && (
          <svg
            className={`mt-1 h-5 w-5 flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${
              isSelected ? 'text-cosmic-400' : 'text-stellar-500'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </button>
  );
}
