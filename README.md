# Tea For Two

A web-based tea-making simulator where you run a tea stand, complete customer orders, and earn tips.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Deployment

### Local Development
Run `npm run dev` and open http://localhost:5173

### Production Build
1. Run `npm run build` - outputs to `dist/` folder
2. Deploy the `dist/` folder to any static hosting service:
   - **Netlify**: Drag and drop `dist/` folder
   - **Vercel**: `vercel --prod`
   - **GitHub Pages**: Copy `dist/` contents to your gh-pages branch
   - **Any web server**: Serve the `dist/` folder as static files

## Controls

| Key | Action |
|-----|--------|
| Click | Interact with stations, serve customers |
| Space / P | Pause/unpause |
| R | Restart game |
| Escape | Cancel serving mode |

## Game Rules

### Tea Recipes
| Tea | Steep Time | Milk | Sugar |
|-----|------------|------|-------|
| Earl Grey (EG) | 3s | No | Optional |
| English Breakfast (EB) | 4s | Yes | Optional |
| Peppermint (PM) | 2s | No | No |
| Chai (CH) | 5s | Yes | Required |

### Scoring (0-5 tips per order)
- +2 base for correct tea type
- +1 correct steep time (within 1s)
- +1 correct milk
- +1 correct sugar
- Mistakes subtract points

## Module Overview

### `src/types.ts`
TypeScript type definitions for the entire game:
- `TeaType` - The four tea varieties
- `KettleState` / `CupState` - State machines for station equipment
- `Station` - All state for a single tea-making station
- `Customer` - Customer order and patience data
- `GameState` - Complete game state
- `Upgrade` - Upgrade shop items

### `src/recipes.ts`
Tea recipe data - steep times, milk/sugar requirements for each tea type.

### `src/station.ts`
Tea station logic:
- `createStation()` - Initialize a new station
- `clickKettle()` - Handle kettle interactions (fill, boil, pour)
- `clickTeabag()` / `clickSugar()` / `clickMilk()` - Add ingredients
- `updateStation()` - Tick timers (boiling, steeping)
- `resetCup()` - Clear cup after serving

### `src/customer.ts`
Customer queue system:
- `createCustomer()` - Spawn customer with random order
- `updateCustomers()` - Tick patience timers, spawn new customers
- `calculateTip()` - Score tea quality against recipe
- `serveCustomer()` - Complete transaction, award tips

### `src/game.ts`
Core game loop and state:
- `createGameState()` - Initialize new game
- `updateGame()` - Main update tick (stations, customers, day timer)
- `startNextDay()` - Reset for next day, apply difficulty scaling
- `endDay()` - Transition to shop phase

### `src/upgrades.ts`
Upgrade shop system:
- `UPGRADES` - Available upgrades with costs and effects
- `canAffordUpgrade()` - Check if player can buy
- `purchaseUpgrade()` - Deduct tips and apply upgrade

### `src/render.ts`
DOM rendering:
- `renderGame()` - Main render function called each frame
- `renderHeader()` - Day, tips, timer display
- `renderCustomers()` - Customer queue with patience bars
- `renderStations()` - Station equipment states
- `renderShop()` - End-of-day upgrade shop

### `src/audio.ts`
Synthesized 8-bit sound effects using Web Audio API:
- Kettle sounds (fill, boil, ready)
- Tea preparation (pour, teabag, steep complete)
- Customer events (arrive, leave, serve)
- UI sounds (click, pause, upgrade)

### `src/main.ts`
Entry point and event handling:
- Initializes game state
- Sets up all click/keyboard event listeners
- Runs the game loop (update + render at 60fps)
- Handles pause, restart, serving flow

### `style.css`
All styling with pixel art aesthetic:
- CSS variables for color palette
- Station and equipment styling
- Customer queue layout
- Shop overlay
- Animations (boiling, steeping, patience bars)

### `index.html`
HTML shell with:
- Game container structure
- Station templates
- Customer queue slots
- Pause screen with instructions
- Shop overlay
