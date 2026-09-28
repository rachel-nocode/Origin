const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d", { alpha: false })!;

const SIM_W = 180;
const SIM_H = 120;
const DAMPING = 0.985;
const WAVE_SPEED = 0.45;

let width = 0;
let height = 0;
let dpr = 1;

let current: Float32Array;
let previous: Float32Array;

const boat = {
  x: SIM_W * 0.35,
  y: SIM_H * 0.5,
  angle: 0,
  bob: 0,
  driftPhase: Math.random() * Math.PI * 2,
};

let pointerDown = false;
let lastPointer: { x: number; y: number } | null = null;
let time = 0;

// Pre-rendered watercolor background
let bgCanvas: HTMLCanvasElement;
let bgCtx: CanvasRenderingContext2D;
let waterCanvas: HTMLCanvasElement;
let waterCtx: CanvasRenderingContext2D;
let grainCanvas: HTMLCanvasElement;

function initBuffers() {
  const size = SIM_W * SIM_H;
  current = new Float32Array(size);
  previous = new Float32Array(size);
}

function idx(x: number, y: number): number {
  return y * SIM_W + x;
}

function sampleHeight(x: number, y: number): number {
  const cx = Math.max(1, Math.min(SIM_W - 2, Math.round(x)));
  const cy = Math.max(1, Math.min(SIM_H - 2, Math.round(y)));
  return current[idx(cx, cy)];
}

function sampleGradient(x: number, y: number): { dx: number; dy: number } {
  const cx = Math.max(1, Math.min(SIM_W - 2, Math.round(x)));
  const cy = Math.max(1, Math.min(SIM_H - 2, Math.round(y)));
  const dx = sampleHeight(cx + 1, cy) - sampleHeight(cx - 1, cy);
  const dy = sampleHeight(cx, cy + 1) - sampleHeight(cx, cy - 1);
  return { dx, dy };
}

function puddleMask(x: number, y: number): number {
  const nx = (x / SIM_W - 0.5) * 1.6;
  const ny = (y / SIM_H - 0.5) * 2.2;
  const r = Math.sqrt(nx * nx + ny * ny);
  const edge = 0.72 + Math.sin(nx * 3.1 + ny * 2.4) * 0.06 + Math.cos(ny * 4.2) * 0.04;
  return Math.max(0, Math.min(1, (edge - r) * 8));
}

function createBackground() {
  bgCanvas = document.createElement("canvas");
  bgCanvas.width = width;
  bgCanvas.height = height;
  bgCtx = bgCanvas.getContext("2d")!;

  // Warm tabletop
  const grad = bgCtx.createRadialGradient(
    width * 0.5,
    height * 0.45,
    0,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.8,
  );
  grad.addColorStop(0, "#c4a882");
  grad.addColorStop(0.4, "#a88962");
  grad.addColorStop(0.75, "#7d6348");
  grad.addColorStop(1, "#4a3828");
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, width, height);

  // Paper stain / watercolor bleed around puddle
  bgCtx.globalCompositeOperation = "multiply";
  for (let i = 0; i < 12; i++) {
    const px = width * (0.3 + Math.random() * 0.4);
    const py = height * (0.3 + Math.random() * 0.35);
    const rad = Math.min(width, height) * (0.15 + Math.random() * 0.2);
    const stain = bgCtx.createRadialGradient(px, py, 0, px, py, rad);
    stain.addColorStop(0, `rgba(${60 + Math.random() * 40}, ${90 + Math.random() * 50}, ${140 + Math.random() * 40}, 0.15)`);
    stain.addColorStop(0.5, `rgba(${40 + Math.random() * 30}, ${70 + Math.random() * 40}, ${120 + Math.random() * 30}, 0.08)`);
    stain.addColorStop(1, "rgba(0,0,0,0)");
    bgCtx.fillStyle = stain;
    bgCtx.beginPath();
    bgCtx.ellipse(px, py, rad, rad * 0.85, Math.random() * Math.PI, 0, Math.PI * 2);
    bgCtx.fill();
  }
  bgCtx.globalCompositeOperation = "source-over";

  // Vignette
  const vignette = bgCtx.createRadialGradient(
    width * 0.5,
    height * 0.5,
    Math.min(width, height) * 0.2,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.75,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.45)");
  bgCtx.fillStyle = vignette;
  bgCtx.fillRect(0, 0, width, height);
}

function createGrain() {
  grainCanvas = document.createElement("canvas");
  grainCanvas.width = 256;
  grainCanvas.height = 256;
  const gCtx = grainCanvas.getContext("2d")!;
  const img = gCtx.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 200 + Math.random() * 55;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 18;
  }
  gCtx.putImageData(img, 0, 0);
}

function createWaterLayer() {
  waterCanvas = document.createElement("canvas");
  waterCanvas.width = SIM_W;
  waterCanvas.height = SIM_H;
  waterCtx = waterCanvas.getContext("2d")!;
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  createBackground();
  createGrain();
  createWaterLayer();
}

function screenToSim(sx: number, sy: number): { x: number; y: number } | null {
  const puddleW = Math.min(width, height) * 0.82;
  const puddleH = puddleW * (SIM_H / SIM_W);
  const ox = (width - puddleW) / 2;
  const oy = (height - puddleH) / 2;
  const x = ((sx - ox) / puddleW) * SIM_W;
  const y = ((sy - oy) / puddleH) * SIM_H;
  if (x < 0 || x >= SIM_W || y < 0 || y >= SIM_H) return null;
  if (puddleMask(x, y) < 0.1) return null;
  return { x, y };
}

function addRipple(x: number, y: number, strength: number) {
  const ix = Math.round(x);
  const iy = Math.round(y);
  const radius = 3;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const px = ix + dx;
      const py = iy + dy;
      if (px < 1 || px >= SIM_W - 1 || py < 1 || py >= SIM_H - 1) continue;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) continue;
      const falloff = 1 - dist / (radius + 0.5);
      const mask = puddleMask(px, py);
      current[idx(px, py)] += strength * falloff * mask;
    }
  }
}

function stepSimulation() {
  for (let y = 1; y < SIM_H - 1; y++) {
    for (let x = 1; x < SIM_W - 1; x++) {
      const i = idx(x, y);
      const mask = puddleMask(x, y);
      if (mask < 0.05) {
        current[i] = 0;
        previous[i] = 0;
        continue;
      }

      const sum =
        previous[idx(x - 1, y)] +
        previous[idx(x + 1, y)] +
        previous[idx(x, y - 1)] +
        previous[idx(x, y + 1)];

      const val = (sum / 2 - current[i]) * WAVE_SPEED;
      current[i] = val * DAMPING * mask;
    }
  }

  const tmp = previous;
  previous = current;
  current = tmp;

  // Gentle ambient ripples at edges
  time += 0.016;
  const ambientX = SIM_W * 0.5 + Math.sin(time * 0.7) * SIM_W * 0.3;
  const ambientY = SIM_H * 0.5 + Math.cos(time * 0.5) * SIM_H * 0.25;
  addRipple(ambientX, ambientY, 0.08 + Math.sin(time * 1.3) * 0.04);
}

function updateBoat() {
  const drift = Math.sin(time * 0.25 + boat.driftPhase) * 0.12 + 0.08;
  boat.x += drift;
  boat.y += Math.sin(time * 0.4 + boat.driftPhase * 1.3) * 0.04;

  const grad = sampleGradient(boat.x, boat.y);
  const targetAngle = Math.atan2(grad.dy, grad.dx) * 0.6;
  boat.angle += (targetAngle - boat.angle) * 0.08;

  const h = sampleHeight(boat.x, boat.y);
  boat.bob = h * 2.5;

  // Wrap within puddle
  if (boat.x > SIM_W - 8) boat.x = 8;
  if (boat.x < 8) boat.x = SIM_W - 8;

  const mask = puddleMask(boat.x, boat.y);
  if (mask < 0.3) {
    boat.y = SIM_H * 0.5;
  }
}

function renderWater() {
  const img = waterCtx.createImageData(SIM_W, SIM_H);
  const data = img.data;

  for (let y = 0; y < SIM_H; y++) {
    for (let x = 0; x < SIM_W; x++) {
      const i = idx(x, y);
      const h = current[i];
      const mask = puddleMask(x, y);

      const left = current[idx(Math.max(0, x - 1), y)];
      const right = current[idx(Math.min(SIM_W - 1, x + 1), y)];
      const up = current[idx(x, Math.max(0, y - 1))];
      const down = current[idx(x, Math.min(SIM_H - 1, y + 1))];
      const nx = (left - right) * 3;
      const ny = (up - down) * 3;

      const shimmer = Math.sin(x * 0.3 + y * 0.2 + time * 2) * 0.02;

      // Watercolor palette: teal-blue with warm highlights
      const depth = 0.55 + mask * 0.35;
      const r = Math.floor((45 + h * 80 + nx * 30 + shimmer * 20) * depth * mask);
      const g = Math.floor((110 + h * 50 + ny * 20 + shimmer * 15) * depth * mask);
      const b = Math.floor((165 + h * 70 - nx * 15 + shimmer * 25) * depth * mask);

      const pi = (y * SIM_W + x) * 4;
      data[pi] = Math.max(0, Math.min(255, r));
      data[pi + 1] = Math.max(0, Math.min(255, g));
      data[pi + 2] = Math.max(0, Math.min(255, b));
      data[pi + 3] = Math.floor(mask * 220);
    }
  }

  waterCtx.putImageData(img, 0, 0);
}

function drawBoat() {
  const puddleW = Math.min(width, height) * 0.82;
  const puddleH = puddleW * (SIM_H / SIM_W);
  const ox = (width - puddleW) / 2;
  const oy = (height - puddleH) / 2;

  const px = ox + (boat.x / SIM_W) * puddleW;
  const py = oy + (boat.y / SIM_H) * puddleH + boat.bob * (puddleH / SIM_H);

  const scale = puddleW / SIM_W * 2.8;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(boat.angle);
  ctx.scale(scale, scale);

  // Shadow under boat
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#1a2838";
  ctx.beginPath();
  ctx.ellipse(2, 4, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Hull — folded paper boat shape
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(12, 6);
  ctx.lineTo(0, 4);
  ctx.lineTo(-12, 6);
  ctx.closePath();

  const hullGrad = ctx.createLinearGradient(-12, 0, 12, 0);
  hullGrad.addColorStop(0, "#f5ebe0");
  hullGrad.addColorStop(0.3, "#fff8f0");
  hullGrad.addColorStop(0.5, "#ffffff");
  hullGrad.addColorStop(0.7, "#f0e6d8");
  hullGrad.addColorStop(1, "#e8dcc8");
  ctx.fillStyle = hullGrad;
  ctx.fill();

  ctx.strokeStyle = "rgba(120, 100, 80, 0.35)";
  ctx.lineWidth = 0.4;
  ctx.stroke();

  // Fold crease
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(0, 4);
  ctx.strokeStyle = "rgba(100, 85, 70, 0.25)";
  ctx.lineWidth = 0.3;
  ctx.stroke();

  // Side fold lines
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(8, 2);
  ctx.moveTo(0, -8);
  ctx.lineTo(-8, 2);
  ctx.strokeStyle = "rgba(100, 85, 70, 0.15)";
  ctx.stroke();

  // Tiny mast
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(0, -14);
  ctx.strokeStyle = "rgba(80, 70, 60, 0.4)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Paper flag
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(5, -12);
  ctx.lineTo(0, -10);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 200, 180, 0.7)";
  ctx.fill();

  ctx.restore();
}

function render() {
  ctx.drawImage(bgCanvas, 0, 0, width, height);

  const puddleW = Math.min(width, height) * 0.82;
  const puddleH = puddleW * (SIM_H / SIM_W);
  const ox = (width - puddleW) / 2;
  const oy = (height - puddleH) / 2;

  // Soft puddle glow beneath water
  ctx.save();
  ctx.globalAlpha = 0.35;
  const glow = ctx.createRadialGradient(
    ox + puddleW * 0.5,
    oy + puddleH * 0.5,
    0,
    ox + puddleW * 0.5,
    oy + puddleH * 0.5,
    puddleW * 0.5,
  );
  glow.addColorStop(0, "rgba(80, 160, 200, 0.5)");
  glow.addColorStop(0.7, "rgba(50, 120, 170, 0.2)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(ox - 20, oy - 20, puddleW + 40, puddleH + 40);
  ctx.restore();

  // Water surface
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(waterCanvas, ox, oy, puddleW, puddleH);
  ctx.restore();

  // Specular shimmer overlay
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.globalAlpha = 0.15;
  const shimmerGrad = ctx.createLinearGradient(ox, oy, ox + puddleW, oy + puddleH);
  shimmerGrad.addColorStop(0, `rgba(255,255,255,${0.3 + Math.sin(time) * 0.1})`);
  shimmerGrad.addColorStop(0.5, "rgba(255,255,255,0)");
  shimmerGrad.addColorStop(1, `rgba(255,255,255,${0.2 + Math.cos(time * 0.7) * 0.1})`);
  ctx.fillStyle = shimmerGrad;
  ctx.fillRect(ox, oy, puddleW, puddleH);
  ctx.restore();

  drawBoat();

  // Film grain
  ctx.save();
  ctx.globalAlpha = 0.06;
  const pattern = ctx.createPattern(grainCanvas, "repeat")!;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function onPointerDown(e: PointerEvent) {
  pointerDown = true;
  canvas.setPointerCapture(e.pointerId);
  const sim = screenToSim(e.clientX, e.clientY);
  if (sim) {
    addRipple(sim.x, sim.y, 2.5);
    lastPointer = sim;
  }
}

function onPointerMove(e: PointerEvent) {
  if (!pointerDown) return;
  const sim = screenToSim(e.clientX, e.clientY);
  if (!sim) return;

  if (lastPointer) {
    const dx = sim.x - lastPointer.x;
    const dy = sim.y - lastPointer.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.ceil(dist));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = lastPointer.x + dx * t;
      const y = lastPointer.y + dy * t;
      addRipple(x, y, 1.8);
    }
  } else {
    addRipple(sim.x, sim.y, 2.5);
  }
  lastPointer = sim;
}

function onPointerUp(e: PointerEvent) {
  pointerDown = false;
  lastPointer = null;
  canvas.releasePointerCapture(e.pointerId);
}

function loop() {
  stepSimulation();
  updateBoat();
  renderWater();
  render();
  requestAnimationFrame(loop);
}

initBuffers();
resize();
window.addEventListener("resize", resize);
canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointercancel", onPointerUp);
requestAnimationFrame(loop);
