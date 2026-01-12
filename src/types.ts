export type TeaType = 'earl_grey' | 'english' | 'peppermint' | 'chai';

export type KettleState = 'empty' | 'filling' | 'full' | 'boiling' | 'ready';

export type CupState = 'empty' | 'has_teabag' | 'steeping' | 'ready';

export interface TeaRecipe {
  name: string;
  steepTime: number;
  milk: boolean;
  sugar: 'none' | 'optional' | 'required';
}

export interface Station {
  id: number;
  kettleState: KettleState;
  kettleTimer: number;
  cupState: CupState;
  cupTeaType: TeaType | null;
  pendingTeaType: TeaType | null;
  teabagChangeTimer: number;
  steepTimer: number;
  steepTarget: number;
  hasMilk: boolean;
  sugarCount: number;
}

export interface Customer {
  id: number;
  order: TeaType;
  patience: number;
  maxPatience: number;
}

export type GamePhase = 'playing' | 'shopping' | 'paused' | 'gameover' | 'won';

export const MAX_DAYS = 4;
export const MAX_WRONG_ORDERS = 2;

export interface GameState {
  phase: GamePhase;
  day: number;
  tips: number;
  dayTips: number;
  dayTimer: number;
  satisfaction: number; // 0-4, where 0 is worst, 4 is best
  customersServed: number;
  customersTotal: number;
  wrongOrdersToday: number;
  stations: Station[];
  customers: Customer[];
  servingFromStation: number | null;
  upgrades: UpgradeId[];
}

export type UpgradeId = 'faster_kettle' | 'third_station' | 'patience_boost' | 'premium_cups' | 'relationship_building';

export interface Upgrade {
  id: UpgradeId;
  name: string;
  description: string;
  cost: number;
}
