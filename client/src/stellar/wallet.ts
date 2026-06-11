import {
  isConnected,
  getAddress,
  signTransaction,
  getNetwork,
} from '@stellar/freighter-api';

export const wallet = {
  /**
   * Check if Freighter is installed and connected
   */
  async isAvailable(): Promise<boolean> {
    const result = await isConnected();
    return !!result.isConnected;
  },

  /**
   * Get the public key of the connected account
   */
  async getAddress(): Promise<string | null> {
    try {
      const connected = await isConnected();
      if (!connected.isConnected) {
        return null;
      }
      const result = await getAddress();
      return result.address || null;
    } catch (e) {
      console.error('Failed to get Freighter public key:', e);
      return null;
    }
  },

  /**
   * Get the current network Freighter is configured to
   */
  async getNetwork(): Promise<string | null> {
    try {
      const result = await getNetwork();
      return result.networkPassphrase || null;
    } catch (e) {
      console.error('Failed to get Freighter network:', e);
      return null;
    }
  },

  /**
   * Sign a transaction XDR
   */
  async sign(xdr: string, network: string): Promise<string | null> {
    try {
      const result = await signTransaction(xdr, { 
        networkPassphrase: network 
      });
      return result.signedTxXdr || null;
    } catch (e) {
      console.error('Failed to sign transaction with Freighter:', e);
      return null;
    }
  },
};
