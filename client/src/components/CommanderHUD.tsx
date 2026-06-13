import type { Commander } from '@/stellar/contracts';
import { getFaction, RARITY_LABELS, RARITY_COLORS, STAT_LABELS } from '@/stellar/factions';

interface CommanderHUDProps {
  commander: Commander;
}

export default function CommanderHUD({ commander }: CommanderHUDProps) {
  const faction = getFaction(commander.faction);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stellar-700 bg-stellar-800 p-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{faction?.icon || '⚔️'}</span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-stellar-100">{commander.name}</h3>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${RARITY_COLORS[commander.rarity] || 'text-stellar-400'}`}>
              {RARITY_LABELS[commander.rarity] || 'Unknown'}
            </span>
            {faction && (
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium text-white ${faction.badgeColor}`}>
                {faction.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-stellar-900/50 px-3 py-2">
        <span className="text-xs text-stellar-500">Morale</span>
        <div className="flex-1 h-1.5 rounded-full bg-stellar-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              commander.morale > 60 ? 'bg-green-500' : commander.morale > 30 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${commander.morale}%` }}
          />
        </div>
        <span className={`text-xs font-bold font-mono ${
          commander.morale > 60 ? 'text-green-400' : commander.morale > 30 ? 'text-amber-400' : 'text-red-400'
        }`}>
          {commander.morale}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1">
        {commander.stats.map((value, i) => {
          const label = STAT_LABELS[i]?.slice(0, 3) ?? '';
          return (
            <div key={i} className="flex flex-col items-center gap-0.5 rounded bg-stellar-900/30 p-1.5">
              <span className="text-[10px] font-medium uppercase text-stellar-500">{label}</span>
              <span className={`text-xs font-bold font-mono ${
                value >= 80 ? 'text-green-400' : value >= 60 ? 'text-blue-400' : value >= 40 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {value}
              </span>
            </div>
          );
        })}
      </div>

      {commander.is_fallen && (
        <div className="rounded bg-imperial-600/20 p-2 text-center">
          <span className="text-xs font-bold text-imperial-400">FALLEN IN BATTLE</span>
        </div>
      )}
    </div>
  );
}
