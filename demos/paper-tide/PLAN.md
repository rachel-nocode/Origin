# Paper Tide — PLAN

## Original idea

Paper Tide is a single-page canvas toy: a soft watercolor puddle on a tabletop. The player drags a finger or mouse to paint ripples into the water; a tiny folded paper boat drifts lazily across the surface, tipping and rocking with the waves. There is no score, no goal, no enemies — just the pleasure of watching gentle motion and making your own tide. The whole product is satisfying water physics and a calm, handcrafted visual style.

## Craft inspiration (not clones)

- **Surf Sandbox** — extreme simplicity, toybox feel, make-your-own motion, ok to just watch, no missions.
- **Map-game craft** — familiar everyday objects (paper, water, table) become a playground; locomotion feels physical and satisfying.
- **Shooter craft** — punchy responsive feedback on interaction (ripple impulse on drag), used lightly — not a shooter.
- Bookmark URLs studied as inspiration only:
  - https://x.com/heynavtoor/status/2102231506618106157
  - https://x.com/Lockie_Glizzy/status/2102276900945367227
  - https://x.com/byteab/status/2102342044505239741

## Tech stack

- Bun (package manager + dev runner)
- Vite (bundler / dev server)
- TypeScript
- HTML5 Canvas 2D
- Custom 2D wave-height simulation (ripple tank / damped wave equation on a grid)

## MVP scope (v1)

- Full-screen canvas with watercolor tabletop + puddle aesthetic
- 2D height-field water simulation with damped wave propagation
- Pointer drag injects ripple impulses along the stroke path
- One folded paper boat entity: drifts with gentle current, tips/rocks from local wave slope
- Subtle ambient ripples so the scene never feels dead
- Soft vignette, grain, and color grading for handcrafted look
- Minimal UI hint: "drag the water"

## Out of scope

- Multiplayer, scores, levels, missions
- Sound
- Mobile haptics
- Multiple boats or objects
- 3D rendering
- Saving/sharing state

## How to run

```bash
cd demos/paper-tide
bun install
bun run dev
```

## Validation

- Screenshot of the running puddle + boat
- Short screen recording showing drag ripples and boat tipping
