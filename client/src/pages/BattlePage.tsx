import { useState, useCallback, useEffect } from 'react';
import { useStellarWallet } from '@/hooks/useStellarWallet';
import {
  mintController,
  battleRegistry,
  contractActions,
  BattleStrategy,
  BattleOutcome,
  type Commander,
  type BattleRecord,
} from '@/stellar/contracts';
import { simulateContractCall, buildTransaction, sendContractCall } from '@/stellar/soroban';
import { wallet } from '@/stellar/wallet';
import { NETWORK_PASSPHRASE } from '@/stellar/config';
import { getFaction, RARITY_LABELS, RARITY_COLORS } from '@/stellar/factions';
import {
  STRATEGY_LABELS,
  STRATEGY_DESCRIPTIONS,
  generateOpponent,
  resolveBattle,
  type BattleFighter,
} from '@/game/battleLogic';
import PageShell from '@/components/PageShell';
import CommanderDetailModal from '@/components/CommanderDetailModal';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

type TxStatus = 'idle' | 'preparing' | 'signing' | 'pending' | 'confirmed' | 'failed';

const DIFFICULTIES = [
  { label: 'Easy', value: 1, description: 'Weakened patrols' },
  { label: 'Normal', value: 3, description: 'Standard enemy forces' },
  { label: 'Hard', value: 5, description: 'Elite enemy units' },
  { label: 'Brutal', value: 7, description: 'Legendary war machines' },
];

const strategyList = [
  BattleStrategy.Aggressive,
  BattleStrategy.Defensive,
  BattleStrategy.Balanced,
  BattleStrategy.Guerilla,
  BattleStrategy.Diplomatic,
];

export default function BattlePage() {
  const { address, isConnected } = useStellarWallet();
  const [commanders, setCommanders] = useState<Commander[]>([]);
  const [selectedCommander, setSelectedCommander] = useState<Commander | null>(null);
  const [difficulty, setDifficulty] = useState(3);
  const [strategy, setStrategy] = useState<BattleStrategy>(BattleStrategy.Balanced);
  const [opponent, setOpponent] = useState<BattleFighter | null>(null);
  const [battleMessages, setBattleMessages] = useState<string[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ victory: boolean } | null>(null);
  const [battleHistory, setBattleHistory] = useState<BattleRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [detailCommander, setDetailCommander] = useState<Commander | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadCommanders = useCallback(async () => {
    if (!address) return;
    try {
      const owned = await mintController.getOwnedCommanders(address);
      setCommanders(owned || []);
    } catch {
      setCommanders([]);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected) {
      loadCommanders();
    }
  }, [isConnected, loadCommanders]);

  useEffect(() => {
    setOpponent(generateOpponent(difficulty));
  }, [difficulty]);

  const loadBattleHistory = useCallback(async () => {
    if (!address) return;
    setHistoryLoading(true);
    try {
      const battles = await battleRegistry.getPlayerBattles(address);
      setBattleHistory(battles || []);
    } catch {
      setBattleHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [address]);

  useEffect(() => {
    loadBattleHistory();
  }, [loadBattleHistory]);

  const handleScoutOpponent = useCallback(() => {
    setOpponent(generateOpponent(difficulty));
    setLastResult(null);
  }, [difficulty]);

  const handleCrusade = useCallback(async () => {
    if (!selectedCommander || !opponent) return;

    setIsResolving(true);
    setError(null);
    setLastResult(null);

    try {
      const result = resolveBattle(
        {
          name: selectedCommander.name,
          faction: selectedCommander.faction,
          stats: selectedCommander.stats,
        },
        opponent,
        strategy
      );

      const messages: string[] = [];
      const strategyLabel = STRATEGY_LABELS[strategy];
      const playerTotal = selectedCommander.stats.reduce((a, b) => a + b, 0);
      const opponentTotal = opponent.stats.reduce((a, b) => a + b, 0);

      messages.push(
        `${selectedCommander.name} engages ${opponent.name} using the ${strategyLabel} stratagem.`
      );
      messages.push(
        `Enemy war council estimates: your strength advantage is ${Math.abs(playerTotal - opponentTotal)} points ${playerTotal >= opponentTotal ? 'in your favor' : 'against you'}.`
      );

      if (result.powerDelta > 20) {
        messages.push('Your forces outmatch the enemy on paper, and the battle proves it.');
      } else if (result.powerDelta < -20) {
        messages.push('The enemy outguns you substantially. Only luck can carry the day.');
      } else {
        messages.push('The two fleets are evenly matched on paper. Execution will decide the outcome.');
      }

      setBattleMessages(messages);
      setLastResult({ victory: result.victory });

      setTxStatus('preparing');
      const action = contractActions.recordBattle(
        address!,
        selectedCommander.id,
        opponent.name,
        strategy,
        result.victory ? BattleOutcome.Victory : BattleOutcome.Defeat,
        selectedCommander.morale,
        selectedCommander.stats,
        opponent.stats
      );

      const simulation = await simulateContractCall({
        contractId: action.contractId,
        method: action.method,
        args: action.args,
        source: address!,
      });

      setTxStatus('signing');
      const transaction = await buildTransaction(address!, simulation);
      const signedXdr = await wallet.sign(transaction.toXDR(), NETWORK_PASSPHRASE.TESTNET);

      if (!signedXdr) {
        throw new Error('Transaction signing was cancelled');
      }

      setTxStatus('pending');
      const { hash } = await sendContractCall(signedXdr);

      setTxStatus('confirmed');
      setTxHash(hash);
      loadBattleHistory();
      setIsResolving(false);
    } catch (e) {
      setTxStatus('failed');
      setError(e instanceof Error ? e.message : 'Battle recording failed');
      setIsResolving(false);
    }
  }, [address, selectedCommander, opponent, strategy, loadBattleHistory]);

  const handleReset = useCallback(() => {
    setTxStatus('idle');
    setTxHash(null);
    setError(null);
    setLastResult(null);
    setBattleMessages([]);
  }, []);

  if (!isConnected) {
    return (
      <PageShell title="Battle Arena" description="Connect your wallet to start battling">
        <div className="flex h-64 items-center justify-center">
          <p className="text-stellar-400">Connect your Freighter wallet to enter the battle arena.</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Battle Arena"
      description="Send your commanders into battle and record victories on-chain"
      actions={
        <Button
          variant="secondary"
          onClick={() => {
            if (selectedCommander) {
              setDetailCommander(selectedCommander);
              setIsDetailOpen(true);
            }
          }}
          disabled={!selectedCommander}
        >
          View Commander
        </Button>
      }
    >
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card title="1. Choose Your Commander" description="Select a commander to lead the assault">
            {commanders.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <span className="text-3xl">⚔️</span>
                <p className="text-sm text-stellar-400">You need to mint a commander first.</p>
                <a href="/mint" className="rounded-lg bg-cosmic-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cosmic-700">
                  Mint Commander
                </a>
              </div>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {commanders.map((c) => {
                  const faction = getFaction(c.faction);
                  const isSelected = selectedCommander?.id === c.id;
                  if (c.is_fallen) return null;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCommander(c)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                        isSelected ? 'border-cosmic-500 bg-cosmic-600/20' : 'border-stellar-700 bg-stellar-800/50 hover:border-stellar-600'
                      }`}
                    >
                      <span className="text-xl">{faction?.icon || '⚔️'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-stellar-200">{c.name}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${RARITY_COLORS[c.rarity]}`}>{RARITY_LABELS[c.rarity]}</span>
                          <span className={`text-xs ${c.morale > 30 ? 'text-green-400' : 'text-red-400'}`}>Morale {c.morale}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          <Card title="2. Choose a Strategy" description="Your approach to the battle">
            <div className="space-y-2">
              {strategyList.map((s) => (
                <button
                  key={s}
                  onClick={() => setStrategy(s)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    strategy === s ? 'border-cosmic-500 bg-cosmic-600/20' : 'border-stellar-700 bg-stellar-800/50 hover:border-stellar-600'
                  }`}
                >
                  <p className="text-sm font-medium text-stellar-200">{STRATEGY_LABELS[s]}</p>
                  <p className="mt-0.5 text-xs text-stellar-500">{STRATEGY_DESCRIPTIONS[s]}</p>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card title="3. Scout the Enemy" description="Pick your target from the enemy fleet">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-stellar-400">Choose the threat level:</p>
              <div className="flex gap-1 rounded-lg bg-stellar-900/50 p-1">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      difficulty === d.value ? 'bg-cosmic-600 text-white' : 'text-stellar-400 hover:text-stellar-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {opponent ? (
              <div className="flex flex-col items-center gap-4 rounded-lg bg-stellar-900/50 p-6">
                <span className="text-4xl">{getFaction(opponent.faction)?.icon || '⚔️'}</span>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-stellar-100">{opponent.name}</h3>
                  <span className="text-sm text-stellar-400">{getFaction(opponent.faction)?.name || opponent.faction}</span>
                </div>
                <div className="w-full max-w-sm space-y-1.5">
                  {['Attack', 'Defense', 'Strategy', 'Influence', 'Morale'].map((label, i) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="w-20 text-xs text-stellar-500">{label}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stellar-700">
                        <div
                          className={`h-full rounded-full ${opponent.stats[i]! >= 80 ? 'bg-red-500' : opponent.stats[i]! >= 60 ? 'bg-amber-500' : 'bg-blue-500'}`}
                          style={{ width: `${opponent.stats[i]}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-mono text-xs text-stellar-300">{opponent.stats[i]}</span>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={handleScoutOpponent}>
                  Scout Another Target
                </Button>
              </div>
            ) : (
              <LoadingSpinner />
            )}

            <div className="mt-6">
              <Button
                size="lg"
                onClick={handleCrusade}
                disabled={!selectedCommander || !opponent || txStatus !== 'idle' || isResolving}
                isLoading={isResolving || txStatus === 'preparing' || txStatus === 'signing' || txStatus === 'pending'}
                className="w-full justify-center"
              >
                {isResolving ? 'Resolving Battle...' : txStatus === 'idle' && 'Engage in Battle'}
                {txStatus === 'preparing' && 'Preparing Transaction...'}
                {txStatus === 'signing' && 'Sign in Freighter...'}
                {txStatus === 'pending' && 'Recording Battle...'}
              </Button>
            </div>
          </Card>

          {(lastResult || battleMessages.length > 0) && (
            <Card title="Battle Report">
              <div className="space-y-4">
                {battleMessages.map((message, i) => (
                  <p key={i} className="leading-relaxed text-stellar-300">{message}</p>
                ))}

                {lastResult && (
                  <div className={`rounded-lg p-4 text-center ${
                    lastResult.victory ? 'bg-green-600/20' : 'bg-imperial-600/20'
                  }`}>
                    <p className={`text-2xl font-bold ${
                      lastResult.victory ? 'text-green-400' : 'text-imperial-400'
                    }`}>
                      {lastResult.victory ? 'VICTORY' : 'DEFEAT'}
                    </p>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-imperial-500 bg-imperial-600/20 p-3 text-sm text-imperial-300">
                    {error}
                  </div>
                )}

                {txStatus === 'confirmed' && txHash && (
                  <div className="rounded-lg border border-green-500 bg-green-600/20 p-3 text-sm text-green-300">
                    Battle recorded on-chain. TX: <span className="font-mono text-xs">{txHash}</span>
                  </div>
                )}

                {txStatus === 'failed' && (
                  <Button variant="secondary" onClick={handleReset} className="w-full justify-center">
                    Try Again
                  </Button>
                )}
              </div>
            </Card>
          )}

          <Card title="Battle History" description="Your recent battles recorded on-chain">
            {historyLoading ? (
              <div className="flex h-24 items-center justify-center">
                <LoadingSpinner size="sm" />
              </div>
            ) : battleHistory.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <span className="text-3xl">🏆</span>
                <p className="text-sm text-stellar-400">No battles recorded yet.</p>
              </div>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {[...battleHistory].reverse().map((battle) => {
                  const strategyLabel = STRATEGY_LABELS[battle.strategy as BattleStrategy] ?? String(battle.strategy);
                  const victory = battle.outcome === 0;
                  const date = new Date(battle.timestamp * 1000);
                  return (
                    <div
                      key={battle.id}
                      className="flex items-center justify-between rounded-lg border border-stellar-700 bg-stellar-800/50 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-2 w-2 rounded-full ${victory ? 'bg-green-500' : 'bg-imperial-500'}`} />
                        <div>
                          <p className="text-sm font-medium text-stellar-200">
                            vs {battle.opponent_name}
                          </p>
                          <p className="text-xs text-stellar-500">
                            {strategyLabel} • Commander #{battle.commander_id} • {date.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${victory ? 'text-green-400' : 'text-imperial-400'}`}>
                          {victory ? 'W' : 'L'}
                        </span>
                        <p className="text-xs text-stellar-500">
                          Morale {battle.morale_before} → {battle.morale_after}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      <CommanderDetailModal
        commander={detailCommander}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setDetailCommander(null); }}
      />
    </PageShell>
  );
}