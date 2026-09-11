import { useState, useCallback, useEffect } from 'react';
import { useStellarWallet } from '@/hooks/useStellarWallet';
import {
  marketplace,
  mintController,
  contractActions,
  type Commander,
  type Listing,
} from '@/stellar/contracts';
import { simulateContractCall, buildTransaction, sendContractCall } from '@/stellar/soroban';
import { wallet } from '@/stellar/wallet';
import { NETWORK_PASSPHRASE } from '@/stellar/config';
import { getFaction, RARITY_LABELS, RARITY_COLORS } from '@/stellar/factions';
import PageShell from '@/components/PageShell';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import StatBars from '@/components/StatBars';
import CommanderDetailModal from '@/components/CommanderDetailModal';

type TxStatus = 'idle' | 'preparing' | 'signing' | 'pending' | 'confirmed' | 'failed';

interface ListingWithCommander extends Listing {
  commander?: Commander | null;
}

export default function MarketplacePage() {
  const { address, isConnected } = useStellarWallet();
  const [activeTab, setActiveTab] = useState<'browse' | 'my-listings'>('browse');
  const [listings, setListings] = useState<ListingWithCommander[]>([]);
  const [myListings, setMyListings] = useState<ListingWithCommander[]>([]);
  const [myCommanders, setMyCommanders] = useState<Commander[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const [showListModal, setShowListModal] = useState(false);
  const [selectedCommanderToList, setSelectedCommanderToList] = useState<Commander | null>(null);
  const [listPrice, setListPrice] = useState('');

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedListingToBuy, setSelectedListingToBuy] = useState<ListingWithCommander | null>(null);

  const [detailCommander, setDetailCommander] = useState<Commander | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const allListings: ListingWithCommander[] = [];
      let listingId = 0;

      while (listingId < 100) {
        try {
          const listing = await marketplace.getListing(listingId);
          if (listing && listing.is_active) {
            const commander = await mintController.getCommander(listing.commander_id);
            allListings.push({ ...listing, commander });
          }
        } catch {
          break;
        }
        listingId++;
      }

      setListings(allListings);

      if (address) {
        const sellerListings = await marketplace.getSellerListings(address);
        const myListingsWithCommander: ListingWithCommander[] = [];

        for (const listing of sellerListings) {
          if (listing.is_active) {
            const commander = await mintController.getCommander(listing.commander_id);
            myListingsWithCommander.push({ ...listing, commander });
          }
        }

        setMyListings(myListingsWithCommander);
      }
    } catch {
      setListings([]);
      setMyListings([]);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const fetchMyCommanders = useCallback(async () => {
    if (!address) return;
    try {
      const commanders = await mintController.getOwnedCommanders(address);
      const unlisted: Commander[] = [];

      for (const c of commanders || []) {
        const existingListing = await marketplace.getCommanderListing(c.id);
        if (!existingListing || !existingListing.is_active) {
          unlisted.push(c);
        }
      }

      setMyCommanders(unlisted);
    } catch {
      setMyCommanders([]);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected) {
      fetchListings();
      fetchMyCommanders();
    }
  }, [isConnected, fetchListings, fetchMyCommanders]);

  const handleListCommander = useCallback(async () => {
    if (!address || !selectedCommanderToList || !listPrice) return;

    setTxStatus('preparing');
    setError(null);

    try {
      const priceInStroops = BigInt(Math.floor(parseFloat(listPrice) * 10_000_000));
      const action = contractActions.listCommander(address, selectedCommanderToList.id, priceInStroops);

      const simulation = await simulateContractCall({
        contractId: action.contractId,
        method: action.method,
        args: action.args,
        source: address,
      });

      setTxStatus('signing');
      const transaction = await buildTransaction(address, simulation);
      const signedXdr = await wallet.sign(transaction.toXDR(), NETWORK_PASSPHRASE.TESTNET);

      if (!signedXdr) {
        throw new Error('Transaction signing was cancelled');
      }

      setTxStatus('pending');
      const { hash } = await sendContractCall(signedXdr);

      setTxStatus('confirmed');
      setTxHash(hash);
      setShowListModal(false);
      setSelectedCommanderToList(null);
      setListPrice('');
      fetchListings();
      fetchMyCommanders();
    } catch (e) {
      setTxStatus('failed');
      setError(e instanceof Error ? e.message : 'Failed to list commander');
    }
  }, [address, selectedCommanderToList, listPrice, fetchListings, fetchMyCommanders]);

  const handleBuyCommander = useCallback(async () => {
    if (!address || !selectedListingToBuy) return;

    setTxStatus('preparing');
    setError(null);

    try {
      const action = contractActions.buyCommander(address, selectedListingToBuy.id);

      const simulation = await simulateContractCall({
        contractId: action.contractId,
        method: action.method,
        args: action.args,
        source: address,
      });

      setTxStatus('signing');
      const transaction = await buildTransaction(address, simulation);
      const signedXdr = await wallet.sign(transaction.toXDR(), NETWORK_PASSPHRASE.TESTNET);

      if (!signedXdr) {
        throw new Error('Transaction signing was cancelled');
      }

      setTxStatus('pending');
      const { hash } = await sendContractCall(signedXdr);

      setTxStatus('confirmed');
      setTxHash(hash);
      setShowBuyModal(false);
      setSelectedListingToBuy(null);
      fetchListings();
      fetchMyCommanders();
    } catch (e) {
      setTxStatus('failed');
      setError(e instanceof Error ? e.message : 'Failed to buy commander');
    }
  }, [address, selectedListingToBuy, fetchListings, fetchMyCommanders]);

  const handleCancelListing = useCallback(async (listing: ListingWithCommander) => {
    if (!address) return;

    setTxStatus('preparing');
    setError(null);

    try {
      const action = contractActions.cancelListing(address, listing.id);

      const simulation = await simulateContractCall({
        contractId: action.contractId,
        method: action.method,
        args: action.args,
        source: address,
      });

      setTxStatus('signing');
      const transaction = await buildTransaction(address, simulation);
      const signedXdr = await wallet.sign(transaction.toXDR(), NETWORK_PASSPHRASE.TESTNET);

      if (!signedXdr) {
        throw new Error('Transaction signing was cancelled');
      }

      setTxStatus('pending');
      const { hash } = await sendContractCall(signedXdr);

      setTxStatus('confirmed');
      setTxHash(hash);
      fetchListings();
      fetchMyCommanders();
    } catch (e) {
      setTxStatus('failed');
      setError(e instanceof Error ? e.message : 'Failed to cancel listing');
    }
  }, [address, fetchListings, fetchMyCommanders]);

  const formatPrice = (price: bigint) => {
    const xlm = Number(price) / 10_000_000;
    return xlm.toFixed(2);
  };

  if (!isConnected) {
    return (
      <PageShell title="Marketplace" description="Connect your wallet to access the commander marketplace">
        <div className="flex h-64 items-center justify-center">
          <p className="text-stellar-400">Connect your Freighter wallet to browse and trade commanders.</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Marketplace"
      description={`${activeTab === 'browse' ? `${listings.length} listing${listings.length === 1 ? '' : 's'} available` : `${myListings.length} active listing${myListings.length === 1 ? '' : 's'}`}`}
      actions={
        <Button onClick={() => { fetchMyCommanders(); setShowListModal(true); }} disabled={myCommanders.length === 0}>
          List Commander
        </Button>
      }
    >
      <div className="mb-6 flex gap-1 rounded-lg bg-stellar-900/50 p-1 w-fit">
        <button
          onClick={() => setActiveTab('browse')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'browse' ? 'bg-cosmic-600 text-white' : 'text-stellar-400 hover:text-stellar-200'
          }`}
        >
          Browse Listings
        </button>
        <button
          onClick={() => setActiveTab('my-listings')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'my-listings' ? 'bg-cosmic-600 text-white' : 'text-stellar-400 hover:text-stellar-200'
          }`}
        >
          My Listings
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-imperial-500 bg-imperial-600/20 p-3 text-sm text-imperial-300">
          {error}
        </div>
      )}

      {txStatus === 'confirmed' && txHash && (
        <div className="mb-4 rounded-lg border border-green-500 bg-green-600/20 p-3 text-sm text-green-300">
          Transaction confirmed! TX: <span className="font-mono text-xs">{txHash}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cosmic-600 border-t-transparent" />
        </div>
      ) : activeTab === 'browse' ? (
        listings.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <span className="text-4xl">🛒</span>
            <p className="text-stellar-400">No commanders listed for sale yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onBuy={() => { setSelectedListingToBuy(listing); setShowBuyModal(true); }}
                onViewDetails={() => {
                  if (listing.commander) {
                    setDetailCommander(listing.commander);
                    setIsDetailOpen(true);
                  }
                }}
                formatPrice={formatPrice}
                isOwner={listing.seller === address}
              />
            ))}
          </div>
        )
      ) : (
        myListings.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <span className="text-4xl">📦</span>
            <p className="text-stellar-400">You have no active listings.</p>
            <Button onClick={() => { fetchMyCommanders(); setShowListModal(true); }} disabled={myCommanders.length === 0}>
              List a Commander
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {myListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onCancel={() => handleCancelListing(listing)}
                onViewDetails={() => {
                  if (listing.commander) {
                    setDetailCommander(listing.commander);
                    setIsDetailOpen(true);
                  }
                }}
                formatPrice={formatPrice}
                isOwner={true}
              />
            ))}
          </div>
        )
      )}

      <Modal isOpen={showListModal} onClose={() => setShowListModal(false)} title="List Commander for Sale">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-stellar-300">Select Commander</label>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {myCommanders.map((c) => {
                const faction = getFaction(c.faction);
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCommanderToList(c)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                      selectedCommanderToList?.id === c.id
                        ? 'border-cosmic-500 bg-cosmic-600/20'
                        : 'border-stellar-700 bg-stellar-800/50 hover:border-stellar-600'
                    }`}
                  >
                    <span className="text-2xl">{faction?.icon || '⚔️'}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-stellar-200">{c.name}</p>
                      <span className={`text-xs ${RARITY_COLORS[c.rarity]}`}>{RARITY_LABELS[c.rarity]}</span>
                    </div>
                    <span className="text-xs text-stellar-500">#{c.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedCommanderToList && (
            <div className="rounded-lg bg-stellar-900/50 p-3">
              <p className="text-xs text-stellar-500 mb-2">Preview</p>
              <StatBars stats={selectedCommanderToList.stats} size="sm" showLabels={false} />
            </div>
          )}

          <div>
            <label htmlFor="list-price" className="mb-1.5 block text-sm font-medium text-stellar-300">
              Price (XLM)
            </label>
            <input
              id="list-price"
              type="number"
              value={listPrice}
              onChange={(e) => setListPrice(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="input"
            />
          </div>

          <Button
            onClick={handleListCommander}
            disabled={!selectedCommanderToList || !listPrice || parseFloat(listPrice) <= 0 || txStatus !== 'idle'}
            isLoading={txStatus === 'preparing' || txStatus === 'signing' || txStatus === 'pending'}
            className="w-full"
          >
            {txStatus === 'idle' && 'List for Sale'}
            {txStatus === 'preparing' && 'Preparing...'}
            {txStatus === 'signing' && 'Sign in Freighter...'}
            {txStatus === 'pending' && 'Confirming...'}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showBuyModal} onClose={() => setShowBuyModal(false)} title="Buy Commander">
        {selectedListingToBuy && (
          <div className="space-y-4">
            {selectedListingToBuy.commander && (
              <div className="flex flex-col items-center gap-3 py-4">
                <span className="text-4xl">{getFaction(selectedListingToBuy.commander.faction)?.icon || '⚔️'}</span>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-stellar-100">{selectedListingToBuy.commander.name}</h3>
                  <span className={`text-sm ${RARITY_COLORS[selectedListingToBuy.commander.rarity]}`}>
                    {RARITY_LABELS[selectedListingToBuy.commander.rarity]}
                  </span>
                </div>
                <StatBars stats={selectedListingToBuy.commander.stats} size="sm" />
              </div>
            )}

            <div className="rounded-lg bg-stellar-900/50 p-4 text-center">
              <p className="text-xs text-stellar-500 mb-1">Price</p>
              <p className="text-2xl font-bold text-stellar-100">{formatPrice(selectedListingToBuy.price)} XLM</p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowBuyModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleBuyCommander}
                disabled={txStatus !== 'idle'}
                isLoading={txStatus === 'preparing' || txStatus === 'signing' || txStatus === 'pending'}
                className="flex-1"
              >
                {txStatus === 'idle' && 'Buy Commander'}
                {txStatus === 'preparing' && 'Preparing...'}
                {txStatus === 'signing' && 'Sign in Freighter...'}
                {txStatus === 'pending' && 'Confirming...'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <CommanderDetailModal
        commander={detailCommander}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setDetailCommander(null); }}
      />
    </PageShell>
  );
}

function ListingCard({
  listing,
  onBuy,
  onCancel,
  onViewDetails,
  formatPrice,
  isOwner,
}: {
  listing: ListingWithCommander;
  onBuy?: () => void;
  onCancel?: () => void;
  onViewDetails: () => void;
  formatPrice: (price: bigint) => string;
  isOwner: boolean;
}) {
  const commander = listing.commander;
  const faction = commander ? getFaction(commander.faction) : null;

  return (
    <div className="flex flex-col rounded-xl border border-stellar-700 bg-stellar-800 p-5 shadow-sm transition-all hover:border-cosmic-600 hover:shadow-md hover:shadow-cosmic-900/20">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{faction?.icon || '⚔️'}</span>
          <div>
            <h3 className="text-base font-semibold text-stellar-100">{commander?.name || `Commander #${listing.commander_id}`}</h3>
            {commander && (
              <span className={`text-xs font-medium ${RARITY_COLORS[commander.rarity]}`}>
                {RARITY_LABELS[commander.rarity]}
              </span>
            )}
          </div>
        </div>
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium text-white ${faction?.badgeColor || 'bg-stellar-600'}`}>
          {faction?.name || 'Unknown'}
        </span>
      </div>

      {commander && (
        <div className="mb-3">
          <StatBars stats={commander.stats} size="sm" showLabels={false} />
        </div>
      )}

      <div className="mb-3 rounded-lg bg-stellar-900/50 px-3 py-2 text-center">
        <p className="text-xs text-stellar-500">Price</p>
        <p className="text-lg font-bold text-stellar-100">{formatPrice(listing.price)} XLM</p>
      </div>

      <div className="flex gap-2">
        {isOwner ? (
          <>
            <Button variant="ghost" size="sm" onClick={onViewDetails} className="flex-1 justify-center">
              Details
            </Button>
            <Button variant="danger" size="sm" onClick={onCancel} className="flex-1 justify-center">
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={onViewDetails} className="flex-1 justify-center">
              Details
            </Button>
            <Button size="sm" onClick={onBuy} className="flex-1 justify-center">
              Buy
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
