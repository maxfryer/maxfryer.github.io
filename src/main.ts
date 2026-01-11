import { GameState, TeaType, UpgradeId } from './types';
import { createGameState, updateGame, startNextDay } from './game';
import { clickKettle, clickTeabag, clickSugar, clickMilk, resetCup } from './station';
import { serveCustomer } from './customer';
import { UPGRADES } from './upgrades';
import { renderGame, showTipPopup, refreshShop } from './render';
import * as audio from './audio';

let state: GameState;
let lastTime = 0;
let showRestartConfirm = false;

// Track previous states for sound triggers
let prevKettleStates: string[] = [];
let prevCupStates: string[] = [];
let prevCustomerCount = 0;
let prevPhase: string = 'playing';

function init(): void {
  state = createGameState();

  // Set up event listeners
  setupEventListeners();

  // Start game loop
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function setupEventListeners(): void {
  const stationsEl = document.getElementById('stations')!;
  const customersEl = document.getElementById('customer-queue')!;

  // Station clicks
  stationsEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const stationEl = target.closest('.station') as HTMLElement;
    if (!stationEl) return;

    const stationIndex = parseInt(stationEl.dataset.station || '0');
    const station = state.stations[stationIndex];
    if (!station) return;

    const action = target.closest('[data-action]') as HTMLElement;
    if (!action) return;

    const actionType = action.dataset.action;

    switch (actionType) {
      case 'kettle':
        const prevKettleState = station.kettleState;
        clickKettle(station, state);
        // Play sound based on new state
        if (prevKettleState === 'empty' && station.kettleState === 'filling') {
          audio.playKettleFill();
        } else if (prevKettleState === 'full' && station.kettleState === 'boiling') {
          audio.playKettleBoil();
        } else if (prevKettleState === 'ready' && station.cupState === 'steeping') {
          audio.playPourWater();
        }
        break;
      case 'teabag':
        const teaType = (action as HTMLElement).dataset.tea as TeaType;
        if (station.cupState === 'empty') {
          audio.playAddTeabag();
        }
        clickTeabag(station, teaType);
        break;
      case 'sugar':
        if (station.cupState === 'steeping' || station.cupState === 'ready') {
          audio.playAddSugar();
        }
        clickSugar(station);
        break;
      case 'milk':
        if ((station.cupState === 'steeping' || station.cupState === 'ready') && !station.hasMilk) {
          audio.playAddMilk();
        }
        clickMilk(station);
        break;
      case 'cup':
        if (station.cupState === 'ready') {
          audio.playClick();
          if (state.servingFromStation === stationIndex) {
            // Cancel serving mode
            state.servingFromStation = null;
          } else {
            // Cancel any other station's serving mode and start this one
            state.servingFromStation = stationIndex;
          }
        }
        break;
    }
  });

  // Customer clicks (for serving)
  customersEl.addEventListener('click', (e) => {
    if (state.servingFromStation === null) return;

    const slot = (e.target as HTMLElement).closest('.customer-slot') as HTMLElement;
    if (!slot) return;

    const slotIndex = parseInt(slot.dataset.slot || '0');

    // Check if there's actually a customer at this slot
    if (!state.customers[slotIndex]) return;

    const stationIndex = state.servingFromStation;
    const tip = serveCustomer(state, slotIndex);

    // Play serve sound based on tip
    audio.playServeTea(tip);

    // Show tip popup
    const rect = slot.getBoundingClientRect();
    showTipPopup(tip, rect.left + rect.width / 2, rect.top);

    // Reset the cup after serving
    resetCup(state.stations[stationIndex]);
  });

  // Next day button
  document.getElementById('next-day-btn')!.addEventListener('click', () => {
    audio.playClick();
    startNextDay(state);
    prevCustomerCount = 0;
  });

  // Upgrade purchases - use document level to ensure it works
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // Check if click is inside upgrades area
    if (!target.closest('#upgrades')) return;

    const upgradeEl = target.closest('.upgrade') as HTMLElement;
    if (!upgradeEl) return;

    // Don't allow purchasing owned or locked upgrades
    if (upgradeEl.classList.contains('owned') || upgradeEl.classList.contains('locked')) return;

    const upgradeId = upgradeEl.dataset.upgradeId as UpgradeId;
    if (upgradeId) {
      const upgrade = UPGRADES.find(u => u.id === upgradeId);
      if (upgrade && state.tips >= upgrade.cost) {
        state.tips -= upgrade.cost;
        state.upgrades.push(upgradeId);
        audio.playUpgradeBuy();
        refreshShop(state);
      }
    }
  });

  // Restart confirmation handlers
  const restartConfirm = document.getElementById('restart-confirm')!;
  document.getElementById('restart-yes')!.addEventListener('click', confirmRestart);
  document.getElementById('restart-no')!.addEventListener('click', cancelRestart);

  function showRestart(): void {
    showRestartConfirm = true;
    restartConfirm.classList.remove('hidden');
  }

  function cancelRestart(): void {
    showRestartConfirm = false;
    restartConfirm.classList.add('hidden');
  }

  function confirmRestart(): void {
    showRestartConfirm = false;
    restartConfirm.classList.add('hidden');
    state = createGameState();
    // Reset audio state trackers
    prevKettleStates = [];
    prevCupStates = [];
    prevCustomerCount = 0;
    prevPhase = 'playing';
  }

  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    // Handle restart confirmation first
    if (showRestartConfirm) {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelRestart();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        confirmRestart();
      }
      return;
    }

    if (e.key === 'Escape') {
      state.servingFromStation = null;
    }

    // Pause/unpause with P or Space (only during playing or paused)
    if (e.key === 'p' || e.key === 'P' || e.key === ' ') {
      e.preventDefault();
      if (state.phase === 'playing') {
        state.phase = 'paused';
        audio.playPause();
      } else if (state.phase === 'paused') {
        state.phase = 'playing';
        audio.playUnpause();
      }
    }

    // Restart with R (not during shop)
    if ((e.key === 'r' || e.key === 'R') && state.phase !== 'shopping') {
      e.preventDefault();
      showRestart();
    }
  });
}

function gameLoop(time: number): void {
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  if (state.phase === 'playing') {
    // Store previous states before update
    const prevCustomerIds = state.customers.map(c => c.id);

    updateGame(state, dt);

    // Check for kettle ready sounds
    state.stations.forEach((station, i) => {
      if (prevKettleStates[i] === 'boiling' && station.kettleState === 'ready') {
        audio.playKettleReady();
      }
      if (prevCupStates[i] === 'steeping' && station.cupState === 'ready') {
        audio.playSteepComplete();
      }
      prevKettleStates[i] = station.kettleState;
      prevCupStates[i] = station.cupState;
    });

    // Check for customer arrivals
    if (state.customers.length > prevCustomerCount) {
      audio.playCustomerArrive();
    }

    // Check for customer departures (patience ran out)
    const currentIds = state.customers.map(c => c.id);
    const leftCustomers = prevCustomerIds.filter(id => !currentIds.includes(id));
    if (leftCustomers.length > 0 && state.phase === 'playing') {
      // Only play if they left due to patience (not serving)
      audio.playCustomerLeave();
    }

    prevCustomerCount = state.customers.length;
  }

  // Check for phase changes
  if (prevPhase === 'playing' && state.phase === 'shopping') {
    audio.playDayEnd();
  }
  prevPhase = state.phase;

  renderGame(state);
  requestAnimationFrame(gameLoop);
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', init);
