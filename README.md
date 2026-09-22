# Origin

Sticky monorepo for Rachel NoCode weekly tech demos.

Each small demo lives under `demos/<kebab-slug>/`. Do not create a new GitHub repo per demo.

## Hard rule

Bookmarks are **inspiration only**. Study idea, motion, art direction, and tech — then invent something original. No one-to-one recreations. Every demo must be a new idea: visually entertaining, simple, high quality, satisfying motion where it fits.

## Layout

- `demos/` — one self-contained demo app per folder
- `tracking/seen-bookmarks.json` — bookmarks already studied or shipped
- `skills/project-planning/` — how to plan a new demo before building
- `AGENTS.md` — rules for Cursor cloud agents

## Add a demo

1. Plan with `skills/project-planning/` (original idea only)
2. Create `demos/<kebab-slug>/` (self-contained: `bun install && bun run dev`)
3. Open one PR; attach at least one screenshot and one video of the running app when practical

## Weekly workflow

Study X bookmarks for craft → invent original demos → invent one standout original → ship via Coder on the cheapest cloud-agent model (prefer Composer 2.5).
