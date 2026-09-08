import { useState, useCallback, useEffect } from 'react';
import { useStellarWallet } from '@/hooks/useStellarWallet';
import { wallet } from '@/stellar/wallet';
import { NETWORK_PASSPHRASE } from '@/stellar/config';
import { mintController, type Commander } from '@/stellar/contracts';
import {
  fetchNode,
  submitChoice,
  createPlaythrough,
  listPlaythroughs,
  listSaves,
  saveGame,
  loadSave,
  getChallenge,
  connectWallet,
  type NarrativeNode,
  type Choice,
  type CommanderStats,
  type SaveSlot,
} from '@/stellar/api';

export type GamePhase = 'auth' | 'select-commander' | 'playing' | 'transition' | 'save-load';

export interface NarrativeState {
  phase: GamePhase;
  isAuthenticated: boolean;
  isAuthing: boolean;
  playthroughId: string | null;
  currentNode: NarrativeNode | null;
  selectedCommander: Commander | null;
  commanders: Commander[];
  isLoadingNode: boolean;
  isMakingChoice: boolean;
  lastChoice: Choice | null;
  chapterTransition: { from: number; to: number } | null;
  saves: SaveSlot[];
  isSaving: boolean;
  isLoadingSave: boolean;
  authError: string | null;
  narrativeError: string | null;
}

function toErrorMessage(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return 'An unexpected error occurred';
}

export function useNarrative() {
  const { address, isConnected } = useStellarWallet();
  const [state, setState] = useState<NarrativeState>({
    phase: 'auth',
    isAuthenticated: !!localStorage.getItem('sw_jwt'),
    isAuthing: false,
    playthroughId: null,
    currentNode: null,
    selectedCommander: null,
    commanders: [],
    isLoadingNode: false,
    isMakingChoice: false,
    lastChoice: null,
    chapterTransition: null,
    saves: [],
    isSaving: false,
    isLoadingSave: false,
    authError: null,
    narrativeError: null,
  });

  const setPartial = useCallback((partial: Partial<NarrativeState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const authenticate = useCallback(async () => {
    if (!address) return;
    setPartial({ isAuthing: true, authError: null });

    try {
      const challenge = await getChallenge(address);
      const signedXdr = await wallet.sign(challenge, NETWORK_PASSPHRASE.TESTNET);
      if (!signedXdr) {
        setPartial({ isAuthing: false, authError: 'Signing cancelled' });
        return;
      }

      const result = await connectWallet(address, challenge, signedXdr);
      localStorage.setItem('sw_jwt', result.token);
      setPartial({ isAuthenticated: true, isAuthing: false, phase: 'select-commander' });
    } catch (e) {
      setPartial({
        isAuthing: false,
        authError: e instanceof Error ? e.message : 'Authentication failed',
      });
    }
  }, [address, setPartial]);

  const loadCommanders = useCallback(async () => {
    if (!address) return;
    try {
      const commanders = await mintController.getOwnedCommanders(address);
      setPartial({ commanders: commanders || [], narrativeError: null });
    } catch (e) {
      setPartial({ commanders: [], narrativeError: `Failed to load commanders: ${toErrorMessage(e)}` });
    }
  }, [address, setPartial]);

  const startGame = useCallback(
    async (commander: Commander | null) => {
      setPartial({ selectedCommander: commander, isLoadingNode: true });

      try {
        const existingPlaythroughs = await listPlaythroughs();
        let playthroughId: string;

        if (existingPlaythroughs.playthroughs.length > 0) {
          playthroughId = existingPlaythroughs.playthroughs[0]!.id;
          const currentId = existingPlaythroughs.playthroughs[0]!.currentNode;
          if (currentId) {
            const node = await fetchNode(currentId);
            setPartial({ playthroughId, currentNode: node, isLoadingNode: false, phase: 'playing', narrativeError: null });
            return;
          }
        }

        const created = await createPlaythrough(commander?.id.toString());
        playthroughId = created.id;

        const node = await fetchNode(created.currentNode);
        setPartial({ playthroughId, currentNode: node, isLoadingNode: false, phase: 'playing', narrativeError: null });
      } catch (e) {
        setPartial({ isLoadingNode: false, narrativeError: `Failed to start game: ${toErrorMessage(e)}` });
      }
    },
    [setPartial]
  );

  const makeChoice = useCallback(
    async (choiceIndex: number) => {
      if (!state.playthroughId || !state.currentNode || state.isMakingChoice) return;

      setPartial({ isMakingChoice: true });

      try {
        let commanderStats: CommanderStats | undefined;
        if (state.selectedCommander) {
          const s = state.selectedCommander.stats;
          commanderStats = {
            attack: s[0] ?? 0,
            defense: s[1] ?? 0,
            strategy: s[2] ?? 0,
            influence: s[3] ?? 0,
            morale: state.selectedCommander.morale,
          };
        }

        const { chosenChoice, nextNode } = await submitChoice(
          state.playthroughId,
          choiceIndex,
          commanderStats
        );

        const prevChapter = state.currentNode.chapter;
        const currentCommander = state.selectedCommander;

        if (nextNode.chapter !== prevChapter) {
          setPartial({
            lastChoice: chosenChoice,
            chapterTransition: { from: prevChapter, to: nextNode.chapter },
            isMakingChoice: false,
            currentNode: nextNode,
            selectedCommander: currentCommander,
            narrativeError: null,
          });
        } else {
          setPartial({
            currentNode: nextNode,
            lastChoice: chosenChoice,
            isMakingChoice: false,
            narrativeError: null,
          });
        }
      } catch (e) {
        setPartial({ isMakingChoice: false, narrativeError: toErrorMessage(e) });
      }
    },
    [state.playthroughId, state.currentNode, state.isMakingChoice, state.selectedCommander, setPartial]
  );

  const dismissTransition = useCallback(() => {
    setPartial({ chapterTransition: null, phase: 'playing' });
  }, [setPartial]);

  const openSaveLoad = useCallback(async () => {
    try {
      const saves = await listSaves();
      setPartial({ saves: saves.saves, phase: 'save-load', narrativeError: null });
    } catch (e) {
      setPartial({ saves: [], phase: 'save-load', narrativeError: `Failed to load saves: ${toErrorMessage(e)}` });
    }
  }, [setPartial]);

  const closeSaveLoad = useCallback(() => {
    setPartial({ phase: 'playing' });
  }, [setPartial]);

  const handleSave = useCallback(
    async (name: string) => {
      if (!state.playthroughId || !state.currentNode) return;
      setPartial({ isSaving: true });

      try {
        const saveData = JSON.stringify({
          currentNode: state.currentNode.id,
          chapter: state.currentNode.chapter,
          commanderId: state.selectedCommander?.id,
        });

        await saveGame(state.playthroughId, name, saveData);
        const saves = await listSaves();
        setPartial({ saves: saves.saves, isSaving: false, narrativeError: null });
      } catch (e) {
        setPartial({ isSaving: false, narrativeError: `Failed to save game: ${toErrorMessage(e)}` });
      }
    },
    [state.playthroughId, state.currentNode, state.selectedCommander, setPartial]
  );

  const handleLoad = useCallback(
    async (save: SaveSlot) => {
      setPartial({ isLoadingSave: true });

      try {
        const loaded = await loadSave(save.playthroughId);
        const saveData: { currentNode?: string } = JSON.parse(loaded.data);
        if (!saveData.currentNode) {
          throw new Error('Save data is missing a node reference');
        }
        const node = await fetchNode(saveData.currentNode);

        setPartial({
          currentNode: node,
          playthroughId: save.playthroughId,
          phase: 'playing',
          isLoadingSave: false,
          narrativeError: null,
        });
      } catch (e) {
        setPartial({ isLoadingSave: false, narrativeError: `Failed to load game: ${toErrorMessage(e)}` });
      }
    },
    [setPartial]
  );

  const selectCommander = useCallback(
    (commander: Commander | null) => {
      startGame(commander);
    },
    [startGame]
  );

  useEffect(() => {
    if (isConnected && address && !state.isAuthenticated) {
      const token = localStorage.getItem('sw_jwt');
      if (token) {
        setPartial({ isAuthenticated: true, phase: 'select-commander' });
      }
    }
  }, [isConnected, address, state.isAuthenticated, setPartial]);

  useEffect(() => {
    if (state.phase === 'select-commander') {
      loadCommanders();
    }
  }, [state.phase, loadCommanders]);

  return {
    ...state,
    authenticate,
    selectCommander,
    makeChoice,
    dismissTransition,
    openSaveLoad,
    closeSaveLoad,
    handleSave,
    handleLoad,
  };
}
