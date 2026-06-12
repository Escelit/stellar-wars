import { STAT_LABELS } from '@/stellar/factions';

interface StatBarsProps {
  stats: number[];
  maxStat?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

const sizeConfig = {
  sm: { barHeight: 'h-1.5', labelSize: 'text-xs', valueSize: 'text-xs' },
  md: { barHeight: 'h-2.5', labelSize: 'text-sm', valueSize: 'text-sm' },
  lg: { barHeight: 'h-3.5', labelSize: 'text-base', valueSize: 'text-base' },
};

function statColor(value: number): string {
  if (value >= 80) return 'bg-green-500';
  if (value >= 60) return 'bg-blue-500';
  if (value >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function StatBars({
  stats,
  maxStat = 100,
  size = 'md',
  showLabels = true,
}: StatBarsProps) {
  const config = sizeConfig[size];

  return (
    <div className="flex flex-col gap-2">
      {stats.map((value, i) => (
        <div key={i}>
          {showLabels && (
            <div className={`mb-1 flex items-center justify-between ${config.labelSize}`}>
              <span className="font-medium text-stellar-300">{STAT_LABELS[i]}</span>
              <span className={`font-mono font-bold ${config.valueSize} ${
                value >= 80 ? 'text-green-400' :
                value >= 60 ? 'text-blue-400' :
                value >= 40 ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {value}
              </span>
            </div>
          )}
          <div className={`w-full overflow-hidden rounded-full bg-stellar-700 ${config.barHeight}`}>
            <div
              className={`${config.barHeight} rounded-full transition-all duration-500 ${statColor(value)}`}
              style={{ width: `${(value / maxStat) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
