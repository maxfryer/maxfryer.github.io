import { GameState, TeaType, UpgradeId } from './types';
import { createGameState, updateGame, startNextDay } from './game';
import { clickKettle, clickTeabag, clickSugar, clickMilk, resetCup } from './station';
import { serveCustomer } from './customer';
import { purchaseUpgrade } from './upgrades';
import { renderGame, showTipPopup } from './render';

let state: GameState;
let lastTime = 0;

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
  const shopEl = document.getElementById('shop')!;

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
        clickKettle(station, state);
        break;
      case 'teabag':
        const teaType = (action as HTMLElement).dataset.tea as TeaType;
        clickTeabag(station, teaType);
        break;
      case 'sugar':
        clickSugar(station);
        break;
      case 'milk':
        clickMilk(station);
        break;
      case 'cup':
        if (station.cupState === 'ready') {
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

    // Show tip popup
    const rect = slot.getBoundingClientRect();
    showTipPopup(tip, rect.left + rect.width / 2, rect.top);

    // Reset the cup after serving
    resetCup(state.stations[stationIndex]);
  });

  // Shop clicks
  shopEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // Next day button
    if (target.id === 'next-day-btn' || target.closest('#next-day-btn')) {
      startNextDay(state);
      return;
    }

    // Upgrade purchase
    const upgradeEl = target.closest('.upgrade') as HTMLElement;
    if (upgradeEl) {
      const isOwned = upgradeEl.classList.contains('owned');
      const isLocked = upgradeEl.classList.contains('locked');
      if (!isOwned && !isLocked) {
        const upgradeId = upgradeEl.dataset.upgradeId as UpgradeId;
        if (upgradeId) {
          purchaseUpgrade(state, upgradeId);
          renderGame(state);
        }
      }
    }
  });

  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      state.servingFromStation = null;
    }

    // Pause/unpause with P or Space (only during playing or paused)
    if (e.key === 'p' || e.key === 'P' || e.key === ' ') {
      e.preventDefault();
      if (state.phase === 'playing') {
        state.phase = 'paused';
      } else if (state.phase === 'paused') {
        state.phase = 'playing';
      }
    }
  });
}

function gameLoop(time: number): void {
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  if (state.phase === 'playing') {
    updateGame(state, dt);
  }

  renderGame(state);
  requestAnimationFrame(gameLoop);
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', init);
