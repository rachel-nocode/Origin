# Origin

Sticky monorepo for Rachel NoCode weekly tech demos.

Each small library / idea demo lives under `demos/<kebab-slug>/`. Do not create a new GitHub repo per demo.

## Layout

- `demos/` — one self-contained demo app per folder
- `tracking/seen-bookmarks.json` — bookmarks already studied or shipped
- `skills/project-planning/` — how to plan a new demo before building
- `AGENTS.md` — rules for Cursor cloud agents

## Add a demo

1. Plan with `skills/project-planning/`
2. Create `demos/<kebab-slug>/` (self-contained: `bun install && bun run dev`)
3. Open one PR; attach at least one screenshot and one video of the running app when practical

## Weekly workflow

Study X bookmarks → ship similar demos that show the idea and stack → invent one original idea → ship the original via Coder on the cheapest cloud-agent model (prefer Composer 2.5).
