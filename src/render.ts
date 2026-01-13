import { GameState, Station, MAX_DAYS } from './types';
import { getKettleStatusText, getCupStatusText } from './station';
import { getOrderDisplayName, getMaxQueueSize, getMaxWrongOrders } from './customer';
import { UPGRADES, canAffordUpgrade } from './upgrades';

export function renderGame(state: GameState): void {
  renderHeader(state);
  renderCustomers(state);
  renderStations(state);

  // Show/hide pause screen
  const pause = document.getElementById('pause')!;
  if (state.phase === 'paused') {
    pause.classList.remove('hidden');
  } else {
    pause.classList.add('hidden');
  }

  // Show/hide shop
  const shop = document.getElementById('shop')!;
  if (state.phase === 'shopping') {
    if (shop.classList.contains('hidden')) {
      shop.classList.remove('hidden');
      renderShop(state);
    }
  } else {
    shop.classList.add('hidden');
  }

  // Show/hide game over screen
  const gameover = document.getElementById('gameover')!;
  if (state.phase === 'gameover') {
    if (gameover.classList.contains('hidden')) {
      gameover.classList.remove('hidden');
      document.getElementById('gameover-title')!.textContent = 'Terminated';
      document.getElementById('gameover-message')!.textContent =
        'Your services are no longer required. The Council has replaced you with a machine.';
    }
  } else {
    gameover.classList.add('hidden');
  }

  // Show/hide win screen
  const win = document.getElementById('win')!;
  if (state.phase === 'won') {
    if (win.classList.contains('hidden')) {
      win.classList.remove('hidden');
      document.getElementById('win-tips')!.textContent = String(state.tips);

      // Calculate average satisfaction
      const avgSatisfaction = state.satisfactionSamples > 0
        ? state.satisfactionSum / state.satisfactionSamples
        : 2;

      const titleEl = document.getElementById('win-title')!;
      const messageEl = document.getElementById('win-message')!;

      if (avgSatisfaction >= 3) {
        // High satisfaction - bad ending for humanity
        titleEl.textContent = 'Victory... But At What Cost?';
        messageEl.textContent =
          `Buoyed by your stellar brews, The Reform Party have triumphed in the election! Up the Ra! Prime minister Farage
          needs a personal brewmaster, and you're the one for the job!`;
      } else if (avgSatisfaction <= 2.5) {
        // Low satisfaction - good ending for humanity
        titleEl.textContent = '';
        messageEl.textContent =
          `Something was off this week, but no one can quite put a finger on what... Some people point to the peculiar tasting
          tea, but there aren't enough formal complaints to investigate further. Regardless, The Reform Party loses the upcoming 
          general election and slide back into obscurity. Farage moves to Russia to pursue a career in competitive bear wrestling.`;
      } else {
        // Medium satisfaction - neutral ending
        titleEl.textContent = 'Stalemate';
        messageEl.textContent =
          `Your tea service was... adequate. The Reform Party manage to get enough votes to form a coalition government.
          No one's happy. The future remains uncertain. At least you made some decent tips along the way.`;
      }
    }
  } else {
    win.classList.add('hidden');
  }
}

export function refreshShop(state: GameState): void {
  renderShop(state);
}

function renderHeader(state: GameState): void {
  document.getElementById('day-display')!.textContent = `Day ${state.day}/${MAX_DAYS}`;
  document.getElementById('tips-display')!.textContent = `Tips: $${state.tips}`;

  // Render satisfaction meter (5 bars from red to green)
  const satisfactionEl = document.getElementById('satisfaction-display');
  if (satisfactionEl) {
    let bars = '';
    for (let i = 0; i < 5; i++) {
      const filled = i <= state.satisfaction;
      bars += `<span class="satisfaction-bar bar-${i} ${filled ? 'filled' : ''}"></span>`;
    }
    satisfactionEl.innerHTML = '<span class="satisfaction-label">Mood:</span>' + bars;
  }

  // Show complaints as X icons
  const complaintsEl = document.getElementById('complaints-display');
  if (complaintsEl) {
    const maxComplaints = getMaxWrongOrders(state);
    const filled = '<span class="complaint filled">X</span>'.repeat(state.wrongOrdersToday);
    const empty = '<span class="complaint">X</span>'.repeat(maxComplaints - state.wrongOrdersToday);
    complaintsEl.innerHTML = '<span class="complaints-label">Complaints:</span>' + filled + empty;
  }
}

function renderCustomers(state: GameState): void {
  const slots = document.querySelectorAll('.customer-slot');
  const maxQueue = getMaxQueueSize(state.day);

  // Update sink active state
  const sink = document.getElementById('sink');
  if (sink) {
    if (state.servingFromStation !== null) {
      sink.classList.add('active');
    } else {
      sink.classList.remove('active');
    }
  }

  slots.forEach((slot, index) => {
    const customer = state.customers[index];
    const slotEl = slot as HTMLElement;

    // Check if slot is unavailable for this day
    if (index >= maxQueue) {
      slotEl.classList.add('unavailable');
      slotEl.classList.remove('occupied', 'serving-mode');
      slotEl.innerHTML = '<div class="slot-locked">?</div>';
      return;
    }

    slotEl.classList.remove('unavailable');

    if (customer) {
      slotEl.classList.add('occupied');
      if (state.servingFromStation !== null) {
        slotEl.classList.add('serving-mode');
      } else {
        slotEl.classList.remove('serving-mode');
      }

      const patiencePercent = (customer.patience / customer.maxPatience) * 100;
      const isLow = patiencePercent < 30;

      slotEl.innerHTML = `
        <div class="customer">
          <div class="customer-face"></div>
          <div class="customer-order">${getOrderDisplayName(customer.order)}</div>
        </div>
        <div class="customer-patience">
          <div class="patience-bar ${isLow ? 'low' : ''}" style="width: ${patiencePercent}%"></div>
        </div>
      `;
    } else {
      slotEl.classList.remove('occupied', 'serving-mode');
      slotEl.innerHTML = '';
    }
  });
}

function renderStations(state: GameState): void {
  const stationsEl = document.getElementById('stations')!;

  // Show/hide locked station 3 placeholder
  const lockedStation3 = document.getElementById('station-3-locked');
  if (lockedStation3) {
    if (state.upgrades.includes('third_station')) {
      lockedStation3.classList.add('hidden');
    } else {
      lockedStation3.classList.remove('hidden');
    }
  }

  // Remove third station if upgrade not owned (e.g., after restart)
  const existingStation3 = document.querySelector('[data-station="2"]');
  if (existingStation3 && !state.upgrades.includes('third_station')) {
    existingStation3.remove();
  }

  // Add third station HTML if needed
  if (state.upgrades.includes('third_station') && !document.querySelector('[data-station="2"]')) {
    const stationHtml = `
      <div class="station" data-station="2">
        <div class="station-label">Station 3</div>
        <div class="station-top">
          <div class="kettle" data-action="kettle">
            <div class="kettle-body"></div>
            <div class="kettle-status">Empty</div>
          </div>
          <div class="cup" data-action="cup">
            <div class="cup-body">
              <div class="cup-contents"></div>
              <div class="sugar-crystals"></div>
            </div>
            <div class="cup-status">Empty</div>
          </div>
        </div>
        <div class="station-bottom">
          <div class="teabags">
            <div class="teabag" data-tea="earl_grey" data-action="teabag">EG</div>
            <div class="teabag" data-tea="english" data-action="teabag">EB</div>
            <div class="teabag" data-tea="peppermint" data-action="teabag">PM</div>
            <div class="teabag" data-tea="chai" data-action="teabag">CH</div>
          </div>
          <div class="additions">
            <div class="addition" data-action="sugar">Sugar</div>
            <div class="addition" data-action="milk">Milk</div>
          </div>
        </div>
      </div>
    `;
    stationsEl.insertAdjacentHTML('beforeend', stationHtml);
  }

  state.stations.forEach((station, index) => {
    const stationEl = document.querySelector(`[data-station="${index}"]`);
    if (!stationEl) return;

    const isServing = state.servingFromStation === index;
    renderStation(station, stationEl as HTMLElement, isServing);
  });
}

function renderStation(station: Station, el: HTMLElement, isServing: boolean): void {
  // Update kettle
  const kettleEl = el.querySelector('.kettle')!;
  kettleEl.className = `kettle ${station.kettleState}`;
  el.querySelector('.kettle-status')!.textContent = getKettleStatusText(station);

  // Update cup
  const cupEl = el.querySelector('.cup')!;
  let cupClasses = 'cup';
  if (station.cupTeaType) {
    cupClasses += ` ${station.cupTeaType}`;
  }
  if (station.cupState === 'has_teabag') {
    cupClasses += ' has-teabag';
  }
  if (station.cupState === 'steeping' || station.cupState === 'ready') {
    cupClasses += ' has-tea';
  }
  if (station.cupState === 'steeping') {
    cupClasses += ' steeping';
  }
  if (station.hasMilk) {
    cupClasses += ' has-milk';
  }
  if (station.sugarCount > 0) {
    cupClasses += ' has-sugar';
  }
  if (station.cupState === 'ready') {
    cupClasses += ' ready';
  }
  if (isServing && (station.cupState === 'steeping' || station.cupState === 'ready')) {
    cupClasses += ' serving';
  }
  if (station.teabagChangeTimer > 0) {
    cupClasses += ' changing-teabag';
  }
  cupEl.className = cupClasses;
  el.querySelector('.cup-status')!.textContent = getCupStatusText(station);
}

const DAY_HINTS = [
  '"The Council seems pleased. Strange customers, though... their skin has an odd shimmer."',
  '"Overheard them discussing \'the invasion timeline\'. Must be some corporate jargon."',
  '"One of them slipped up and mentioned \'the human resistance\'. Probably a movie reference?"',
];

function renderShop(state: GameState): void {
  document.getElementById('shop-tips')!.textContent = `Tips: $${state.tips}`;

  // Show hint based on day
  const hintEl = document.getElementById('shop-hint');
  if (hintEl && state.day <= DAY_HINTS.length) {
    hintEl.textContent = DAY_HINTS[state.day - 1];
  }

  const upgradesEl = document.getElementById('upgrades')!;
  upgradesEl.innerHTML = '';

  for (const upgrade of UPGRADES) {
    const owned = state.upgrades.includes(upgrade.id);
    const canAfford = canAffordUpgrade(state, upgrade);

    const upgradeEl = document.createElement('div');
    upgradeEl.className = `upgrade ${owned ? 'owned' : ''} ${!canAfford && !owned ? 'locked' : ''}`;
    upgradeEl.dataset.upgradeId = upgrade.id;

    upgradeEl.innerHTML = `
      <div class="upgrade-name">${upgrade.name}</div>
      <div class="upgrade-desc">${upgrade.description}</div>
      <div class="upgrade-cost">${owned ? 'OWNED' : `$${upgrade.cost}`}</div>
    `;

    upgradesEl.appendChild(upgradeEl);
  }
}

export function showTipPopup(amount: number, x: number, y: number): void {
  const popup = document.createElement('div');
  popup.className = 'tip-popup';
  popup.textContent = amount > 0 ? `+$${amount}` : '$0';
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
  document.body.appendChild(popup);

  setTimeout(() => popup.remove(), 1000);
}
