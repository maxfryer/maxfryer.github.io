import { GameState } from './types';
import { createStation, updateStation, resetCup } from './station';
import { updateCustomers, getCustomersPerDay } from './customer';

const DAY_DURATION = 180; // 3 minutes per day

export function createGameState(): GameState {
  return {
    phase: 'playing',
    day: 1,
    tips: 0,
    dayTips: 0,
    dayTimer: DAY_DURATION,
    customersServed: 0,
    customersTotal: getCustomersPerDay(1),
    stations: [createStation(0), createStation(1), createStation(2)],
    customers: [],
    servingFromStation: null,
    upgrades: ['faster_kettle', 'third_station', 'patience_boost', 'premium_cups']
  };
}

export function updateGame(state: GameState, dt: number): void {
  if (state.phase !== 'playing') return;

  // Update day timer
  state.dayTimer -= dt;

  // Update all stations
  for (const station of state.stations) {
    updateStation(station, dt);
  }

  // Update customers
  updateCustomers(state, dt);

  // Check for day end
  if (state.dayTimer <= 0 || state.customersServed >= state.customersTotal) {
    endDay(state);
  }
}

export function endDay(state: GameState): void {
  state.phase = 'shopping';
}

export function startNextDay(state: GameState): void {
  state.day++;
  state.phase = 'playing';
  state.dayTimer = DAY_DURATION;
  state.dayTips = 0;
  state.customersServed = 0;
  state.customersTotal = getCustomersPerDay(state.day);
  state.customers = [];
  state.servingFromStation = null;

  // Reset all stations
  for (const station of state.stations) {
    station.kettleState = 'empty';
    station.kettleTimer = 0;
    resetCup(station);
  }

  // Add third station if unlocked
  if (state.upgrades.includes('third_station') && state.stations.length < 3) {
    state.stations.push(createStation(2));
  }
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
