# Silk Knot — PLAN

## Original idea

Silk Knot is a browser motion toy: you draw a silk thread with your pointer, and it settles into soft, springy loops on warm linen paper. Click or tap any segment to pluck it like a harp string — each pluck sends a gentle dye-color ripple through the knot with juicy easing. No score, no missions. Just draw, pluck, and watch satisfying motion. You can also leave it idle and watch the thread breathe.

## Craft inspiration notes

- **Simplest games win** — one mechanic (draw + pluck), no UI chrome beyond a hint.
- **Make-your-own motion** — the player sculpts the thread; physics does the rest.
- **Satisfying motion you can watch** — spring settling, ripple propagation, soft material response.
- **Familiar object as playground** — silk thread on paper is tactile and intuitive.
- **Punchy responsive feel** — plucks have immediate visual + motion feedback, not a shooter.
- **Tactile art direction** — matte waxed cotton / silk on warm linen. No neon, no glow, no cyberpunk.

Bookmarks studied for craft only (not cloned): general motion-toy and sandbox-playground patterns.

## Tech stack

- **Bun** — package manager and dev server runner
- **Vite** — fast dev server and bundling
- **TypeScript** — type-safe physics and rendering
- **Canvas 2D** — matte thread strokes on warm paper with procedural grain
- **Verlet + spring constraints** — soft loop settling

## MVP scope (v1)

- Full-screen warm linen canvas with editorial aesthetic
- Pointer draw: thread follows cursor, spawns spring-linked points
- Physics: verlet integration, distance constraints, light damping
- Auto-close loop when draw ends near start point
- Pluck: click/tap near segment → impulse + warm dye ripple wave
- Ripple: ochre/rose/sage tint propagates along thread with eased falloff
- Idle hint text fades after first interaction
- Clear button (keyboard C or double-tap) to reset
- Responsive: mouse + touch

## Out of scope

- Sound / Web Audio
- Multiplayer or persistence
- Score, levels, missions
- 3D or WebGL
- Neon glow or cyberpunk aesthetics
- Mobile app wrapper

## How to run

```bash
cd demos/silk-knot
bun install
bun run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

## Validation

- Screenshot: thread drawn on warm paper with dye ripple visible
- Short video: draw a loop → pluck segment → watch ripple + spring motion
