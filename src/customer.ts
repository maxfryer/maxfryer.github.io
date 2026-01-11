import { Customer, TeaType, GameState, Station, MAX_WRONG_ORDERS } from './types';
import { RECIPES, TEA_TYPES } from './recipes';

let nextCustomerId = 0;

export function getBasePatience(state: GameState): number {
  const base = Math.max(20, 45 - (state.day - 1) * 5);
  return state.upgrades.includes('patience_boost') ? base * 1.2 : base;
}

export function getCustomersPerDay(day: number): number {
  return 6 + (day - 1) * 2;
}

export function getMaxQueueSize(day: number): number {
  // Day 1: 3 customers, Day 2: 4, Day 3+: 5
  return Math.min(5, 2 + day);
}

export function createCustomer(state: GameState): Customer {
  const patience = getBasePatience(state);
  return {
    id: nextCustomerId++,
    order: TEA_TYPES[Math.floor(Math.random() * TEA_TYPES.length)],
    patience,
    maxPatience: patience
  };
}

export function updateCustomers(state: GameState, dt: number): void {
  // Update patience for existing customers
  for (const customer of state.customers) {
    customer.patience -= dt;
  }

  // Count customers who ran out of patience (complaints)
  const impatientCustomers = state.customers.filter(c => c.patience <= 0).length;
  if (impatientCustomers > 0) {
    state.wrongOrdersToday += impatientCustomers;
    if (state.wrongOrdersToday >= MAX_WRONG_ORDERS) {
      state.phase = 'gameover';
    }
  }

  // Remove customers who ran out of patience
  state.customers = state.customers.filter(c => c.patience > 0);

  // Spawn new customers if there's room and we haven't hit the daily limit
  const maxQueue = getMaxQueueSize(state.day);
  if (state.customers.length < maxQueue && state.customersServed + state.customers.length < state.customersTotal) {
    // Random chance to spawn a new customer (average every 5 seconds)
    if (Math.random() < dt / 5) {
      state.customers.push(createCustomer(state));
    }
  }
}

export function calculateTip(station: Station, recipe: typeof RECIPES[TeaType], state: GameState): number {
  let tip = 2; // Base tip for correct tea type

  // Check steep time (within 1s tolerance is perfect)
  const steepDiff = Math.abs(station.steepTimer - recipe.steepTime);
  if (steepDiff <= 1) {
    tip += 1;
  } else if (steepDiff > 3) {
    tip -= 1; // Over/under steeped badly
  }

  // Check milk
  if (recipe.milk && station.hasMilk) {
    tip += 1;
  } else if (recipe.milk && !station.hasMilk) {
    tip -= 1;
  } else if (!recipe.milk && station.hasMilk) {
    tip -= 1;
  }

  // Check sugar
  if (recipe.sugar === 'required' && station.sugarCount > 0) {
    tip += 1;
  } else if (recipe.sugar === 'required' && station.sugarCount === 0) {
    tip -= 1;
  } else if (recipe.sugar === 'none' && station.sugarCount > 0) {
    tip -= 1;
  } else if (recipe.sugar === 'optional') {
    tip += 1; // Bonus for optional items handled correctly
  }

  // Premium cups upgrade
  if (state.upgrades.includes('premium_cups')) {
    tip += 1;
  }

  return Math.max(0, Math.min(5, tip));
}

export function serveCustomer(state: GameState, customerIndex: number): number {
  if (state.servingFromStation === null) return 0;

  const station = state.stations[state.servingFromStation];
  const customer = state.customers[customerIndex];

  if (!station || !customer || !station.cupTeaType) return 0;

  // Check if tea matches order
  let tip = 0;
  const isWrongOrder = station.cupTeaType !== customer.order;

  if (!isWrongOrder) {
    tip = calculateTip(station, RECIPES[customer.order], state);
  } else {
    // Track wrong orders
    state.wrongOrdersToday++;
    if (state.wrongOrdersToday >= MAX_WRONG_ORDERS) {
      state.phase = 'gameover';
    }
  }

  // Remove customer and reset station
  state.customers.splice(customerIndex, 1);
  state.customersServed++;
  state.tips += tip;
  state.dayTips += tip;
  state.servingFromStation = null;

  return tip;
}

export function getOrderDisplayName(teaType: TeaType): string {
  return RECIPES[teaType].name;
}
