import { useEffect, useState, useCallback } from 'react';
import { useStellarWallet } from '@/hooks/useStellarWallet';
import { mintController, type Commander } from '@/stellar/contracts';
import PageShell from '@/components/PageShell';
import CommanderCard from '@/components/CommanderCard';
import CommanderDetailModal from '@/components/CommanderDetailModal';

export default function CommandersPage() {
  const { address, isConnected } = useStellarWallet();
  const [commanders, setCommanders] = useState<Commander[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCommander, setSelectedCommander] = useState<Commander | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCommanders = useCallback(async () => {
    if (!address) {
      setCommanders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await mintController.getOwnedCommanders(address);
      setCommanders(result || []);
    } catch {
      setCommanders([]);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchCommanders();
  }, [fetchCommanders]);

  const handleCardClick = useCallback((commander: Commander) => {
    setSelectedCommander(commander);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedCommander(null);
  }, []);

  return (
    <PageShell
      title="My Commanders"
      description={isConnected ? `You have ${commanders.length} commander${commanders.length === 1 ? '' : 's'}` : 'Connect your wallet to view your commanders'}
      isLoading={isLoading}
    >
      {!isConnected && (
        <div className="flex h-48 items-center justify-center">
          <p className="text-stellar-400">Connect your Freighter wallet to see your commanders.</p>
        </div>
      )}

      {isConnected && commanders.length === 0 && !isLoading && (
        <div className="flex h-48 flex-col items-center justify-center gap-4">
          <span className="text-4xl">⚔️</span>
          <p className="text-stellar-400">No commanders yet.</p>
          <a
            href="/mint"
            className="rounded-lg bg-cosmic-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cosmic-700"
          >
            Mint Your First Commander
          </a>
        </div>
      )}

      {isConnected && commanders.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {commanders.map((commander) => (
            <CommanderCard
              key={commander.id}
              commander={commander}
              onClick={() => handleCardClick(commander)}
            />
          ))}
        </div>
      )}

      <CommanderDetailModal
        commander={selectedCommander}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </PageShell>
  );
}
