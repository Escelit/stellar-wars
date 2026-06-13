import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sw_jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sw_jwt');
    }
    return Promise.reject(err);
  }
);

export interface NarrativeNode {
  id: string;
  chapter: number;
  title: string;
  content: string;
  choices: Choice[];
  createdAt: string;
}

export interface Choice {
  text: string;
  nextNodeId: string;
  statGate?: { stat: string; minValue: number };
}

export interface CommanderStats {
  attack: number;
  defense: number;
  strategy: number;
  influence: number;
  morale: number;
}

export interface SaveSlot {
  id: string;
  name: string;
  playthroughId: string;
  updatedAt: string;
}

export async function getChallenge(publicKey: string): Promise<string> {
  const { data } = await api.get('/auth/challenge', {
    params: { publicKey },
  });
  return data.challenge;
}

export async function connectWallet(
  publicKey: string,
  challenge: string,
  signature: string
): Promise<{ token: string; user: { id: string; stellarPubKey: string; displayName: string | null } }> {
  const { data } = await api.post('/auth/connect', {
    publicKey,
    challenge,
    signature,
  });
  return data;
}

export async function fetchNode(nodeId: string): Promise<NarrativeNode> {
  const { data } = await api.get(`/narrative/node/${nodeId}`);
  return data;
}

export async function submitChoice(
  playthroughId: string,
  choiceIndex: number,
  commanderStats?: CommanderStats
): Promise<{ chosenChoice: Choice; nextNode: NarrativeNode }> {
  const { data } = await api.post('/narrative/choose', {
    playthroughId,
    choiceIndex,
    commanderStats,
  });
  return data;
}

export async function createPlaythrough(
  commanderId?: string,
  startingNodeId?: string
): Promise<{ id: string; chapter: number; currentNode: string; createdAt: string }> {
  const { data } = await api.post('/playthrough', {
    commanderId,
    startingNodeId,
  });
  return data;
}

export async function listPlaythroughs(): Promise<{ playthroughs: Array<{ id: string; chapter: number; currentNode: string | null; isActive: boolean; createdAt: string; updatedAt: string }> }> {
  const { data } = await api.get('/playthroughs');
  return data;
}

export async function listSaves(): Promise<{ saves: SaveSlot[] }> {
  const { data } = await api.get('/saves');
  return data;
}

export async function loadSave(playthroughId: string): Promise<{ id: string; name: string; playthroughId: string; data: string; createdAt: string; updatedAt: string }> {
  const { data } = await api.get(`/save/${playthroughId}`);
  return data;
}

export async function saveGame(
  playthroughId: string,
  name?: string,
  data?: string
): Promise<{ id: string; name: string; playthroughId: string; data: string; createdAt: string; updatedAt: string }> {
  const { data: result } = await api.post('/save', {
    playthroughId,
    name,
    data,
  });
  return result;
}
