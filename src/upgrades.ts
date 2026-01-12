import { Upgrade, UpgradeId, GameState } from './types';

export const UPGRADES: Upgrade[] = [
  {
    id: 'faster_kettle',
    name: 'Faster Kettle',
    description: 'Boil time reduced from 4s to 3s',
    cost: 10
  },
  {
    id: 'third_station',
    name: 'Third Station',
    description: 'Unlock a third tea station',
    cost: 25
  },
  {
    id: 'patience_boost',
    name: 'Comfy Chairs',
    description: 'Customers wait 20% longer',
    cost: 15
  },
  {
    id: 'premium_cups',
    name: 'Premium Cups',
    description: '+1 tip per order',
    cost: 20
  },
  {
    id: 'relationship_building',
    name: 'Relationship Building',
    description: 'Customers forgive one extra mistake',
    cost: 15
  }
];

export function canAffordUpgrade(state: GameState, upgrade: Upgrade): boolean {
  return state.tips >= upgrade.cost && !state.upgrades.includes(upgrade.id);
}

export function purchaseUpgrade(state: GameState, upgradeId: UpgradeId): boolean {
  const upgrade = UPGRADES.find(u => u.id === upgradeId);
  if (!upgrade) return false;

  if (canAffordUpgrade(state, upgrade)) {
    state.tips -= upgrade.cost;
    state.upgrades.push(upgradeId);
    return true;
  }
  return false;
}
