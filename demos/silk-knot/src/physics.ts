import type { Point } from "./types";

const SEGMENT_LEN = 14;
const CLOSE_THRESHOLD = 48;
const DAMPING = 0.988;
const GRAVITY = 0.04;
const CONSTRAINT_ITERS = 8;
const STIFFNESS = 0.92;
const INFLATE_STRENGTH = 0.35;

export function createPoint(x: number, y: number, pinned = false): Point {
  return { x, y, prevX: x, prevY: y, pinned };
}

export function addPointIfFarEnough(
  points: Point[],
  x: number,
  y: number,
  minDist = SEGMENT_LEN * 0.6
): boolean {
  if (points.length === 0) {
    points.push(createPoint(x, y, true));
    return true;
  }
  const last = points[points.length - 1];
  const dx = x - last.x;
  const dy = y - last.y;
  if (dx * dx + dy * dy < minDist * minDist) return false;
  points.push(createPoint(x, y));
  return true;
}

export function tryCloseLoop(points: Point[]): boolean {
  if (points.length < 8) return false;
  const first = points[0];
  const last = points[points.length - 1];
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  if (dx * dx + dy * dy > CLOSE_THRESHOLD * CLOSE_THRESHOLD) return false;
  last.x = first.x;
  last.y = first.y;
  last.prevX = first.prevX;
  last.prevY = first.prevY;
  first.pinned = false;
  last.pinned = false;
  return true;
}

export function simulate(points: Point[], closed: boolean): void {
  const cx = centroidX(points);
  const cy = centroidY(points);

  for (const p of points) {
    if (p.pinned) continue;
    const vx = (p.x - p.prevX) * DAMPING;
    const vy = (p.y - p.prevY) * DAMPING;
    p.prevX = p.x;
    p.prevY = p.y;
    p.x += vx;
    p.y += vy + (closed ? 0 : GRAVITY);

    if (closed && points.length > 6) {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const target = loopRadius(points);
      const push = (target - dist) * INFLATE_STRENGTH * 0.02;
      p.x += (dx / dist) * push;
      p.y += (dy / dist) * push;
    }
  }

  for (let iter = 0; iter < CONSTRAINT_ITERS; iter++) {
    for (let i = 0; i < points.length - 1; i++) {
      constrainDistance(points[i], points[i + 1], SEGMENT_LEN);
    }
    if (closed && points.length > 2) {
      constrainDistance(points[points.length - 1], points[0], SEGMENT_LEN);
    }
  }
}

function centroidX(points: Point[]): number {
  let s = 0;
  for (const p of points) s += p.x;
  return s / points.length;
}

function centroidY(points: Point[]): number {
  let s = 0;
  for (const p of points) s += p.y;
  return s / points.length;
}

function loopRadius(points: Point[]): number {
  const cx = centroidX(points);
  const cy = centroidY(points);
  let total = 0;
  for (const p of points) total += Math.hypot(p.x - cx, p.y - cy);
  return (total / points.length) * 0.85;
}

function constrainDistance(a: Point, b: Point, rest: number): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
  const diff = (dist - rest) / dist;
  const offsetX = dx * diff * STIFFNESS * 0.5;
  const offsetY = dy * diff * STIFFNESS * 0.5;

  if (!a.pinned) {
    a.x += offsetX;
    a.y += offsetY;
  }
  if (!b.pinned) {
    b.x -= offsetX;
    b.y -= offsetY;
  }
}

export function pluckSegment(
  points: Point[],
  px: number,
  py: number,
  closed: boolean
): { index: number; arcPos: number } | null {
  let bestDist = Infinity;
  let bestIndex = -1;
  let bestT = 0;

  const segCount = closed ? points.length : points.length - 1;
  if (segCount < 1) return null;

  for (let i = 0; i < segCount; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const { t, dist } = closestOnSegment(px, py, a.x, a.y, b.x, b.y);
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
      bestT = t;
    }
  }

  if (bestDist > 80 || bestIndex < 0) return null;

  const a = points[bestIndex];
  const b = points[(bestIndex + 1) % points.length];

  const sdx = b.x - a.x;
  const sdy = b.y - a.y;
  const slen = Math.sqrt(sdx * sdx + sdy * sdy) || 1;
  const nx = -sdy / slen;
  const ny = sdx / slen;

  const impulse = 9;
  for (let j = -2; j <= 3; j++) {
    const idx = (bestIndex + j + points.length) % points.length;
    const falloff = 1 - Math.abs(j) * 0.22;
    const p = points[idx];
    if (p.pinned) continue;
    p.x += nx * impulse * falloff;
    p.y += ny * impulse * falloff;
    p.prevX -= nx * impulse * falloff * 0.4;
    p.prevY -= ny * impulse * falloff * 0.4;
  }

  const arcPos = arcLengthAt(points, bestIndex, bestT, closed);
  return { index: bestIndex, arcPos };
}

function closestOnSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): { t: number; dist: number } {
  const abx = bx - ax;
  const aby = by - ay;
  const len2 = abx * abx + aby * aby;
  let t = len2 === 0 ? 0 : ((px - ax) * abx + (py - ay) * aby) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  const dx = px - cx;
  const dy = py - cy;
  return { t, dist: Math.sqrt(dx * dx + dy * dy) };
}

export function totalArcLength(points: Point[], closed: boolean): number {
  let len = 0;
  const n = closed ? points.length : points.length - 1;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    len += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return len;
}

export function arcLengthAt(
  points: Point[],
  segIndex: number,
  t: number,
  closed: boolean
): number {
  let len = 0;
  for (let i = 0; i < segIndex; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    len += Math.hypot(b.x - a.x, b.y - a.y);
  }
  const a = points[segIndex];
  const b = points[(segIndex + 1) % points.length];
  len += Math.hypot(b.x - a.x, b.y - a.y) * t;
  return len / Math.max(totalArcLength(points, closed), 1);
}

export function arcLengthAtPoint(
  points: Point[],
  index: number,
  closed: boolean
): number {
  let len = 0;
  for (let i = 0; i < index; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    len += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return len / Math.max(totalArcLength(points, closed), 1);
}
