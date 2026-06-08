import { useContext } from 'react';
import { WalletContext } from '@/components/WalletProvider';

export function useStellarWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useStellarWallet must be used within a WalletProvider');
  }
  return context;
}
