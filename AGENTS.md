# Agent rules — Origin monorepo

You are working in the sticky weekly tech-demos monorepo.

## Hard rules

- Only add or update files under `demos/<kebab-slug>/` for a given demo (plus `tracking/seen-bookmarks.json` when recording a pick).
- Never create a new GitHub repository.
- Prefer Bun. Each demo must be self-contained: from `demos/<slug>/`, `bun install && bun run dev` must work.
- Plan first using `skills/project-planning/`, then write `demos/<slug>/PLAN.md` before substantial code.
- Open one PR per demo. Attach both at least one screenshot AND at least one video of the running app in the PR when practical.
- Do not touch unrelated demos.

## Naming

Use kebab-case slugs: `demos/cool-particle-ui/`.
