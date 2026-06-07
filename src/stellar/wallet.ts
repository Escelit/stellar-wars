import {
  isConnected,
  getPublicKey,
  signTransaction,
  getNetwork,
} from '@stellar/freighter-api';

export const wallet = {
  /**
   * Check if Freighter is installed and connected
   */
  async isAvailable(): Promise<boolean> {
    return isConnected();
  },

  /**
   * Get the public key of the connected account
   */
  async getAddress(): Promise<string | null> {
    try {
      if (!(await isConnected())) {
        return null;
      }
      return await getPublicKey();
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
      return await getNetwork();
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
      return await signTransaction(xdr, { network });
    } catch (e) {
      console.error('Failed to sign transaction with Freighter:', e);
      return null;
    }
  },
};
