# Dungeonmaster Web UI - Design Prototype

## What This Is

A standalone design prototype for iterating on the Dungeonmaster web UI. This is NOT the real app - it's a fast-reload
sandbox for mocking out screens, testing color schemes, and nailing down the visual design before touching the actual
`packages/web/` code.

The real app lives in `packages/web/` (React + Mantine + Vite) and `packages/server/` (Hono). This prototype mirrors
that stack (React + Mantine + Vite) so designs translate directly to implementation.

## How to Run

```bash
cd plan/design
npm install   # first time only
npx vite      # serves at http://localhost:4000
```

Edit any `.jsx` file, save, browser hot-reloads.

## Identity

Dungeonmaster is an AI quest orchestrator that uses RPG rhetoric throughout. The UI should feel like a dungeon raid
command center, not a SaaS dashboard.

Key terminology:

- **Guilds** = projects (codebases registered with Dungeonmaster)
- **Quests** = structured coding tasks with requirements, steps, contracts
- **Raids** = quest execution (agents running in parallel)
- **Agent roles** = ChaosWhisperer, PathSeeker, Codeweaver, Siegemaster, Lawbringer, Spiritmender

NEVER use the word "marketing". This is a dev tool.

## Visual Direction

- Dark backgrounds only. Three theme options available (toggle top-right dropdown):
    - **Catacombs** - cold stone purple, torchlit ancient dungeon
    - **Ember Depths** - warm volcanic orange, forge/molten
    - **Abyssal Keep** - deep ocean blue, bioluminescent
- Pixel art sprites via CSS box-shadow (no external assets needed)
- ASCII art for the logo
- Monospace font (`monospace`) for all UI text
- RPG-style status colors for quest states (gold for loot, purple for rare, etc.)

## Pixel Sprite System

Sprites are defined as arrays of `'x y #color'` strings and rendered via the `PixelSprite` component which converts them
to `box-shadow` CSS. No image files needed.

- Sprites live in `sprites/` folder
- Reusable component at `components/pixel-sprite.jsx`
- `scale` prop controls pixel size (default 4 = each pixel is 4x4 CSS pixels)
- `flip` prop mirrors horizontally
- `width`/`height` props define sprite dimensions for layout spacing

To add a new sprite: create a file in `sprites/`, export a pixel array, import in your page.

## Theme System

All colors flow through `themes.jsx` which provides React context.

```jsx
import {useTheme} from '../themes.jsx';

function MyComponent() {
    const {theme} = useTheme();
    return <div style={{color: theme.colors['primary']}}>Hello</div>;
}
```

Color keys: `bg-deep`, `bg-surface`, `bg-raised`, `border`, `text`, `text-dim`, `primary`, `success`, `warning`,
`danger`, `loot-gold`, `loot-rare`.

NEVER hardcode colors. Always use `theme.colors['key']`.

## File Structure

```
plan/design/
  README.md            # This file
  index.html           # Entry point
  main.jsx             # App shell, page nav, theme provider
  themes.jsx           # Theme definitions + React context
  vite.config.js       # Vite config (port 4000)
  package.json         # Standalone deps (react, mantine, vite)
  components/
    pixel-sprite.jsx   # Reusable box-shadow pixel sprite renderer
  sprites/
    fireball.jsx       # Fireball sprite data
  pages/
    landing.jsx        # Main app screen (logo + guild/quest map)
    color-scheme.jsx   # Color palette reference (Design tab)
```

## App Screen Flow (Current State)

### Landing Page (App tab)

1. **Logo** - ASCII block-letter DUNGEONMASTER with fireballs on each side
2. **Map frame** - bordered container with dynamic content:
    - **Default**: guild list (left) + quest list (right) with `+` buttons on each header
    - **No guilds**: create guild form (name + path), no cancel option
    - **New guild**: create guild form with cancel to go back
    - **Quest selected / New quest**: placeholder (next to design)
3. **Scenario buttons** (dimmed, design-only) to toggle between states

### Design Page (Design tab)

- Shows active theme's color palette with swatches
- Sample UI bar demonstrating status colors in context

## Screens Still Needed

- [ ] Quest detail view (requirements, steps, contracts, observables)
- [ ] Quest execution / raid dashboard (agent slots, phase stepper, terminal output)
- [ ] Quest creation form
- [ ] Directory browser for guild path selection

## Process for Designing New Screens

1. Create a new file in `pages/` (e.g., `quest-detail.jsx`)
2. Import `useTheme` and use `theme.colors` for all styling
3. Add the page to the `pages` array in `main.jsx`
4. Use scenario buttons or mock data to showcase different states
5. Iterate with user feedback via browser reload
6. Once approved, translate the design to the real app in `packages/web/`

## Requirements Beyond Mocks

Some requirements can't be captured in static prototypes (animations, transitions, real-time updates). These are tracked
in [`REQS.md`](./REQS.md). Add to that file whenever a design decision is made that the mock can't demonstrate.

## Rules

- Everything must be themed (use `useTheme()`, never hardcode colors)
- All text is monospace
- Pixel sprites for decorative art, not icons (Mantine handles icons)
- Icon buttons (e.g. `+`, `x`) use `PixelBtn` with `icon` prop: 15px font, 8px horizontal / 0 vertical padding. Never
  use raw unstyled icon buttons.
- Keep mock data realistic but minimal
- Scenario switchers go at the bottom of each page (dimmed) for toggling states
- Vertically + horizontally center the main content
- This prototype is disposable - it exists to inform the real app, not become it
