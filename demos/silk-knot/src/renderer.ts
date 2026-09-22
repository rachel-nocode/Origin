import type { Point, Ripple } from "./types";
import { rippleLiftAt, rippleTintAt } from "./ripple";

const PAPER = "#ede8df";
const PAPER_SHADOW = "#e2dbd0";
const THREAD_SHADOW = "rgba(72, 48, 38, 0.18)";
const THREAD_BASE = { r: 122, g: 78, b: 68 };
const THREAD_HIGHLIGHT = { r: 210, g: 188, b: 170 };
const DYE_OCHRE = { r: 196, g: 149, b: 106 };
const DYE_ROSE = { r: 184, g: 123, b: 138 };
const DYE_SAGE = { r: 122, g: 139, b: 111 };

let grainCanvas: HTMLCanvasElement | null = null;

export function render(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  points: Point[],
  closed: boolean,
  ripples: Ripple[],
  now: number,
  hintAlpha: number
): void {
  drawPaper(ctx, width, height);

  if (points.length >= 2) {
    drawThread(ctx, points, closed, ripples, now);
  }

  if (hintAlpha > 0.01) {
    drawHint(ctx, width, height, hintAlpha);
  }
}

function drawPaper(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const g = ctx.createLinearGradient(0, 0, width, height);
  g.addColorStop(0, PAPER);
  g.addColorStop(0.55, "#f0ebe3");
  g.addColorStop(1, PAPER_SHADOW);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  if (!grainCanvas || grainCanvas.width !== width || grainCanvas.height !== height) {
    grainCanvas = document.createElement("canvas");
    grainCanvas.width = width;
    grainCanvas.height = height;
    const gctx = grainCanvas.getContext("2d")!;
    const img = gctx.createImageData(width, height);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 14;
      img.data[i] = 128 + n;
      img.data[i + 1] = 124 + n;
      img.data[i + 2] = 116 + n;
      img.data[i + 3] = 18;
    }
    gctx.putImageData(img, 0, 0);
  }

  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.drawImage(grainCanvas, 0, 0);
  ctx.restore();

  const vignette = ctx.createRadialGradient(
    width * 0.5,
    height * 0.48,
    Math.min(width, height) * 0.2,
    width * 0.5,
    height * 0.48,
    Math.min(width, height) * 0.75
  );
  vignette.addColorStop(0, "rgba(255, 252, 246, 0)");
  vignette.addColorStop(1, "rgba(160, 140, 120, 0.12)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function threadColor(arc: number, tint: number, lift: number): string {
  const baseMix = arc * 0.35;
  const dye =
    baseMix < 0.33
      ? DYE_OCHRE
      : baseMix < 0.66
        ? DYE_ROSE
        : DYE_SAGE;

  const t = tint;
  const r = Math.round(THREAD_BASE.r + (dye.r - THREAD_BASE.r) * t + lift * 28);
  const g = Math.round(THREAD_BASE.g + (dye.g - THREAD_BASE.g) * t + lift * 22);
  const b = Math.round(THREAD_BASE.b + (dye.b - THREAD_BASE.b) * t + lift * 18);
  return `rgb(${r}, ${g}, ${b})`;
}

function drawThread(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  closed: boolean,
  ripples: Ripple[],
  now: number
): void {
  const segments = buildSmoothSegments(points, closed);
  if (segments.length === 0) return;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Soft cast shadow on paper
  ctx.strokeStyle = THREAD_SHADOW;
  ctx.lineWidth = 5.5;
  ctx.globalAlpha = 0.7;
  strokeSegments(ctx, segments, ripples, now, 1.2, 0.6);
  ctx.globalAlpha = 1;

  // Thread body — two matte passes
  for (const pass of [
    { w: 4.2, lift: 0, alpha: 1 },
    { w: 2.4, lift: 0.12, alpha: 0.85 },
  ]) {
    ctx.lineWidth = pass.w;
    ctx.globalAlpha = pass.alpha;
    strokeSegments(ctx, segments, ripples, now, 0, pass.lift, (arc, tint, lift) =>
      threadColor(arc, tint, lift + pass.lift)
    );
  }

  // Fine silk highlight — very subtle, no glow
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.35;
  strokeSegments(ctx, segments, ripples, now, -0.4, 0.2, (_arc, tint, lift) => {
    const v = 0.55 + tint * 0.2 + lift;
    const r = Math.round(THREAD_HIGHLIGHT.r * v);
    const g = Math.round(THREAD_HIGHLIGHT.g * v);
    const b = Math.round(THREAD_HIGHLIGHT.b * v);
    return `rgb(${r}, ${g}, ${b})`;
  });

  ctx.restore();
}

interface SmoothSegment {
  x0: number;
  y0: number;
  cpx: number;
  cpy: number;
  x1: number;
  y1: number;
  arc: number;
}

function strokeSegments(
  ctx: CanvasRenderingContext2D,
  segments: SmoothSegment[],
  ripples: Ripple[],
  now: number,
  offsetX: number,
  offsetY: number,
  colorFn?: (arc: number, tint: number, lift: number) => string
): void {
  for (const seg of segments) {
    const tint = rippleTintAt(ripples, seg.arc, now);
    const lift = rippleLiftAt(ripples, seg.arc, now);
    ctx.strokeStyle = colorFn ? colorFn(seg.arc, tint, lift) : THREAD_SHADOW;

    ctx.beginPath();
    ctx.moveTo(seg.x0 + offsetX, seg.y0 + offsetY);
    ctx.quadraticCurveTo(seg.cpx + offsetX, seg.cpy + offsetY, seg.x1 + offsetX, seg.y1 + offsetY);
    ctx.stroke();
  }
}

function buildSmoothSegments(points: Point[], closed: boolean): SmoothSegment[] {
  const n = points.length;
  if (n < 2) return [];

  const segments: SmoothSegment[] = [];
  const count = closed ? n : n - 1;

  for (let i = 0; i < count; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];

    segments.push({
      x0: p1.x,
      y0: p1.y,
      cpx: p2.x,
      cpy: p2.y,
      x1: (p1.x + p2.x) * 0.5,
      y1: (p1.y + p2.y) * 0.5,
      arc: ((i + 0.5) / count) % 1,
    });
  }

  return segments;
}

function drawHint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  alpha: number
): void {
  ctx.save();
  ctx.globalAlpha = alpha * 0.65;
  ctx.fillStyle = "rgba(92, 72, 58, 0.75)";
  ctx.font = "italic 15px 'Iowan Old Style', 'Palatino Linotype', Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("draw a thread · pluck to ripple · C to clear", width / 2, height - 36);
  ctx.restore();
}
