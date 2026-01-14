# CLAUDE.md

## Commands

```bash
npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # TypeScript check + production build → dist/
npm run preview  # Preview production build
```

## Architecture

Tea For Two is a browser game built with TypeScript and Vite. No framework - pure DOM manipulation with a 60fps requestAnimationFrame loop.

### Game Loop

`main.ts` runs the loop:
1. `updateGame()` ticks timers, spawns customers, checks win/lose
2. `renderGame()` updates DOM to match state
3. Repeat at 60fps

### State Machines

Equipment uses explicit state transitions:
- **KettleState**: `empty → filling → full → boiling → ready`
- **CupState**: `empty → has_teabag → steeping → ready`

### Module Overview

| Module | Purpose |
|--------|---------|
| `types.ts` | Type definitions (TeaType, Station, Customer, GameState) |
| `recipes.ts` | Tea recipe data (steep times, milk/sugar requirements) |
| `station.ts` | Station logic (kettle clicks, teabag handling, timers) |
| `customer.ts` | Queue management, tip calculation, difficulty scaling |
| `game.ts` | Game loop, day transitions, state initialization |
| `upgrades.ts` | Upgrade definitions and purchase logic |
| `render.ts` | All DOM rendering (stations, customers, shop, overlays) |
| `audio.ts` | Web Audio API synthesized 8-bit sounds |
| `main.ts` | Entry point, event listeners, game loop runner |

### Key Mechanics

**Tip Calculation** (`customer.ts:calculateTip`):
- Base +2 for correct tea type
- +1/-1 for steep time (within 1s tolerance)
- +1/-1 for milk correctness
- +1/-1 for sugar (required/forbidden teas only)
- Clamped to 0-5 range

**Satisfaction System**:
- Tracks per-order satisfaction (affects Reform mood meter)
- Averages over all orders for ending calculation
- High avg = bad ending, low avg = good ending

**Difficulty Scaling** (`customer.ts`):
- Customers per day: 6 + (day-1) * 3
- Queue slots: min(5, 2 + day)
- Base patience: max(18, 40 - (day-1) * 8)
- Spawn interval: max(3, 5 - (day-1) * 0.7)

**Mood System**:
- Wrong tea type or customer timeout = -2 mood
- Mood < 1 = game over
- Baseline mood: 5 (7 with upgrade) allows 2 mistakes per day (3 with upgrade)
- At day start: mood resets to baseline if below, keeps gains if above

### Rendering Notes

- Third station DOM is dynamically added/removed based on upgrade ownership
- Recipe card placeholder occupies station 3 slot until unlocked
- Customer slots show as locked (?) when unavailable for current day
