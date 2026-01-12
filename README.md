# Tea For Two

A browser-based tea shop simulation where you serve tea to Reform overlords. Your tea quality secretly determines humanity's fate.

## Quick Start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # Production build → dist/
```

## How to Play

1. **Fill kettle** - Click empty kettle to fill (1s), click again to boil (4s)
2. **Add teabag** - Click a teabag (EG/EB/PM/CH) to put in cup
3. **Pour water** - Click boiling kettle to pour into cup, starts steeping
4. **Add extras** - Add milk/sugar while steeping if recipe needs it
5. **Serve** - Click cup to pick up, then click a customer to serve
6. **Discard** - Click sink while holding tea to throw it away

## Tea Recipes

| Tea | Code | Steep Time | Milk | Sugar |
|-----|------|------------|------|-------|
| Earl Grey | EG | 3s | No | Optional |
| English Breakfast | EB | 4s | Yes | Optional |
| Peppermint | PM | 2s | No | **None** |
| Chai | CH | 5s | Yes | Required |

## Scoring

Tips range from $0-5 per order:
- +2 base for correct tea type
- +1 correct steep time (within 1s tolerance)
- +1 correct milk
- +1 correct sugar (if required/forbidden)
- Mistakes subtract points

## Game Mechanics

### Complaints
- Wrong tea type or customer leaving = complaint
- 2 complaints = fired (game over)
- "Relationship Building" upgrade gives +1 tolerance

### Satisfaction Meter
- Perfect tea ($5 tip) increases Reform satisfaction
- Bad tea ($0-1 tip) decreases it
- Average satisfaction over 4 days determines ending

### Endings
???

### Difficulty Scaling
| Day | Customers | Queue Slots | Base Patience |
|-----|-----------|-------------|---------------|
| 1 | 6 | 3 | 40s |
| 2 | 9 | 4 | 32s |
| 3 | 12 | 5 | 25s |
| 4 | 15 | 5 | 18s |

## Controls

| Key | Action |
|-----|--------|
| Space / P | Pause/resume |
| Escape | Cancel serving / Pause |
| R | Restart game |
| Click | All interactions |

## Upgrades

| Upgrade | Cost | Effect |
|---------|------|--------|
| Faster Kettle | $10 | Boil time 4s → 3s |
| Comfy Chairs | $15 | +20% customer patience |
| Relationship Building | $15 | +1 complaint tolerance |
| Premium Cups | $20 | +1 tip per order |
| Third Station | $25 | Unlocks station 3 |

## Deployment

Build with `npm run build`, then deploy the `dist/` folder to any static host:
- **Netlify/Vercel**: Drag and drop or CLI deploy
- **GitHub Pages**: Copy dist contents to gh-pages branch
- **Any server**: Serve as static files
