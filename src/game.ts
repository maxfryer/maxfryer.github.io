import { GameState, MAX_DAYS } from './types';
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
    satisfaction: 2, // Start in the middle (0-4 scale)
    customersServed: 0,
    customersTotal: getCustomersPerDay(1),
    wrongOrdersToday: 0,
    stations: [createStation(0), createStation(1)],
    customers: [],
    servingFromStation: null,
    upgrades: []
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
  // Skip shopping on final day - go straight to win
  if (state.day >= MAX_DAYS) {
    state.phase = 'won';
  } else {
    state.phase = 'shopping';
  }
}

export function startNextDay(state: GameState): void {
  // Check if player has won after completing all days
  if (state.day >= MAX_DAYS) {
    state.phase = 'won';
    return;
  }

  state.day++;
  state.phase = 'playing';
  state.dayTimer = DAY_DURATION;
  state.dayTips = 0;
  state.customersServed = 0;
  state.customersTotal = getCustomersPerDay(state.day);
  state.wrongOrdersToday = 0;
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
