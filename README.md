<div align="center">
<img width="1200" height="475" alt="Neon Horde banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Neon Horde - Synthwave Run
</div>

3D endless runner with a synthwave look. You run forward leading a crowd of characters. Gates ahead either grow or shrink the crowd. At the end of each segment a boss is waiting, and the size of your crowd decides whether you win.

## Controls

- Mobile: swipe left/right or tap the sides of the screen
- Desktop: arrow keys or A and D

The game decides portrait or landscape based on the screen, but you can force a mode from the menu.

## Tech stack

| Part | Built with |
|---|---|
| 3D rendering | Three.js |
| UI | React 18, TypeScript, Tailwind, Lucide icons |
| Tooling | Vite |
| Origin | Initial scaffold from Google AI Studio with Gemini integration |

## Run it

You need Node 18+ and a Gemini API key (only if you want to keep the AI Studio integration; the game itself runs without it).

```bash
git clone https://github.com/sucreistaken/RetrowaveRunnerGame.git
cd RetrowaveRunnerGame
npm install

# Optional Gemini key
echo "GEMINI_API_KEY=your-key-here" > .env.local

npm run dev
# Open http://localhost:5173
```

## Project layout

```
App.tsx               Game phases (menu, in-game, game over) and UI shell
components/
  GameCanvas.tsx      Three.js scene and game loop
  Game3DWrapper.tsx   React wrapper around the canvas
  Landscape.tsx       Synthwave horizon and grid background
constants.ts          Tunables: track width, player speed, gate spacing, boss distance
types.ts              GamePhase, Boss, shared types
```

## Roadmap

- Power-ups (slow motion, shield, double multiplier)
- Daily-seed run for a fair leaderboard
- Synthwave audio track
- PWA install prompt for mobile

## Origin

Started as an AI Studio scaffold ([open original](https://ai.studio/apps/drive/1iQvLNFVdQGUSykn20jUrXyuFuhjHKzkc)), then taken offline and turned into a proper project.
