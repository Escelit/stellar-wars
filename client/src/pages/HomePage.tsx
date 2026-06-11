import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStellarWallet } from '@/hooks/useStellarWallet';
import { mintController } from '@/stellar/contracts';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function HomePage() {
  const { address, isConnected, connect, isConnecting } = useStellarWallet();
  const [commanderCount, setCommanderCount] = useState(0);
  const navigate = useNavigate();

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
        <Card className="max-w-md text-center">
          <p className="mb-6 text-stellar-400">
            Connect your Freighter wallet to start your campaign, mint commanders, and record your battles on the Stellar network.
          </p>
          <Button size="lg" onClick={connect} isLoading={isConnecting}>
            Connect Wallet
          </Button>
        </Card>
      )}

      {isConnected && (
        <div className="flex gap-4">
          <Button size="lg" onClick={() => navigate('/mint')}>
            Mint Commander
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('/game')}>
            Continue Campaign
          </Button>
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="text-center">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-cosmic-400">
            Commanders
          </h3>
          <p className="text-3xl font-bold text-stellar-100">{commanderCount}</p>
        </Card>
        <Card className="text-center">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-cosmic-400">
            Battles
          </h3>
          <p className="text-3xl font-bold text-stellar-100">0</p>
        </Card>
        <Card className="text-center">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-cosmic-400">
            Victories
          </h3>
          <p className="text-3xl font-bold text-stellar-100">0</p>
        </Card>
      </div>
    </div>
  );
}
