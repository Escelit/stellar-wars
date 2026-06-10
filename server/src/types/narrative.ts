export interface Choice {
  text: string;
  nextNodeId: string;
  statGate?: { stat: string; minValue: number };
}

export interface NarrativeNodeResponse {
  id: string;
  chapter: number;
  title: string;
  content: string;
  choices: Choice[];
  createdAt: string;
}

export interface CommanderStats {
  attack: number;
  defense: number;
  strategy: number;
  influence: number;
  morale: number;
}

export interface ChooseBody {
  playthroughId: string;
  choiceIndex: number;
  commanderStats?: CommanderStats;
}

export interface SaveBody {
  playthroughId: string;
  name?: string;
  data?: string;
}
