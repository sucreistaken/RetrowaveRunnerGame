<div align="center">
<img width="1200" height="475" alt="Neon Horde banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Neon Horde — Synthwave Run

**3D endless runner with a synthwave/retrowave aesthetic. Recruit a horde, dodge gates, run down bosses.**
</div>

---

## Gameplay

You run forward, your crowd grows or shrinks depending on which gate you pick:

| Gate | Effect |
|---|---|
| Multiplier gate | Boost crowd size |
| Subtractor gate | Burns runners |
| Boss zone | Crowd vs. boss; size matters |

Steer left/right between lanes, hit the right gates, survive the boss at the end of each segment, score climbs.

**Controls** Touch (left/right swipe or tap) on mobile, Arrow keys / A-D on desktop.

**Modes** Auto-orientation; manual portrait or landscape lock available from the menu.

## Tech Stack

| Layer | Stack |
|---|---|
| Renderer | Three.js (3D canvas) |
| UI | React 18 + TypeScript, Tailwind for menus / HUD, Lucide icons |
| Tooling | Vite |
| AI integration | Built with Google AI Studio + Gemini (initial scaffold from AI Studio) |

## Quick start

Requirements: Node 18+, a Gemini API key (if you want to keep the AI Studio integration).

```bash
git clone https://github.com/sucreistaken/RetrowaveRunnerGame.git
cd RetrowaveRunnerGame
npm install

# Set Gemini key in .env.local
echo "GEMINI_API_KEY=your-key-here" > .env.local

npm run dev
# → http://localhost:5173
```

## Project structure

```
App.tsx               Game phase + UI shell (menu, in-game HUD, game-over)
components/
  GameCanvas.tsx      Three.js scene + game loop
  Game3DWrapper.tsx   R3F/Three wrapper
  Landscape.tsx       Synthwave horizon / grid background
constants.ts          Tunables: track width, player speed, gate spacing, boss distance
types.ts              GamePhase, Boss, shared types
```

## Roadmap

- Power-ups (slow-mo, shield, double-multiplier)
- Daily-seed run for leaderboard fairness
- Web Audio synthwave score
- Mobile-first install prompt (PWA wrapper)

## Origin

Started as an AI Studio scaffold ([open original](https://ai.studio/apps/drive/1iQvLNFVdQGUSykn20jUrXyuFuhjHKzkc)), then taken offline and grown into a proper game project.
