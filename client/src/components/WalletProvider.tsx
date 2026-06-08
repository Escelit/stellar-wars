import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { wallet } from '@/stellar/wallet';
import { NETWORK_PASSPHRASE } from '@/stellar/config';

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const WalletContext = createContext<WalletState | null>(null);

export default function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);

  const checkNetwork = useCallback(async () => {
    try {
      const networkResult = await wallet.getNetwork();
      const passphrase = networkResult
        ? typeof networkResult === 'string'
          ? networkResult
          : (networkResult as unknown as { networkPassphrase: string }).networkPassphrase
        : null;
      setIsCorrectNetwork(passphrase === NETWORK_PASSPHRASE.TESTNET);
    } catch {
      setIsCorrectNetwork(true);
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const available = await wallet.isAvailable();
      if (!available) {
        setError('Freighter wallet not installed. Please install Freighter to continue.');
        return;
      }

      const addr = await wallet.getAddress();
      if (!addr) {
        setError('Could not get address. Check Freighter is unlocked.');
        return;
      }

      setAddress(addr);
      await checkNetwork();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  }, [checkNetwork]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setIsCorrectNetwork(true);
    setError(null);
  }, []);

  useEffect(() => {
    wallet.isAvailable().then((available) => {
      if (available) {
        wallet.getAddress().then((addr) => {
          if (addr) {
            setAddress(addr);
            checkNetwork();
          }
        });
      }
    });
  }, [checkNetwork]);

  useEffect(() => {
    if (!address) return;

    const interval = setInterval(async () => {
      const addr = await wallet.getAddress();
      if (addr !== address) {
        if (addr) {
          setAddress(addr);
        } else {
          disconnect();
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [address, disconnect]);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: address !== null,
        isCorrectNetwork,
        isConnecting,
        error,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
