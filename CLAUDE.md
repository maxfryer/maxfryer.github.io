# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # TypeScript check + Vite production build → dist/
npm run preview  # Preview production build locally
```

## Architecture

Tea For Two is a browser-based tea shop simulation game built with TypeScript and Vite. No framework—pure DOM manipulation with a 60fps game loop.

### Game Loop Flow

`main.ts` initializes state and runs the loop:
1. `updateGame()` (game.ts) ticks all timers and state
2. `renderGame()` (render.ts) updates the DOM
3. Repeat at 60fps via requestAnimationFrame

### State Machine Pattern

The game uses explicit state machines for equipment:
- **KettleState**: `empty → filling → full → boiling → ready`
- **CupState**: `empty → has_teabag → steeping → ready`

All game state flows through `GameState` (types.ts) which is the single source of truth.

### Module Responsibilities

- **types.ts** - Type definitions (TeaType, Station, Customer, GameState, Upgrade)
- **recipes.ts** - Static tea recipe data (steep times, milk/sugar requirements)
- **station.ts** - Station state transitions (kettle/cup interactions, timers)
- **customer.ts** - Customer queue management, tip calculation, order validation
- **game.ts** - Game loop orchestration, day/phase transitions
- **upgrades.ts** - Upgrade definitions and purchase logic
- **render.ts** - DOM rendering (stations, customers, shop, header)
- **audio.ts** - Web Audio API sound synthesis
- **main.ts** - Entry point, event listeners, game loop runner

### Scoring System

Tips (0-5 per order) are calculated in `customer.ts:calculateTip()`:
- +2 correct tea type
- +1 correct steep time (±1s tolerance)
- +1 correct milk
- +1 correct sugar
- Mistakes subtract points
