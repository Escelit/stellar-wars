import { useState, useCallback, useEffect } from 'react';
import { useStellarWallet } from '@/hooks/useStellarWallet';
import { mintController, battleRegistry, type Commander, type BattleStats } from '@/stellar/contracts';
import { listPlaythroughs } from '@/stellar/api';
import PageShell from '@/components/PageShell';
import Card from '@/components/ui/Card';
import CommanderCard from '@/components/CommanderCard';
import CommanderDetailModal from '@/components/CommanderDetailModal';

interface PlaythroughInfo {
  id: string;
  chapter: number;
  currentNode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { address, isConnected, disconnect } = useStellarWallet();
  const [commanders, setCommanders] = useState<Commander[]>([]);
  const [battleStats, setBattleStats] = useState<BattleStats | null>(null);
  const [playthroughs, setPlaythroughs] = useState<PlaythroughInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCommander, setSelectedCommander] = useState<Commander | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [commandersResult, playthroughsResult] = await Promise.all([
        mintController.getOwnedCommanders(address),
        listPlaythroughs(),
      ]);

      setCommanders(commandersResult || []);
      setPlaythroughs(playthroughsResult.playthroughs || []);

      if (commandersResult && commandersResult.length > 0) {
        let totalBattles = 0;
        let totalWins = 0;

        for (const commander of commandersResult) {
          try {
            const stats = await battleRegistry.getCommanderStats(commander.id);
            if (stats) {
              totalBattles += stats.total_battles;
              totalWins += stats.wins;
            }
          } catch {
            // Skip if stats not available
          }
        }

        setBattleStats({
          total_battles: totalBattles,
          wins: totalWins,
          losses: totalBattles - totalWins,
        });
      }
    } catch {
      setCommanders([]);
      setPlaythroughs([]);
      setBattleStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  if (!isConnected) {
    return (
      <PageShell title="Profile" description="Connect your wallet to view your profile">
        <div className="flex h-64 items-center justify-center">
          <p className="text-stellar-400">Connect your Freighter wallet to view your profile and stats.</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Profile" description="Your commander profile and battle statistics" isLoading={isLoading}>
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card title="Wallet" description="Your Stellar wallet information">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-stellar-500 mb-1">Address</p>
                <p className="truncate font-mono text-sm text-stellar-200">{address}</p>
              </div>
              <div>
                <p className="text-xs text-stellar-500 mb-1">Network</p>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-stellar-300">Stellar Testnet</span>
                </div>
              </div>
              <button
                onClick={disconnect}
                className="w-full rounded-lg border border-stellar-600 bg-stellar-800 px-4 py-2 text-sm font-medium text-stellar-200 transition-colors hover:bg-stellar-700"
              >
                Disconnect Wallet
              </button>
            </div>
          </Card>

          <Card title="Commanders" description="Your owned commanders">
            <div className="flex flex-col items-center gap-2 py-2">
              <p className="text-4xl font-bold text-stellar-100">{commanders.length}</p>
              <p className="text-sm text-stellar-400">
                {commanders.length === 1 ? 'commander' : 'commanders'} owned
              </p>
            </div>
          </Card>

          <Card title="Battle Record" description="Your combat statistics">
            {battleStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold text-stellar-100">{battleStats.total_battles}</p>
                    <p className="text-xs text-stellar-500">Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">{battleStats.wins}</p>
                    <p className="text-xs text-stellar-500">Wins</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-imperial-400">{battleStats.losses}</p>
                    <p className="text-xs text-stellar-500">Losses</p>
                  </div>
                </div>

                {battleStats.total_battles > 0 && (
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-stellar-500">Win Rate</span>
                      <span className="font-medium text-stellar-300">
                        {Math.round((battleStats.wins / battleStats.total_battles) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-stellar-700">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all duration-500"
                        style={{ width: `${(battleStats.wins / battleStats.total_battles) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4">
                <p className="text-sm text-stellar-400">No battle data yet</p>
              </div>
            )}
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold text-stellar-100">My Commanders</h2>
          {commanders.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-xl border border-stellar-700 bg-stellar-800">
              <p className="text-stellar-400">No commanders owned. Visit the Mint page to create one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {commanders.map((commander) => (
                <CommanderCard
                  key={commander.id}
                  commander={commander}
                  onClick={() => {
                    setSelectedCommander(commander);
                    setIsDetailOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold text-stellar-100">Campaign Progress</h2>
          {playthroughs.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-xl border border-stellar-700 bg-stellar-800">
              <p className="text-stellar-400">No active campaigns. Start a new game to begin your journey.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {playthroughs.map((playthrough) => (
                <div
                  key={playthrough.id}
                  className="flex items-center justify-between rounded-xl border border-stellar-700 bg-stellar-800 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cosmic-600/20 text-lg">
                      📜
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stellar-200">Campaign #{playthrough.id.slice(0, 8)}</p>
                      <p className="text-xs text-stellar-500">
                        Chapter {playthrough.chapter} • Created {new Date(playthrough.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        playthrough.isActive
                          ? 'bg-green-600/20 text-green-400'
                          : 'bg-stellar-600/20 text-stellar-400'
                      }`}
                    >
                      {playthrough.isActive ? 'Active' : 'Completed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CommanderDetailModal
        commander={selectedCommander}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedCommander(null);
        }}
      />
    </PageShell>
  );
}
