import { useStellarWallet } from '@/hooks/useStellarWallet';
import { useNarrative } from '@/hooks/useNarrative';
import ChoiceCard from '@/components/ChoiceCard';
import CommanderHUD from '@/components/CommanderHUD';
import ChapterTransition from '@/components/ChapterTransition';
import SaveLoadModal from '@/components/SaveLoadModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { getFaction } from '@/stellar/factions';
import type { Commander } from '@/stellar/contracts';

export default function GamePage() {
  const { isConnected } = useStellarWallet();
  const {
    phase,
    isAuthenticated,
    isAuthing,
    currentNode,
    selectedCommander,
    commanders,
    isLoadingNode,
    isMakingChoice,
    chapterTransition,
    saves,
    isSaving,
    isLoadingSave,
    authError,
    authenticate,
    selectCommander,
    makeChoice,
    dismissTransition,
    openSaveLoad,
    closeSaveLoad,
    handleSave,
    handleLoad,
  } = useNarrative();

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="flex h-64 items-center justify-center">
          <p className="text-stellar-400">Connect your Freighter wallet to start the campaign.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 pt-16">
        <span className="text-5xl">📖</span>
        <h1 className="text-3xl font-bold text-stellar-100">Campaign</h1>
        <p className="text-center text-stellar-400">
          Authenticate with your Stellar wallet to begin your journey.
        </p>

        {authError && (
          <div className="w-full rounded-lg border border-imperial-500 bg-imperial-600/20 p-3 text-center text-sm text-imperial-300">
            {authError}
          </div>
        )}

        <Button size="lg" onClick={authenticate} isLoading={isAuthing}>
          {isAuthing ? 'Authenticating...' : 'Authenticate with Wallet'}
        </Button>
      </div>
    );
  }

  if (phase === 'select-commander') {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-stellar-100">Choose Your Commander</h1>
          <p className="mt-2 text-lg text-stellar-400">
            Select a commander to lead through the campaign
          </p>
        </div>

        {isLoadingNode ? (
          <div className="flex h-48 items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : commanders.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <span className="text-4xl">⚔️</span>
            <p className="text-stellar-400">You need to mint a commander first.</p>
            <Button onClick={() => window.location.href = '/mint'}>
              Mint Commander
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {commanders.map((c: Commander) => {
              const faction = getFaction(c.faction);
              return (
                <button
                  key={c.id}
                  onClick={() => selectCommander(c)}
                  className="flex flex-col rounded-xl border border-stellar-700 bg-stellar-800 p-6 shadow-sm transition-all hover:border-cosmic-600 hover:shadow-md hover:shadow-cosmic-900/20 text-left"
                >
                  <div className="flex flex-col items-center gap-3 py-4">
                    <span className="text-4xl">{faction?.icon || '⚔️'}</span>
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-stellar-100">{c.name}</h3>
                      <p className="text-sm text-stellar-400">#{c.id}</p>
                    </div>
                    <Button size="sm" variant="primary">
                      Select Commander
                    </Button>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (isLoadingNode || (phase === 'playing' && !currentNode)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-8 space-y-4">
            {selectedCommander && <CommanderHUD commander={selectedCommander} />}

            <div className="flex flex-col gap-2">
              <Button variant="secondary" size="sm" onClick={openSaveLoad} className="w-full justify-center">
                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save / Load
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={() => selectCommander(selectedCommander)}
              >
                Restart Chapter
              </Button>
            </div>

            {currentNode && (
              <div className="rounded-lg bg-stellar-800/50 px-3 py-2 text-center">
                <span className="text-xs font-medium uppercase tracking-wider text-stellar-500">
                  Chapter {currentNode.chapter}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-3">
          {currentNode && (
            <>
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-stellar-100">{currentNode.title}</h2>
                    <p className="text-sm text-stellar-500">Chapter {currentNode.chapter}</p>
                  </div>
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-stellar-700/50 text-3xl">
                    📜
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  {currentNode.content.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="mb-4 leading-relaxed text-stellar-200 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </Card>

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stellar-400">
                  {isMakingChoice ? 'Advancing...' : 'Choose Your Path'}
                </h3>
                <div className="space-y-3">
                  {currentNode.choices.map((choice, i) => (
                    <ChoiceCard
                      key={i}
                      choice={choice}
                      index={i}
                      commanderStats={selectedCommander?.stats}
                      disabled={isMakingChoice}
                      onClick={() => makeChoice(i)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {!currentNode && !isLoadingNode && (
            <div className="flex flex-col items-center gap-4 py-16">
              <span className="text-4xl">📖</span>
              <p className="text-stellar-400">No narrative data available.</p>
              <Button variant="secondary" onClick={() => selectCommander(selectedCommander)}>
                Start New Game
              </Button>
            </div>
          )}
        </div>
      </div>

      {chapterTransition && (
        <ChapterTransition
          fromChapter={chapterTransition.from}
          toChapter={chapterTransition.to}
          onDismiss={dismissTransition}
        />
      )}

      <SaveLoadModal
        isOpen={phase === 'save-load'}
        saves={saves}
        isSaving={isSaving}
        isLoadingSave={isLoadingSave}
        onSave={handleSave}
        onLoad={handleLoad}
        onClose={closeSaveLoad}
      />
    </div>
  );
}
