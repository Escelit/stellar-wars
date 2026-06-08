import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStellarWallet } from '@/hooks/useStellarWallet';
import { mintController } from '@/stellar/contracts';

export default function HomePage() {
  const { address, isConnected } = useStellarWallet();
  const [commanderCount, setCommanderCount] = useState(0);

  useEffect(() => {
    if (!address) {
      setCommanderCount(0);
      return;
    }

    mintController.getOwnedCommanders(address).then((commanders) => {
      setCommanderCount(commanders.length);
    });
  }, [address]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16">
      <div className="text-center">
        <h1 className="mb-2 text-5xl font-bold text-stellar-100">⚔️ Stellar Wars</h1>
        <p className="text-lg text-stellar-400">
          A branching narrative war game powered by the Stellar blockchain
        </p>
      </div>

      {!isConnected && (
        <div className="rounded-lg border border-stellar-700 bg-stellar-800 px-6 py-4 text-center">
          <p className="text-stellar-400">
            Connect your Freighter wallet to start your campaign.
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <Link to="/mint" className="btn-primary">
          Mint Commander
        </Link>
        <Link to="/game" className="btn-secondary">
          Continue Campaign
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-3 gap-6">
        <div className="card text-center">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-cosmic-400">
            Commanders
          </h3>
          <p className="text-3xl font-bold text-stellar-100">{commanderCount}</p>
        </div>
        <div className="card text-center">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-cosmic-400">
            Battles
          </h3>
          <p className="text-3xl font-bold text-stellar-100">0</p>
        </div>
        <div className="card text-center">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-cosmic-400">
            Victories
          </h3>
          <p className="text-3xl font-bold text-stellar-100">0</p>
        </div>
      </div>
    </div>
  );
}
