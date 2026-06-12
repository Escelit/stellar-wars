import type { Commander } from '@/stellar/contracts';
import { getFaction, RARITY_LABELS, RARITY_COLORS } from '@/stellar/factions';
import StatBars from './StatBars';

interface CommanderCardProps {
  commander: Commander;
  onClick?: () => void;
}

export default function CommanderCard({ commander, onClick }: CommanderCardProps) {
  const faction = getFaction(commander.faction);

  return (
    <button
      onClick={onClick}
      className="group flex w-full flex-col rounded-xl border border-stellar-700 bg-stellar-800 p-5 text-left shadow-sm transition-all hover:border-cosmic-600 hover:shadow-md hover:shadow-cosmic-900/20"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{faction?.icon || '⚔️'}</span>
          <div>
            <h3 className="text-base font-semibold text-stellar-100">{commander.name}</h3>
            <span className={`text-xs font-medium ${RARITY_COLORS[commander.rarity] || 'text-stellar-400'}`}>
              {RARITY_LABELS[commander.rarity] || 'Unknown'}
            </span>
          </div>
        </div>
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium text-white ${faction?.badgeColor || 'bg-stellar-600'}`}>
          {faction?.name || commander.faction}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-stellar-400">
        <span className={`flex items-center gap-1 ${commander.morale > 0 ? 'text-green-400' : 'text-red-400'}`}>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          {commander.morale}
        </span>
        {commander.is_fallen && (
          <span className="flex items-center gap-1 text-imperial-400">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            Fallen
          </span>
        )}
        <span className="ml-auto">#{commander.id}</span>
      </div>

      <div className="mt-3">
        <StatBars stats={commander.stats} size="sm" showLabels={false} />
      </div>
    </button>
  );
}
