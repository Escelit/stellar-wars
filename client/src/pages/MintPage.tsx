import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStellarWallet } from '@/hooks/useStellarWallet';
import { contractActions } from '@/stellar/contracts';
import { simulateContractCall, buildTransaction, sendContractCall } from '@/stellar/soroban';
import { wallet } from '@/stellar/wallet';
import { NETWORK_PASSPHRASE } from '@/stellar/config';
import {
  FACTIONS,
  generateStats,
  determineRarity,
  RARITY_LABELS,
  RARITY_COLORS,
  getFaction,
} from '@/stellar/factions';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatBars from '@/components/StatBars';

type TxStatus = 'idle' | 'preparing' | 'signing' | 'pending' | 'confirmed' | 'failed';

export default function MintPage() {
  const { address, isConnected, isCorrectNetwork } = useStellarWallet();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [selectedFaction, setSelectedFaction] = useState(FACTIONS[0]!.id);
  const [stats, setStats] = useState(() => generateStats(FACTIONS[0]!.id));
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rarity = determineRarity(stats);
  const canMint = name.trim().length > 0 && txStatus === 'idle';

  useEffect(() => {
    if (!isConnected) navigate('/');
  }, [isConnected, navigate]);

  const handleFactionChange = useCallback((factionId: string) => {
    setSelectedFaction(factionId);
    setStats(generateStats(factionId));
  }, []);

  const handleReroll = useCallback(() => {
    setStats(generateStats(selectedFaction));
  }, [selectedFaction]);

  const handleMint = useCallback(async () => {
    if (!address || !name.trim()) return;

    setTxStatus('preparing');
    setError(null);
    setTxHash(null);

    try {
      const action = contractActions.mintCommander(
        address,
        name.trim(),
        rarity,
        selectedFaction,
        stats
      );

      const simulation = await simulateContractCall({
        contractId: action.contractId,
        method: action.method,
        args: action.args,
        source: address,
      });

      setTxStatus('signing');

      const transaction = await buildTransaction(address, simulation);
      const txXdr = transaction.toXDR();

      const signedXdr = await wallet.sign(txXdr, NETWORK_PASSPHRASE.TESTNET);
      if (!signedXdr) {
        throw new Error('Transaction signing was cancelled or failed');
      }

      setTxStatus('pending');

      const { hash } = await sendContractCall(signedXdr);

      setTxStatus('confirmed');
      setTxHash(hash);
    } catch (e) {
      setTxStatus('failed');
      setError(e instanceof Error ? e.message : 'Minting failed');
    }
  }, [address, name, rarity, selectedFaction, stats]);

  const handleReset = useCallback(() => {
    setTxStatus('idle');
    setError(null);
    setTxHash(null);
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stellar-100">Mint Commander</h1>
        <p className="mt-2 text-lg text-stellar-400">
          Forge a new commander to lead your fleet
        </p>
      </div>

      {txStatus === 'confirmed' ? (
        <Card className="text-center">
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-stellar-100">Commander Minted!</h2>
            <p className="text-stellar-400">Your commander <span className="font-semibold text-stellar-100">{name}</span> has been forged.</p>
            {txHash && (
              <p className="max-w-full truncate font-mono text-xs text-stellar-500">
                TX: {txHash}
              </p>
            )}
            <div className="mt-4 flex gap-3">
              <Button onClick={handleReset} variant="outline">
                Mint Another
              </Button>
              <Button onClick={() => navigate('/commanders')}>
                View Commanders
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Card title="Commander Details" description="Name your commander and choose a faction">
              <div className="space-y-5">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-stellar-300">
                    Commander Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter commander name..."
                    className="input"
                    maxLength={32}
                    disabled={txStatus !== 'idle'}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-stellar-300">
                    Faction
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {FACTIONS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handleFactionChange(f.id)}
                        disabled={txStatus !== 'idle'}
                        className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                          selectedFaction === f.id
                            ? `${f.borderColor} bg-stellar-700/50`
                            : 'border-stellar-700 bg-stellar-800/50 hover:border-stellar-600'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        <span className="text-2xl">{f.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-stellar-200">{f.name}</p>
                          <p className="text-xs text-stellar-500">{f.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-stellar-300">Rarity: </span>
                    <span className={`text-sm font-bold ${RARITY_COLORS[rarity]}`}>
                      {RARITY_LABELS[rarity]}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReroll}
                    disabled={txStatus !== 'idle'}
                  >
                    Reroll Stats
                  </Button>
                </div>

                <StatBars stats={stats} size="md" />
              </div>
            </Card>

            {error && (
              <div className="flex items-center gap-3 rounded-lg border border-imperial-500 bg-imperial-600/20 p-4">
                <svg className="h-5 w-5 flex-shrink-0 text-imperial-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-imperial-300">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                size="lg"
                onClick={handleMint}
                disabled={!canMint || !isCorrectNetwork}
                isLoading={txStatus === 'preparing' || txStatus === 'signing' || txStatus === 'pending'}
              >
                {txStatus === 'idle' && 'Mint Commander'}
                {txStatus === 'preparing' && 'Preparing...'}
                {txStatus === 'signing' && 'Sign in Freighter...'}
                {txStatus === 'pending' && 'Confirming...'}
              </Button>
              {txStatus === 'failed' && (
                <Button variant="secondary" size="lg" onClick={handleReset}>
                  Try Again
                </Button>
              )}
            </div>

            {!isCorrectNetwork && (
              <p className="text-sm text-imperial-400">
                Please switch your Freighter wallet to Stellar Testnet.
              </p>
            )}
          </div>

          <div className="lg:col-span-2">
            <Card
              title="Preview"
              description="Your commander card preview"
            >
              <div className="flex flex-col items-center gap-4 py-4">
                <span className="text-5xl">{getFaction(selectedFaction)?.icon || '⚔️'}</span>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-stellar-100">
                    {name || 'Unnamed Commander'}
                  </h3>
                  <span className={`text-sm font-medium ${RARITY_COLORS[rarity]}`}>
                    {RARITY_LABELS[rarity]}
                  </span>
                </div>
                <span className={`rounded-md px-3 py-1 text-xs font-medium text-white ${getFaction(selectedFaction)?.badgeColor || 'bg-stellar-600'}`}>
                  {getFaction(selectedFaction)?.name || selectedFaction}
                </span>

                <div className="w-full">
                  <StatBars stats={stats} size="sm" />
                </div>

                <div className="flex items-center gap-2 text-sm text-stellar-400">
                  <span>Morale: 100</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {txStatus === 'pending' && (
        <div className="mt-6 rounded-lg border border-cosmic-600 bg-cosmic-600/10 p-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cosmic-400 border-t-transparent" />
            <p className="text-sm text-cosmic-300">
              Transaction submitted. Waiting for confirmation...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
