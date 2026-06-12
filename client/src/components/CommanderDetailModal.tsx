import type { Commander } from '@/stellar/contracts';
import { getFaction, RARITY_LABELS, RARITY_COLORS } from '@/stellar/factions';
import Modal from './ui/Modal';
import StatBars from './StatBars';

interface CommanderDetailModalProps {
  commander: Commander | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommanderDetailModal({
  commander,
  isOpen,
  onClose,
}: CommanderDetailModalProps) {
  if (!commander) return null;

  const faction = getFaction(commander.faction);

  const footer = (
    <button
      onClick={onClose}
      className="rounded-lg border border-stellar-600 bg-stellar-800 px-4 py-2 text-sm font-medium text-stellar-200 transition-all hover:bg-stellar-700"
    >
      Close
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={commander.name} footer={footer}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{faction?.icon || '⚔️'}</span>
          <div>
            <span className={`text-sm font-semibold ${RARITY_COLORS[commander.rarity] || 'text-stellar-400'}`}>
              {RARITY_LABELS[commander.rarity] || 'Unknown'}
            </span>
            <span className={`ml-3 rounded-md px-2 py-0.5 text-xs font-medium text-white ${faction?.badgeColor || 'bg-stellar-600'}`}>
              {faction?.name || commander.faction}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg bg-stellar-900/50 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-stellar-100">#{commander.id}</p>
            <p className="text-xs text-stellar-500">Commander ID</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${commander.morale > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {commander.morale}
            </p>
            <p className="text-xs text-stellar-500">Morale</p>
          </div>
          {commander.is_fallen && (
            <div className="col-span-2 rounded bg-imperial-600/20 p-2 text-center">
              <span className="text-sm font-semibold text-imperial-400">FALLEN IN BATTLE</span>
            </div>
          )}
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stellar-400">
            Stats
          </h4>
          <StatBars stats={commander.stats} size="md" />
        </div>

        {commander.owner && (
          <div className="rounded-lg bg-stellar-900/50 p-3">
            <p className="text-xs text-stellar-500">Owner</p>
            <p className="truncate font-mono text-sm text-stellar-300">{commander.owner}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
