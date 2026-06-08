import { useState } from 'react';
import { useStellarWallet } from '@/hooks/useStellarWallet';

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export default function WalletButton() {
  const { address, isConnected, isCorrectNetwork, isConnecting, error, connect, disconnect } =
    useStellarWallet();
  const [showModal, setShowModal] = useState(false);

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${isCorrectNetwork ? 'bg-green-500' : 'bg-yellow-500'}`}
          />
          <span className="text-sm text-stellar-300">{truncateAddress(address!)}</span>
        </div>
        <button
          onClick={disconnect}
          className="rounded-lg border border-stellar-600 bg-stellar-800 px-2 py-1 text-xs font-medium text-stellar-200 transition-colors hover:bg-stellar-700"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isConnecting}
        className="btn-primary text-sm"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowModal(false)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl border border-stellar-700 bg-stellar-800 p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-bold text-stellar-100">Connect Wallet</h2>

            {error && (
              <div className="mb-4 rounded-lg border border-imperial-600 bg-imperial-900/50 px-4 py-3 text-sm text-imperial-200">
                {error.includes('not installed') ? (
                  <>
                    Freighter wallet not installed.{' '}
                    <a
                      href="https://freighter.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-imperial-100"
                    >
                      Download Freighter
                    </a>
                  </>
                ) : (
                  error
                )}
              </div>
            )}

            {!isCorrectNetwork && isConnected && (
              <div className="mb-4 rounded-lg border border-yellow-600 bg-yellow-900/50 px-4 py-3 text-sm text-yellow-200">
                Wrong network detected. Switch to Testnet in Freighter.
              </div>
            )}

            <button
              onClick={() => {
                connect().then(() => setShowModal(false));
              }}
              disabled={isConnecting}
              className="btn-primary w-full"
            >
              {isConnecting ? 'Connecting...' : 'Connect Freighter Wallet'}
            </button>

            <button
              onClick={() => setShowModal(false)}
              className="btn-secondary mt-2 w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
