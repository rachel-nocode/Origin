const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d", { alpha: false })!;
const hintEl = document.getElementById("hint") as HTMLParagraphElement;
const resetBtn = document.getElementById("reset") as HTMLButtonElement;

type Phase = "drip" | "pressing" | "sealed" | "cooling";

interface WaxBlob {
  x: number;
  y: number;
  r: number;
  heat: number;
}

interface Drip {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  t: number;
  speed: number;
}

interface Crackle {
  x: number;
  y: number;
  angle: number;
  len: number;
  life: number;
}

let width = 0;
let height = 0;
let dpr = 1;

let parchment = { x: 0, y: 0, w: 0, h: 0 };
let stickTip = { x: 0, y: 0 };

const wax: WaxBlob[] = [];
const drips: Drip[] = [];
const crackles: Crackle[] = [];

let phase: Phase = "drip";
let pointerDown = false;
let draggingSeal = false;
let pressDepth = 0;
let pressTarget = 0;
let coolTimer = 0;
let time = 0;

const seal = {
  x: 0,
  y: 0,
  r: 42,
  offsetX: 0,
  offsetY: 0,
};

let bgCanvas: HTMLCanvasElement;
let paperCanvas: HTMLCanvasElement;
let grainCanvas: HTMLCanvasElement;

const WAX_COLOR = { r: 74, g: 18, b: 28 };
const WAX_HOT = { r: 108, g: 28, b: 38 };
const BRASS = { light: "#c9a66b", mid: "#a8844f", dark: "#6b5435" };

function waxVolume(): number {
  return wax.reduce((sum, b) => sum + b.r * b.r, 0);
}

function waxCenter(): { x: number; y: number } | null {
  if (wax.length === 0) return null;
  let sx = 0;
  let sy = 0;
  let sw = 0;
  for (const b of wax) {
    const w = b.r * b.r;
    sx += b.x * w;
    sy += b.y * w;
    sw += w;
  }
  return { x: sx / sw, y: sy / sw };
}

function waxRadius(): number {
  if (wax.length === 0) return 0;
  const c = waxCenter()!;
  let maxR = 0;
  for (const b of wax) {
    const d = Math.hypot(b.x - c.x, b.y - c.y) + b.r;
    if (d > maxR) maxR = d;
  }
  return maxR;
}

function inParchment(x: number, y: number): boolean {
  return (
    x >= parchment.x &&
    x <= parchment.x + parchment.w &&
    y >= parchment.y &&
    y <= parchment.y + parchment.h
  );
}

function createGrain(): HTMLCanvasElement {
  const g = document.createElement("canvas");
  g.width = 256;
  g.height = 256;
  const gCtx = g.getContext("2d")!;
  const img = gCtx.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 190 + Math.random() * 65;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 22;
  }
  gCtx.putImageData(img, 0, 0);
  return g;
}

function createOakDesk(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const dc = c.getContext("2d")!;

  const grad = dc.createLinearGradient(0, 0, width * 0.3, height);
  grad.addColorStop(0, "#5c4228");
  grad.addColorStop(0.35, "#7a5738");
  grad.addColorStop(0.65, "#6b4a30");
  grad.addColorStop(1, "#3d2a1a");
  dc.fillStyle = grad;
  dc.fillRect(0, 0, width, height);

  dc.globalAlpha = 0.08;
  for (let row = 0; row < 40; row++) {
    const y = (row / 40) * height + (Math.sin(row * 1.7) * 8);
    dc.strokeStyle = row % 2 === 0 ? "#2a1a0e" : "#8b6848";
    dc.lineWidth = 1 + (row % 3);
    dc.beginPath();
    dc.moveTo(0, y);
    for (let x = 0; x <= width; x += 40) {
      dc.lineTo(x, y + Math.sin(x * 0.008 + row) * 3);
    }
    dc.stroke();
  }
  dc.globalAlpha = 1;

  const vignette = dc.createRadialGradient(
    width * 0.5,
    height * 0.42,
    Math.min(width, height) * 0.15,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.85,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.55)");
  dc.fillStyle = vignette;
  dc.fillRect(0, 0, width, height);

  return c;
}

function createParchment(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = parchment.w;
  c.height = parchment.h;
  const pc = c.getContext("2d")!;

  pc.fillStyle = "#f3ead8";
  pc.fillRect(0, 0, parchment.w, parchment.h);

  pc.globalAlpha = 0.35;
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * parchment.w;
    const y = Math.random() * parchment.h;
    const v = 180 + Math.random() * 40;
    pc.fillStyle = `rgba(${v}, ${v - 8}, ${v - 18}, 0.4)`;
    pc.fillRect(x, y, 1, 1);
  }
  pc.globalAlpha = 1;

  pc.strokeStyle = "rgba(120, 98, 70, 0.25)";
  pc.lineWidth = 1;
  pc.strokeRect(1.5, 1.5, parchment.w - 3, parchment.h - 3);

  pc.globalCompositeOperation = "multiply";
  const stain = pc.createRadialGradient(
    parchment.w * 0.5,
    parchment.h * 0.55,
    0,
    parchment.w * 0.5,
    parchment.h * 0.55,
    parchment.w * 0.55,
  );
  stain.addColorStop(0, "rgba(210,190,155,0)");
  stain.addColorStop(0.85, "rgba(180,155,120,0.12)");
  stain.addColorStop(1, "rgba(140,115,85,0.22)");
  pc.fillStyle = stain;
  pc.fillRect(0, 0, parchment.w, parchment.h);
  pc.globalCompositeOperation = "source-over";

  return c;
}

function layout() {
  const pad = Math.min(width, height) * 0.08;
  const maxW = width - pad * 2;
  const maxH = height - pad * 2.4;
  const aspect = 1.35;
  let pw = maxW;
  let ph = pw / aspect;
  if (ph > maxH) {
    ph = maxH;
    pw = ph * aspect;
  }
  parchment = {
    x: (width - pw) / 2,
    y: (height - ph) / 2 + height * 0.02,
    w: pw,
    h: ph,
  };
  stickTip = {
    x: parchment.x + parchment.w * 0.72,
    y: parchment.y - height * 0.04,
  };
  seal.x = parchment.x + parchment.w * 0.78;
  seal.y = parchment.y + parchment.h * 0.72;
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
  layout();
  bgCanvas = createOakDesk();
  paperCanvas = createParchment();
  grainCanvas = createGrain();
}

function addWaxBlob(x: number, y: number, amount = 1) {
  const r = 6 + amount * 4;
  for (const b of wax) {
    const d = Math.hypot(b.x - x, b.y - y);
    if (d < b.r + r) {
      const merge = (b.r + r * 0.55) * 1.02;
      b.r = Math.min(merge, 90);
      b.heat = Math.max(b.heat, 0.85);
      b.x += (x - b.x) * 0.15;
      b.y += (y - b.y) * 0.15;
      return;
    }
  }
  wax.push({ x, y, r, heat: 1 });
}

function spawnDrip(tx: number, ty: number) {
  if (phase !== "drip") return;
  if (!inParchment(tx, ty)) return;
  drips.push({
    fromX: stickTip.x,
    fromY: stickTip.y,
    toX: tx,
    toY: ty,
    t: 0,
    speed: 1.6 + Math.random() * 0.5,
  });
}

function spawnCrackles(cx: number, cy: number, count: number) {
  for (let i = 0; i < count; i++) {
    crackles.push({
      x: cx + (Math.random() - 0.5) * waxRadius() * 1.2,
      y: cy + (Math.random() - 0.5) * waxRadius() * 1.2,
      angle: Math.random() * Math.PI * 2,
      len: 4 + Math.random() * 14,
      life: 0.6 + Math.random() * 0.5,
    });
  }
}

function resetDesk() {
  wax.length = 0;
  drips.length = 0;
  crackles.length = 0;
  phase = "drip";
  pressDepth = 0;
  pressTarget = 0;
  coolTimer = 0;
  draggingSeal = false;
  seal.x = parchment.x + parchment.w * 0.78;
  seal.y = parchment.y + parchment.h * 0.72;
  hintEl.textContent = "click or drag to drip wax";
  resetBtn.hidden = true;
}

function canPress(): boolean {
  return waxVolume() > 900 && wax.length > 0;
}

function sealOverPool(): boolean {
  const c = waxCenter();
  if (!c) return false;
  const poolR = waxRadius();
  return Math.hypot(seal.x - c.x, seal.y - c.y) < poolR + seal.r * 0.75;
}

function snapSealToPool() {
  const c = waxCenter();
  if (!c) return;
  seal.x = c.x;
  seal.y = c.y;
}

function beginPress() {
  if (!canPress() || !sealOverPool() || phase !== "drip") return;
  snapSealToPool();
  phase = "pressing";
  pressTarget = 1;
  updateHint();
}

function drawWaxStick() {
  const sx = stickTip.x + 18;
  const sy = stickTip.y - 110;
  const angle = 0.55;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(angle);

  ctx.fillStyle = "#4a1218";
  ctx.strokeStyle = "#2a0a0e";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-10, 0, 20, 95, 4);
  ctx.fill();
  ctx.stroke();

  const dripGrad = ctx.createLinearGradient(0, 70, 0, 95);
  dripGrad.addColorStop(0, "#6b1820");
  dripGrad.addColorStop(1, "#9a2830");
  ctx.fillStyle = dripGrad;
  ctx.beginPath();
  ctx.ellipse(0, 98, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (phase === "drip" && drips.length > 0) {
    ctx.fillStyle = "rgba(140, 30, 38, 0.6)";
    ctx.beginPath();
    ctx.ellipse(0, 102, 3, 6 + Math.sin(time * 8) * 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawWaxPool() {
  if (wax.length === 0) return;

  const c = waxCenter()!;
  const flatten = phase === "pressing" || phase === "sealed" || phase === "cooling"
    ? 1 + pressDepth * 0.18
    : 1;

  for (const b of wax) {
    const heatMix = b.heat;
    const r = b.r * flatten;
    const cr = WAX_COLOR.r + (WAX_HOT.r - WAX_COLOR.r) * heatMix * 0.35;
    const cg = WAX_COLOR.g + (WAX_HOT.g - WAX_COLOR.g) * heatMix * 0.35;
    const cb = WAX_COLOR.b + (WAX_HOT.b - WAX_COLOR.b) * heatMix * 0.35;

    const grad = ctx.createRadialGradient(b.x - r * 0.2, b.y - r * 0.25, 0, b.x, b.y, r);
    grad.addColorStop(0, `rgba(${cr + 30}, ${cg + 12}, ${cb + 8}, 0.95)`);
    grad.addColorStop(0.45, `rgba(${cr}, ${cg}, ${cb}, 0.98)`);
    grad.addColorStop(0.85, `rgba(${cr - 18}, ${cg - 8}, ${cb - 5}, 0.96)`);
    grad.addColorStop(1, `rgba(${cr - 30}, ${cg - 14}, ${cb - 8}, 0.88)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    const wobble = Math.sin(time * 1.2 + b.x * 0.02) * 0.04;
    ctx.ellipse(b.x, b.y, r * (1 + wobble), r * (0.92 - pressDepth * 0.08), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = "rgba(255,240,220,0.08)";
  ctx.beginPath();
  ctx.ellipse(c.x - waxRadius() * 0.15, c.y - waxRadius() * 0.2, waxRadius() * 0.5, waxRadius() * 0.35, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (phase === "sealed" || phase === "cooling") {
    drawEmboss(c.x, c.y, waxRadius() * flatten);
  }
}

function drawEmboss(cx: number, cy: number, scale: number) {
  const s = Math.min(scale / 38, 1.15);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);

  ctx.strokeStyle = "rgba(20, 8, 6, 0.55)";
  ctx.fillStyle = "rgba(30, 12, 8, 0.45)";
  ctx.lineWidth = 1.4;
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.arc(0, 2, 26, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-2, 14);
  ctx.bezierCurveTo(-8, 4, -10, -10, -4, -18);
  ctx.bezierCurveTo(-1, -24, 4, -22, 6, -14);
  ctx.bezierCurveTo(8, -6, 4, 6, -2, 14);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(6, -14);
  ctx.bezierCurveTo(12, -8, 16, 0, 14, 10);
  ctx.bezierCurveTo(13, 16, 8, 18, 4, 14);
  ctx.bezierCurveTo(0, 10, 2, -4, 6, -14);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(10, 12, 5, 6, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 235, 210, 0.18)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-6, -16);
  ctx.lineTo(-4, -10);
  ctx.stroke();

  ctx.restore();
}

function drawCrackles() {
  for (const c of crackles) {
    const alpha = c.life * 0.7;
    ctx.strokeStyle = `rgba(30, 10, 8, ${alpha})`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + Math.cos(c.angle) * c.len, c.y + Math.sin(c.angle) * c.len);
    ctx.stroke();
  }
}

function drawBrassSeal() {
  const depth = pressDepth;
  const sx = seal.x;
  const sy = seal.y + depth * 14;
  const scale = 1 - depth * 0.04;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(scale, scale);

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(4, 10 + depth * 6, seal.r * 0.85, seal.r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  const handleGrad = ctx.createLinearGradient(-seal.r, -seal.r * 2, seal.r, seal.r);
  handleGrad.addColorStop(0, BRASS.light);
  handleGrad.addColorStop(0.45, BRASS.mid);
  handleGrad.addColorStop(1, BRASS.dark);
  ctx.fillStyle = handleGrad;
  ctx.strokeStyle = "#4a3820";
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  ctx.roundRect(-14, -seal.r * 1.6, 28, seal.r * 1.1, 4);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, 0, seal.r, seal.r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(60, 40, 20, 0.35)";
  ctx.beginPath();
  ctx.arc(0, 2, seal.r * 0.78, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(90, 60, 30, 0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 2, seal.r * 0.55, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawDrips() {
  for (const d of drips) {
    const x = d.fromX + (d.toX - d.fromX) * d.t;
    const y = d.fromY + (d.toY - d.fromY) * d.t - Math.sin(d.t * Math.PI) * 18;
    const teardrop = ctx.createRadialGradient(x, y - 3, 0, x, y, 5);
    teardrop.addColorStop(0, "rgba(160, 40, 48, 0.95)");
    teardrop.addColorStop(1, "rgba(90, 18, 24, 0.9)");
    ctx.fillStyle = teardrop;
    ctx.beginPath();
    ctx.ellipse(x, y, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (d.t > 0.05) {
      ctx.strokeStyle = "rgba(100, 24, 30, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(d.fromX, d.fromY);
      ctx.quadraticCurveTo(
        (d.fromX + x) / 2,
        (d.fromY + y) / 2 - 12,
        x,
        y,
      );
      ctx.stroke();
    }
  }
}

function drawScene() {
  ctx.drawImage(bgCanvas, 0, 0, width, height);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 12;
  ctx.drawImage(paperCanvas, parchment.x, parchment.y);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(parchment.x, parchment.y, parchment.w, parchment.h);
  ctx.clip();
  drawWaxPool();
  drawCrackles();
  drawDrips();
  ctx.restore();

  drawWaxStick();
  drawBrassSeal();

  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = ctx.createPattern(grainCanvas, "repeat")!;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function updateHint() {
  if (phase === "drip") {
    if (canPress()) {
      hintEl.textContent = "drag the brass seal onto the wax, then press";
    } else {
      hintEl.textContent = "click or drag to drip wax";
    }
  } else if (phase === "pressing") {
    hintEl.textContent = "pressing…";
  } else if (phase === "sealed" || phase === "cooling") {
    hintEl.textContent = "lifted — wax set";
    resetBtn.hidden = false;
  }
}

function update(dt: number) {
  time += dt;

  for (const b of wax) {
    b.heat = Math.max(0, b.heat - dt * 0.08);
  }

  for (let i = drips.length - 1; i >= 0; i--) {
    const d = drips[i]!;
    d.t += dt * d.speed;
    if (d.t >= 1) {
      addWaxBlob(d.toX, d.toY, 0.8);
      drips.splice(i, 1);
    }
  }

  if (phase === "pressing") {
    pressDepth += (pressTarget - pressDepth) * Math.min(1, dt * 8);
    if (pressTarget >= 1 && pressDepth > 0.92) {
      phase = "sealed";
      const c = waxCenter()!;
      spawnCrackles(c.x, c.y, 18);
      coolTimer = 1.2;
      pressTarget = 0;
      updateHint();
    }
  } else if (phase === "sealed" || phase === "cooling") {
    pressDepth += (0 - pressDepth) * Math.min(1, dt * 4);
    coolTimer -= dt;
    if (coolTimer <= 0 && phase === "sealed") {
      phase = "cooling";
    }
  }

  for (let i = crackles.length - 1; i >= 0; i--) {
    const c = crackles[i]!;
    c.life -= dt * 1.4;
    c.len *= 1 + dt * 0.2;
    if (c.life <= 0) crackles.splice(i, 1);
  }
}

function pointerPos(e: PointerEvent): { x: number; y: number } {
  return { x: e.clientX, y: e.clientY };
}

function hitSeal(x: number, y: number): boolean {
  return Math.hypot(x - seal.x, y - (seal.y + pressDepth * 14)) < seal.r + 20;
}

canvas.addEventListener("pointerdown", (e) => {
  pointerDown = true;
  canvas.setPointerCapture(e.pointerId);
  const { x, y } = pointerPos(e);

  if (phase === "sealed" || phase === "cooling") return;

  if (hitSeal(x, y) && canPress()) {
    draggingSeal = true;
    seal.offsetX = seal.x - x;
    seal.offsetY = seal.y - y;
    return;
  }

  if (phase === "drip" && inParchment(x, y)) {
    spawnDrip(x, y);
  }
});

canvas.addEventListener("pointermove", (e) => {
  const { x, y } = pointerPos(e);

  if (draggingSeal && (phase === "drip" || phase === "pressing")) {
    seal.x = x + seal.offsetX;
    seal.y = y + seal.offsetY;
    canvas.style.cursor = "grabbing";
    return;
  }

  if (pointerDown && phase === "drip" && inParchment(x, y) && !draggingSeal) {
    if (Math.random() < 0.35) spawnDrip(x, y);
  }

  canvas.style.cursor = hitSeal(x, y) && canPress() ? "grab" : "crosshair";
});

canvas.addEventListener("pointerup", () => {
  if (draggingSeal) {
    draggingSeal = false;
    beginPress();
  }
  pointerDown = false;
  canvas.style.cursor = "crosshair";
});

resetBtn.addEventListener("click", resetDesk);

let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  drawScene();
  updateHint();
  requestAnimationFrame(frame);
}

window.addEventListener("resize", () => {
  const hadWax = wax.length > 0;
  resize();
  if (!hadWax) resetDesk();
});

resize();
resetDesk();
requestAnimationFrame(frame);
