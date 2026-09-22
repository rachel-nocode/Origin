import {
  addPointIfFarEnough,
  createPoint,
  pluckSegment,
  simulate,
  tryCloseLoop,
} from "./physics";
import { render } from "./renderer";
import { spawnRipple, updateRipples } from "./ripple";
import type { Point, PointerState, Ripple } from "./types";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

let width = 0;
let height = 0;
let points: Point[] = [];
let ripples: Ripple[] = [];
let closed = false;
let hintAlpha = 1;
let interacted = false;
let lastTapTime = 0;

const pointer: PointerState = { x: 0, y: 0, down: false, drawing: false };

function resize(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function clearKnot(): void {
  points = [];
  ripples = [];
  closed = false;
}

function setPointer(x: number, y: number): void {
  pointer.x = x;
  pointer.y = y;
}

function onPointerDown(x: number, y: number): void {
  pointer.down = true;
  setPointer(x, y);

  const now = performance.now();
  if (now - lastTapTime < 320) {
    clearKnot();
    lastTapTime = 0;
    return;
  }
  lastTapTime = now;

  if (points.length >= 4 && !pointer.drawing) {
    const hit = pluckSegment(points, x, y, closed);
    if (hit) {
      spawnRipple(ripples, hit.arcPos, 1.0);
      interacted = true;
      pointer.drawing = false;
      return;
    }
  }

  pointer.drawing = true;
  points = [createPoint(x, y, true)];
  closed = false;
  interacted = true;
}

function onPointerMove(x: number, y: number): void {
  setPointer(x, y);
  if (!pointer.down || !pointer.drawing) return;
  addPointIfFarEnough(points, x, y);
}

function onPointerUp(): void {
  if (pointer.drawing && points.length >= 3) {
    closed = tryCloseLoop(points);
    if (!closed && points.length > 1) {
      points[points.length - 1].pinned = true;
    }
  }
  pointer.down = false;
  pointer.drawing = false;
}

function loop(now: number): void {
  if (points.length > 2 && !pointer.drawing) {
    simulate(points, closed);
  }

  updateRipples(ripples, now);

  if (interacted && hintAlpha > 0) {
    hintAlpha = Math.max(0, hintAlpha - 0.012);
  }

  render(ctx, width, height, points, closed, ripples, now, hintAlpha);
  requestAnimationFrame(loop);
}

canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  onPointerDown(e.clientX, e.clientY);
});

canvas.addEventListener("pointermove", (e) => {
  onPointerMove(e.clientX, e.clientY);
});

canvas.addEventListener("pointerup", () => onPointerUp());
canvas.addEventListener("pointercancel", () => onPointerUp());

window.addEventListener("keydown", (e) => {
  if (e.key === "c" || e.key === "C") clearKnot();
});

window.addEventListener("resize", resize);

resize();
requestAnimationFrame(loop);
