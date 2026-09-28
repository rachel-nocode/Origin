import type { Ripple } from "./types";

const RIPPLE_LIFETIME = 2.8;
const RIPPLE_WAVELENGTH = 0.12;

export function spawnRipple(ripples: Ripple[], arcPos: number, strength = 1): void {
  ripples.push({
    arcPos,
    birth: performance.now() / 1000,
    strength,
    speed: 1.4,
  });
}

export function updateRipples(ripples: Ripple[], now: number): void {
  const t = now / 1000;
  for (let i = ripples.length - 1; i >= 0; i--) {
    if (t - ripples[i].birth > RIPPLE_LIFETIME) {
      ripples.splice(i, 1);
    }
  }
}

/** Warm dye shift: 0 = base thread, 1 = full ripple tint */
export function rippleTintAt(ripples: Ripple[], arcPos: number, now: number): number {
  const t = now / 1000;
  let tint = 0;
  for (const r of ripples) {
    const age = t - r.birth;
    if (age < 0 || age > RIPPLE_LIFETIME) continue;
    const waveFront = (r.arcPos + age * r.speed * 0.35) % 1;
    let dist = Math.abs(arcPos - waveFront);
    dist = Math.min(dist, 1 - dist);
    const envelope = Math.exp(-age * 1.6) * r.strength;
    const wave = Math.sin((dist / RIPPLE_WAVELENGTH) * Math.PI * 2 - age * 8);
    const eased = wave * Math.max(0, 1 - dist * 4);
    tint += eased * envelope;
  }
  return Math.min(1, Math.max(0, tint));
}

/** Subtle lift in thread value where ripple passes */
export function rippleLiftAt(ripples: Ripple[], arcPos: number, now: number): number {
  const t = now / 1000;
  let lift = 0;
  for (const r of ripples) {
    const age = t - r.birth;
    if (age < 0 || age > RIPPLE_LIFETIME) continue;
    const waveFront = (r.arcPos + age * r.speed * 0.35) % 1;
    let dist = Math.abs(arcPos - waveFront);
    dist = Math.min(dist, 1 - dist);
    const envelope = Math.exp(-age * 2) * r.strength;
    lift += Math.max(0, 1 - dist * 6) * envelope * 0.35;
  }
  return lift;
}
