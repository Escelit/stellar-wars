import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { SaveSlot } from '@/stellar/api';

interface SaveLoadModalProps {
  isOpen: boolean;
  saves: SaveSlot[];
  isSaving: boolean;
  isLoadingSave: boolean;
  onSave: (name: string) => void;
  onLoad: (save: SaveSlot) => void;
  onClose: () => void;
}

export default function SaveLoadModal({
  isOpen,
  saves,
  isSaving,
  isLoadingSave,
  onSave,
  onLoad,
  onClose,
}: SaveLoadModalProps) {
  const [tab, setTab] = useState<'save' | 'load'>('save');
  const [saveName, setSaveName] = useState('');

  const handleSave = () => {
    const name = saveName.trim() || `Slot ${saves.length + 1}`;
    onSave(name);
    setSaveName('');
  };

  const handleLoad = (save: SaveSlot) => {
    onLoad(save);
  };

  const footer = (
    <Button variant="ghost" onClick={onClose}>
      Cancel
    </Button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save / Load Game" footer={footer}>
      <div className="flex gap-1 rounded-lg bg-stellar-900/50 p-1 mb-4">
        <button
          onClick={() => setTab('save')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            tab === 'save'
              ? 'bg-cosmic-600 text-white'
              : 'text-stellar-400 hover:text-stellar-200'
          }`}
        >
          Save
        </button>
        <button
          onClick={() => setTab('load')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            tab === 'load'
              ? 'bg-cosmic-600 text-white'
              : 'text-stellar-400 hover:text-stellar-200'
          }`}
        >
          Load
        </button>
      </div>

      {tab === 'save' ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="save-name" className="mb-1.5 block text-sm font-medium text-stellar-300">
              Save Name
            </label>
            <input
              id="save-name"
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder={`Slot ${saves.length + 1}`}
              className="input"
              maxLength={32}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            isLoading={isSaving}
            className="w-full"
          >
            Save Game
          </Button>

          {saves.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-stellar-500">
                Existing Saves
              </p>
              <div className="space-y-2">
                {saves.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-stellar-700 bg-stellar-800/50 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-stellar-200">{s.name}</p>
                      <p className="text-xs text-stellar-500">
                        {new Date(s.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {saves.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <span className="text-3xl">💾</span>
              <p className="text-sm text-stellar-400">No saved games found.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {saves.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-stellar-700 bg-stellar-800/50 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-stellar-200">{s.name}</p>
                    <p className="text-xs text-stellar-500">
                      {new Date(s.updatedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleLoad(s)}
                    disabled={isLoadingSave}
                  >
                    {isLoadingSave ? 'Loading...' : 'Load'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
