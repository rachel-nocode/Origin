# Wax Seal — PLAN

## Original idea

Wax Seal is a single-screen browser desk toy on a warm oak writing table. A tilted stick of deep burgundy sealing wax hangs over cream cotton parchment. The player clicks or drags to drip molten wax onto the paper, watching it pool and cool into a soft organic puddle. When enough wax has gathered, they drag a heavy matte-brass seal into place and press down — on lift, the wax reveals a crisp embossed mark: an original botanical monogram (stylized oak leaf + acorn cupule, invented for this demo). A brief crackle animation plays as the wax sets, then the player can clear the desk and begin again. No score, no missions — just the tactile loop of drip → press → reveal → reset.

## Craft inspiration (not clones)

Studied bookmark craft signals as inspiration only — material process as product, soft editorial frames, code-driven motion, satisfying physical feedback:

- Cream paper + brush-stroke frames → warm parchment with fiber grain, not flat white UI
- Shape→UI motion on light canvas → wax blob growth and seal compression as the primary motion language
- Warm paper editorial UI → letterpress/stationery art direction, quiet lighting
- Soft beige marketing frames → oak desk vignette, matte brass (no chrome glow)
- Hand-drawn crayon materials → organic wax edges, imperfect pool silhouette

Bookmark URLs studied as inspiration only:

- https://x.com/shfred0/status/2102495989194236158
- https://x.com/twoclipping/status/2103273003555402193
- https://x.com/anshuc/status/2104262648519156094
- https://x.com/ParthJadhav8/status/2103773920797335779
- https://x.com/cherry_mx_reds/status/2102449525944099320
- https://x.com/callmidavid/status/2104288530159833161
- https://x.com/diegocabezas01/status/2104277642665132539
- https://x.com/Rubzem/status/2104253584737230926
- https://x.com/protoduct_ai/status/2104043397929726035
- https://x.com/temkosoft/status/2104192308753363442
- https://x.com/rexan_wong/status/2103707054108299437
- https://x.com/adipandaio/status/2103541815660228657
- https://x.com/ajith_io/status/2103449416325890146
- https://x.com/chrispattle/status/2102544483334369282
- https://x.com/almonk/status/2102444573016699297

Other original ideas considered (not built): sunprint-frame cyanotype toy, type-drawer letterpress sorts.

## Tech stack

- Bun (package manager + dev runner)
- Vite (bundler / dev server)
- TypeScript
- HTML5 Canvas 2D (layered: desk, parchment, wax pool, brass seal, emboss relief)

## MVP scope (v1)

- Full-viewport canvas: oak grain desk, cream parchment sheet, soft editorial lighting
- Tilted wax stick; click/drag to drip molten wax onto parchment
- Organic wax pool simulation: blobs merge, cool gradient (glossy center → matte edge)
- Draggable matte-brass seal handle; press when over pool
- Emboss reveal: original oak-leaf + acorn monogram in letterpress relief
- Brief crackle/settle animation after press
- Reset clears wax and returns to drip state
- Minimal UI hint text

## Out of scope

- Multiplayer, scores, levels, missions
- Sound / haptics
- Multiple seal designs or wax colors
- 3D / WebGL
- Backend, saving/sharing state
- Brand logos or copied monograms

## How to run

```bash
cd demos/wax-seal
bun install
bun run dev
```

## Validation

- Screenshot of desk with wax pool and brass seal
- Short screen recording showing drip → press → embossed reveal → reset
