# Agent rules — Origin monorepo

You are working in the sticky weekly tech-demos monorepo.

## Hard rule — inspiration only, never copy

X / Twitter bookmarks and any outside references are **inspiration only**. They are never a template to copy.

Study what makes a bookmarked build work:

- the idea
- the motion
- the art direction
- the tech

Then invent something **truly original**. No one-to-one recreations. No clones of bookmarked games or apps.

Every demo, every week, must be a **new idea**: visually entertaining, simple, high quality, and built around satisfying motion where that fits.

## Hard rule — no AI-slop visuals

Never default to neon UI, glowing cyberpunk ribbons, or purple/cyan glow-on-black. Avoid generic “AI slop” aesthetics.

Prefer tactile, human-feeling art direction: matte materials, warm paper/linen surfaces, editorial typography, natural color palettes. Satisfying motion is required; neon glow is not.

## Other hard rules

- Only add or update files under `demos/<kebab-slug>/` for a given demo (plus `tracking/seen-bookmarks.json` when recording a pick).
- Never create a new GitHub repository.
- Prefer Bun. Each demo must be self-contained: from `demos/<slug>/`, `bun install && bun run dev` must work.
- Plan first using `skills/project-planning/`, then write `demos/<slug>/PLAN.md` before substantial code.
- Open one PR per demo. Attach at least one video of the running app when practical.
- REQUIRED: every demo must finish with at least one screenshot of the running app. Save it as `demos/<slug>/screenshot.png`, embed it in the PR body, and reference it in your final report. No demo is done without a screenshot.
- Do not touch unrelated demos.

## Naming

Use kebab-case slugs: `demos/cool-particle-ui/`.
