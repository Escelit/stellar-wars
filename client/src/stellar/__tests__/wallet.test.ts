import { describe, it, expect, vi } from 'vitest';
import { wallet } from '../wallet';
import * as freighter from '@stellar/freighter-api';

vi.mock('@stellar/freighter-api', () => ({
  isConnected: vi.fn(),
  getAddress: vi.fn(),
  getNetwork: vi.fn(),
  signTransaction: vi.fn(),
}));

describe('wallet wrapper', () => {
  it('isAvailable returns true when freighter is connected', async () => {
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: true });
    const result = await wallet.isAvailable();
    expect(result).toBe(true);
  });

  it('getAddress returns public key when connected', async () => {
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(freighter.getAddress).mockResolvedValue({ address: 'GB...123' });
    const result = await wallet.getAddress();
    expect(result).toBe('GB...123');
  });

  it('getAddress returns null when not connected', async () => {
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: false });
    const result = await wallet.getAddress();
    expect(result).toBe(null);
  });

  it('sign calls freighter signTransaction', async () => {
    vi.mocked(freighter.signTransaction).mockResolvedValue({ signedTxXdr: 'signed_xdr', signerAddress: 'GB...123' });
    const result = await wallet.sign('unsigned_xdr', 'TESTNET');
    expect(result).toBe('signed_xdr');
    expect(freighter.signTransaction).toHaveBeenCalledWith('unsigned_xdr', { networkPassphrase: 'TESTNET' });
  });
});
