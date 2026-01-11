import { Station, TeaType, GameState } from './types';
import { RECIPES } from './recipes';

export function createStation(id: number): Station {
  return {
    id,
    kettleState: 'empty',
    kettleTimer: 0,
    cupState: 'empty',
    cupTeaType: null,
    steepTimer: 0,
    steepTarget: 0,
    hasMilk: false,
    sugarCount: 0
  };
}

export function getBoilTime(state: GameState): number {
  return state.upgrades.includes('faster_kettle') ? 3 : 4;
}

export function clickKettle(station: Station, state: GameState): void {
  switch (station.kettleState) {
    case 'empty':
      station.kettleState = 'filling';
      station.kettleTimer = 1;
      break;
    case 'full':
      station.kettleState = 'boiling';
      station.kettleTimer = getBoilTime(state);
      break;
    case 'ready':
      if (station.cupState === 'has_teabag' && station.cupTeaType) {
        station.kettleState = 'empty';
        station.cupState = 'steeping';
        station.steepTimer = 0;
        station.steepTarget = RECIPES[station.cupTeaType].steepTime;
      }
      break;
  }
}

export function clickTeabag(station: Station, teaType: TeaType): void {
  if (station.cupState === 'empty') {
    station.cupState = 'has_teabag';
    station.cupTeaType = teaType;
  }
}

export function clickSugar(station: Station): void {
  if (station.cupState === 'steeping' || station.cupState === 'ready') {
    station.sugarCount++;
  }
}

export function clickMilk(station: Station): void {
  if ((station.cupState === 'steeping' || station.cupState === 'ready') && !station.hasMilk) {
    station.hasMilk = true;
  }
}

export function clickCup(station: Station, state: GameState): boolean {
  if (station.cupState === 'ready') {
    state.servingFromStation = station.id;
    return true;
  }
  return false;
}

export function updateStation(station: Station, dt: number): void {
  // Update kettle timer
  if (station.kettleState === 'filling' || station.kettleState === 'boiling') {
    station.kettleTimer -= dt;
    if (station.kettleTimer <= 0) {
      station.kettleTimer = 0;
      if (station.kettleState === 'filling') {
        station.kettleState = 'full';
      } else if (station.kettleState === 'boiling') {
        station.kettleState = 'ready';
      }
    }
  }

  // Update steep timer
  if (station.cupState === 'steeping') {
    station.steepTimer += dt;
    if (station.steepTimer >= station.steepTarget) {
      station.cupState = 'ready';
    }
  }
}

export function resetCup(station: Station): void {
  station.cupState = 'empty';
  station.cupTeaType = null;
  station.steepTimer = 0;
  station.steepTarget = 0;
  station.hasMilk = false;
  station.sugarCount = 0;
}

export function getKettleStatusText(station: Station): string {
  switch (station.kettleState) {
    case 'empty': return 'Empty';
    case 'filling': return `Filling...`;
    case 'full': return 'Full';
    case 'boiling': return `Boiling ${station.kettleTimer.toFixed(1)}s`;
    case 'ready': return 'Ready!';
  }
}

export function getCupStatusText(station: Station): string {
  switch (station.cupState) {
    case 'empty': return 'Empty';
    case 'has_teabag': return 'Add water';
    case 'steeping': return `Steeping ${station.steepTimer.toFixed(1)}s`;
    case 'ready': return 'Ready!';
  }
}
