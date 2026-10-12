import { ShipModelType } from '../types/game.ts';
import { drawProceduralShipHull } from '../components/renderShipCosmetics.ts';

export interface FloatingCombatText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
  vx: number;
  life: number;
  maxLife: number;
  isCrit?: boolean;
}

export interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  lineWidth: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface AfterimageGhost {
  x: number;
  y: number;
  angle: number;
  shipModel: ShipModelType;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface MuzzleFlash {
  x: number;
  y: number;
  angle: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  baseAlpha: number;
  pulsePhase: number;
  pulseSpeed: number;
  type: 'star' | 'dust' | 'glyph' | 'crystal' | 'ember';
}

export interface ExtendedParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
  type?: 'spark' | 'smoke' | 'matrix' | 'star' | 'shrapnel' | 'ember';
  rotation?: number;
  vRot?: number;
}

export interface HitMarker {
  time: number;
  isKill: boolean;
  x?: number;
  y?: number;
}

export interface KillBannerNotification {
  id: string;
  victimName: string;
  weapon: string;
  comboText?: string;
  timestamp: number;
  duration: number;
}

/**
 * Creates lightweight ambient particle fields (tuned count for 60-144 FPS).
 */
export function createAmbientField(mapId: string, count: number = 32): AmbientParticle[] {
  const particles: AmbientParticle[] = [];
  const width = 3600;
  const height = 3600;

  for (let i = 0; i < count; i++) {
    let color = '#ffffff';
    let type: AmbientParticle['type'] = 'dust';
    let size = 1.5 + Math.random() * 2;
    let baseAlpha = 0.25 + Math.random() * 0.35;
    let vx = (Math.random() - 0.5) * 12;
    let vy = (Math.random() - 0.5) * 12;

    if (mapId.includes('nebula')) {
      const colors = ['#38bdf8', '#c084fc', '#f472b6'];
      color = colors[Math.floor(Math.random() * colors.length)];
      type = Math.random() > 0.4 ? 'dust' : 'star';
      size = 2 + Math.random() * 2.5;
      baseAlpha = 0.3 + Math.random() * 0.3;
      vx = -10 + (Math.random() - 0.5) * 8;
      vy = 6 + (Math.random() - 0.5) * 8;
    } else if (mapId.includes('crystal')) {
      const colors = ['#22d3ee', '#a7f3d0', '#f43f5e'];
      color = colors[Math.floor(Math.random() * colors.length)];
      type = 'crystal';
      size = 2 + Math.random() * 2.5;
      baseAlpha = 0.35 + Math.random() * 0.35;
      vx = (Math.random() - 0.5) * 8;
      vy = -8 + (Math.random() - 0.5) * 6;
    } else if (mapId.includes('void') || mapId.includes('boss')) {
      const colors = ['#a855f7', '#ec4899', '#6366f1'];
      color = colors[Math.floor(Math.random() * colors.length)];
      type = 'ember';
      size = 1.8 + Math.random() * 2.2;
      baseAlpha = 0.25 + Math.random() * 0.35;
      vx = (Math.random() - 0.5) * 15;
      vy = -14 - Math.random() * 10;
    } else if (mapId.includes('station') || mapId.includes('cyber')) {
      const colors = ['#06b6d4', '#10b981', '#3b82f6'];
      color = colors[Math.floor(Math.random() * colors.length)];
      type = 'glyph';
      size = 2;
      baseAlpha = 0.3 + Math.random() * 0.3;
      vx = (Math.random() - 0.5) * 5;
      vy = -12 - Math.random() * 8;
    } else {
      const colors = ['#e2e8f0', '#93c5fd', '#fef08a'];
      color = colors[Math.floor(Math.random() * colors.length)];
      type = 'star';
      size = 1.2 + Math.random() * 1.8;
      baseAlpha = 0.2 + Math.random() * 0.35;
      vx = (Math.random() - 0.5) * 8;
      vy = (Math.random() - 0.5) * 8;
    }

    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx,
      vy,
      size,
      color,
      alpha: baseAlpha,
      baseAlpha,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 1.5 + Math.random() * 2,
      type,
    });
  }

  return particles;
}

/**
 * Spawns an animated multi-stage explosion at coordinates (x, y).
 * Optimized with bounded particle allocations.
 */
export function createExplosionBundle(
  x: number,
  y: number,
  color: string,
  isCritical: boolean = false,
  isLowQuality: boolean = false
): {
  particles: ExtendedParticle[];
  shockwaves: ShockwaveRing[];
} {
  const particleCount = isLowQuality ? (isCritical ? 12 : 8) : isCritical ? 24 : 15;
  const resultParticles: ExtendedParticle[] = [];

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 70 + Math.random() * (isCritical ? 260 : 180);
    const isEmber = Math.random() > 0.65;
    const isSmoke = Math.random() > 0.8;

    resultParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: isSmoke ? 'rgba(100, 116, 139, 0.5)' : isEmber ? '#fbbf24' : color,
      alpha: 1,
      size: isSmoke ? 5 + Math.random() * 6 : 2 + Math.random() * 3.5,
      life: 0,
      maxLife: isSmoke ? 0.45 + Math.random() * 0.3 : 0.3 + Math.random() * 0.35,
      type: isSmoke ? 'smoke' : isEmber ? 'ember' : 'spark',
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 6,
    });
  }

  const shockwaves: ShockwaveRing[] = [
    {
      x,
      y,
      radius: 4,
      maxRadius: isCritical ? 65 : 44,
      color,
      lineWidth: isCritical ? 4 : 2.5,
      alpha: 0.85,
      life: 0,
      maxLife: 0.32,
    },
  ];

  if (isCritical && !isLowQuality) {
    shockwaves.push({
      x,
      y,
      radius: 8,
      maxRadius: 90,
      color: '#ffffff',
      lineWidth: 1.5,
      alpha: 0.75,
      life: 0,
      maxLife: 0.38,
    });
  }

  return { particles: resultParticles, shockwaves };
}

/**
 * Spawns directional impact sparks. Fast & bounded.
 */
export function createImpactSparks(
  x: number,
  y: number,
  angle: number,
  color: string,
  count: number = 4
): ExtendedParticle[] {
  const sparks: ExtendedParticle[] = [];
  const baseAngle = angle + Math.PI;

  for (let i = 0; i < count; i++) {
    const spread = (Math.random() - 0.5) * 1.2;
    const sparkAngle = baseAngle + spread;
    const speed = 80 + Math.random() * 140;

    sparks.push({
      x,
      y,
      vx: Math.cos(sparkAngle) * speed,
      vy: Math.sin(sparkAngle) * speed,
      color: Math.random() > 0.4 ? color : '#ffffff',
      alpha: 1,
      size: 1.5 + Math.random() * 2,
      life: 0,
      maxLife: 0.18 + Math.random() * 0.2,
      type: 'spark',
    });
  }

  return sparks;
}

/**
 * Zero-allocation in-place compaction for floating combat text.
 * Batch sets font, text baseline, and stroke styles to avoid repeated DOM font parsing.
 */
export function drawFloatingCombatTexts(
  ctx: CanvasRenderingContext2D,
  texts: FloatingCombatText[],
  dt: number,
  enableStroke: boolean = true
): void {
  const len = texts.length;
  if (len === 0) return;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 11px Orbitron, sans-serif';
  if (enableStroke) {
    ctx.strokeStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.lineWidth = 3;
  }

  let writeIdx = 0;
  for (let i = 0; i < len; i++) {
    const t = texts[i];
    t.life += dt;
    if (t.life >= t.maxLife) continue;

    t.x += t.vx * dt;
    t.y += t.vy * dt;
    t.vy *= 0.94;
    t.vx *= 0.92;

    const progress = t.life / t.maxLife;
    t.alpha = progress > 0.65 ? (1 - progress) / 0.35 : 1;

    ctx.globalAlpha = Math.max(0, Math.min(1, t.alpha));

    if (t.isCrit) {
      ctx.font = '900 13px Orbitron, sans-serif';
    }

    if (enableStroke) {
      ctx.strokeText(t.text, t.x, t.y);
    }
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);

    if (t.isCrit) {
      ctx.font = 'bold 11px Orbitron, sans-serif';
    }

    texts[writeIdx++] = t;
  }

  texts.length = writeIdx;
  ctx.restore();
}

/**
 * Zero-allocation in-place compaction for shockwave rings.
 * Draws with batched path operations and zero shadowBlur overhead.
 */
export function drawShockwaveRings(
  ctx: CanvasRenderingContext2D,
  shockwaves: ShockwaveRing[],
  dt: number,
  useGlow: boolean
): void {
  const len = shockwaves.length;
  if (len === 0) return;

  ctx.save();
  let writeIdx = 0;

  for (let i = 0; i < len; i++) {
    const sw = shockwaves[i];
    sw.life += dt;
    if (sw.life >= sw.maxLife) continue;

    const p = sw.life / sw.maxLife;
    const easeOut = 1 - (1 - p) * (1 - p);
    const currentRadius = sw.radius + (sw.maxRadius - sw.radius) * easeOut;
    const currentAlpha = sw.alpha * (1 - p);

    ctx.globalAlpha = Math.max(0, Math.min(1, currentAlpha));
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = Math.max(0.8, sw.lineWidth * (1 - p * 0.7));

    ctx.beginPath();
    ctx.arc(sw.x, sw.y, currentRadius, 0, Math.PI * 2);
    ctx.stroke();

    shockwaves[writeIdx++] = sw;
  }

  shockwaves.length = writeIdx;
  ctx.restore();
}

/**
 * Zero-allocation in-place compaction for afterimage ghost silhouettes.
 * Streamlined single-pass drawing to guarantee 120+ FPS.
 */
export function drawAfterimageGhosts(
  ctx: CanvasRenderingContext2D,
  ghosts: AfterimageGhost[],
  dt: number,
  useGlow: boolean
): void {
  const len = ghosts.length;
  if (len === 0) return;

  ctx.save();
  let writeIdx = 0;

  for (let i = 0; i < len; i++) {
    const g = ghosts[i];
    g.life += dt;
    if (g.life >= g.maxLife) continue;

    const p = g.life / g.maxLife;
    const alpha = g.alpha * (1 - p);

    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.angle);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    // Single sleek ghost hull pass without expensive triple multi-hull overhead
    drawProceduralShipHull(ctx, g.shipModel, g.color, false);
    ctx.restore();

    ghosts[writeIdx++] = g;
  }

  ghosts.length = writeIdx;
  ctx.restore();
}

/**
 * Zero-allocation in-place compaction for weapon muzzle flashes.
 */
export function drawMuzzleFlashes(
  ctx: CanvasRenderingContext2D,
  flashes: MuzzleFlash[],
  dt: number,
  useGlow: boolean
): void {
  const len = flashes.length;
  if (len === 0) return;

  ctx.save();
  let writeIdx = 0;

  for (let i = 0; i < len; i++) {
    const mf = flashes[i];
    mf.life += dt;
    if (mf.life >= mf.maxLife) continue;

    const p = mf.life / mf.maxLife;
    const alpha = 1 - p;

    ctx.save();
    ctx.translate(mf.x, mf.y);
    ctx.rotate(mf.angle);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    // Outer plasma flare cone
    ctx.fillStyle = mf.color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(mf.size * 1.4, -mf.size * 0.5);
    ctx.lineTo(mf.size * 2, 0);
    ctx.lineTo(mf.size * 1.4, mf.size * 0.5);
    ctx.closePath();
    ctx.fill();

    // Core white blast point
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(mf.size * 0.45, 0, mf.size * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    flashes[writeIdx++] = mf;
  }

  flashes.length = writeIdx;
  ctx.restore();
}

/**
 * Render ambient atmospheric particles with camera parallax wrap-around.
 * Highly optimized: ONE single ctx.save()/restore() for all ambient particles.
 */
export function drawAmbientField(
  ctx: CanvasRenderingContext2D,
  particles: AmbientParticle[],
  cameraX: number,
  cameraY: number,
  viewWidth: number,
  viewHeight: number,
  dt: number,
  time: number
): void {
  const len = particles.length;
  if (len === 0) return;

  const margin = 180;
  const left = cameraX - margin;
  const right = cameraX + viewWidth + margin;
  const top = cameraY - margin;
  const bottom = cameraY + viewHeight + margin;
  const spanX = right - left;
  const spanY = bottom - top;

  ctx.save();

  for (let i = 0; i < len; i++) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (p.x < left) p.x += spanX;
    else if (p.x > right) p.x -= spanX;

    if (p.y < top) p.y += spanY;
    else if (p.y > bottom) p.y -= spanY;

    const pulse = Math.sin(time * 0.002 * p.pulseSpeed + p.pulsePhase);
    const alpha = Math.max(0.05, p.baseAlpha + pulse * 0.12);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;

    if (p.type === 'glyph') {
      ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
    } else if (p.type === 'crystal') {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - p.size);
      ctx.lineTo(p.x + p.size * 0.6, p.y);
      ctx.lineTo(p.x, p.y + p.size);
      ctx.lineTo(p.x - p.size * 0.6, p.y);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Render local player crosshair hit marker when dealing damage.
 */
export function drawHitMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  marker: HitMarker,
  now: number
): void {
  const elapsed = (now - marker.time) / 1000;
  if (elapsed > 0.15) return;

  const alpha = 1 - elapsed / 0.15;
  const size = marker.isKill ? 11 : 7.5;
  const color = marker.isKill ? '#ef4444' : '#ffffff';

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.strokeStyle = color;
  ctx.lineWidth = marker.isKill ? 2.5 : 1.8;
  ctx.lineCap = 'round';

  const gap = 3;
  ctx.beginPath();
  ctx.moveTo(-size, -size);
  ctx.lineTo(-gap, -gap);
  ctx.moveTo(size, -size);
  ctx.lineTo(gap, -gap);
  ctx.moveTo(-size, size);
  ctx.lineTo(-gap, gap);
  ctx.moveTo(size, size);
  ctx.lineTo(gap, gap);
  ctx.stroke();

  if (marker.isKill) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
