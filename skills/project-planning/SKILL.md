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

## Before coding

1. Name a kebab-case slug and path `demos/<slug>/`.
2. Write `demos/<slug>/PLAN.md` with:
   - Original idea (one paragraph) — must not be a recreation of a bookmark
   - Craft inspiration notes (what you learned; optional bookmark URLs as inspiration only)
   - Tech stack
   - MVP scope (what ships in v1)
   - Out of scope
   - How to run (`bun install && bun run dev`)
   - Validation (REQUIRED screenshot saved to `demos/<slug>/screenshot.png` and embedded in the PR, plus a short video when practical)
3. Keep the demo single-user MVP-sized.
4. Only then implement under `demos/<slug>/`.
