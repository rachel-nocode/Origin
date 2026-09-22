---
name: project-planning
description: Use before building a new demo under demos/<slug>/. Write PLAN.md, then implement. Bookmarks are inspiration only — invent originals.
---

# Project planning (demo)

## Hard rule — inspiration only

Bookmarks and references are inspiration only. Never plan a one-to-one recreation or clone.

Study craft signals (idea, motion, art direction, tech), then invent a **new** demo idea that is:

- visually entertaining
- simple
- high quality
- built around satisfying motion where that fits

## Hard rule — no AI-slop aesthetics

Never plan or ship generic AI-slop visuals.

**Banned defaults:** neon UI, glowing cyberpunk chrome, purple-gradient-on-black palettes.

**Prefer instead:** tactile, intentional art direction — soft materials, print/paper, watercolor, toy, editorial, or other human-feeling palettes.

Call out the chosen art direction in `PLAN.md` before coding.

## Before coding

1. Name a kebab-case slug and path `demos/<slug>/`.
2. Write `demos/<slug>/PLAN.md` with:
   - Original idea (one paragraph) — must not be a recreation of a bookmark
   - Art direction (palette, materials, mood) — no AI-slop defaults; prefer tactile, human-feeling aesthetics
   - Craft inspiration notes (what you learned; optional bookmark URLs as inspiration only)
   - Tech stack
   - MVP scope (what ships in v1)
   - Out of scope
   - How to run (`bun install && bun run dev`)
   - Validation (screenshot + short video of the running app)
3. Keep the demo single-user MVP-sized.
4. Only then implement under `demos/<slug>/`.
