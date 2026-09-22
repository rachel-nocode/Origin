---
name: project-planning
description: Use before building a new demo under demos/<slug>/. Write PLAN.md, then implement.
---

# Project planning (demo)

Before coding a new demo in this monorepo:

1. Name a kebab-case slug and path `demos/<slug>/`.
2. Write `demos/<slug>/PLAN.md` with:
   - Idea (one paragraph)
   - Source inspiration (bookmark URL if any)
   - Tech stack
   - MVP scope (what ships in v1)
   - Out of scope
   - How to run (`bun install && bun run dev`)
   - Validation (screenshot + short video of the running app)
3. Keep the demo single-user MVP-sized.
4. Only then implement under `demos/<slug>/`.
