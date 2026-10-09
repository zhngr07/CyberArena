import { AccessoryType, HatType, ShipModelType, TrailType } from '../types/game.ts';

/**
 * Procedural Vector Silhouettes for ALL 25 Starships
 * Handcrafted with distinctive geometric forms, glowing inlays, and cockpits.
 */
export function drawProceduralShipHull(
  ctx: CanvasRenderingContext2D,
  shipModel: ShipModelType,
  shipColor: string,
  useGlow: boolean
): void {
  ctx.save();
  ctx.fillStyle = shipColor;
  if (useGlow) {
    ctx.shadowColor = shipColor;
    ctx.shadowBlur = 10;
  }

  switch (shipModel) {
    case 'dragon': {
      // 1. Cyber Dragon: aggressive twin forward swept wings + dual nose + dorsal spine
      ctx.beginPath();
      ctx.moveTo(25, -3);
      ctx.lineTo(25, 3);
      ctx.lineTo(14, 8);
      ctx.lineTo(-6, 23);
      ctx.lineTo(-12, 14);
      ctx.lineTo(-4, 6);
      ctx.lineTo(-17, 4);
      ctx.lineTo(-17, -4);
      ctx.lineTo(-4, -6);
      ctx.lineTo(-12, -14);
      ctx.lineTo(-6, -23);
      ctx.lineTo(14, -8);
      ctx.closePath();
      ctx.fill();

      // Wing glow vanes
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(10, 6);
      ctx.lineTo(-4, 18);
      ctx.moveTo(10, -6);
      ctx.lineTo(-4, -18);
      ctx.stroke();
      break;
    }

    case 'raven': {
      // 2. Stealth Raven: faceted angular jet with delta wingtips
      ctx.beginPath();
      ctx.moveTo(26, 0);
      ctx.lineTo(6, 18);
      ctx.lineTo(-15, 15);
      ctx.lineTo(-6, 5);
      ctx.lineTo(-19, 0);
      ctx.lineTo(-6, -5);
      ctx.lineTo(-15, -15);
      ctx.lineTo(6, -18);
      ctx.closePath();
      ctx.fill();

      // Stealth facet edge lines
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(26, 0);
      ctx.lineTo(-6, 0);
      ctx.moveTo(6, 18);
      ctx.lineTo(-6, 0);
      ctx.moveTo(6, -18);
      ctx.lineTo(-6, 0);
      ctx.stroke();
      break;
    }

    case 'dreadnought': {
      // 3. Heavy Dreadnought: hexagonal heavy armor juggernaut with side weapon sponsons
      ctx.beginPath();
      ctx.moveTo(22, -10);
      ctx.lineTo(22, 10);
      ctx.lineTo(9, 21);
      ctx.lineTo(-16, 17);
      ctx.lineTo(-21, 0);
      ctx.lineTo(-16, -17);
      ctx.lineTo(9, -21);
      ctx.closePath();
      ctx.fill();

      // Heavy weapon sponson pods
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, -20, 14, 5);
      ctx.fillRect(4, 15, 14, 5);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(17, -19, 3, 3);
      ctx.fillRect(17, 16, 3, 3);
      break;
    }

    case 'ufo': {
      // 4. Quantum UFO: spinning ring and central disc
      const spin = (performance.now() * 0.003) % (Math.PI * 2);
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();

      // Outer rotating ring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 23, 0, Math.PI * 2);
      ctx.stroke();

      // 4 rotating quantum emitters
      for (let i = 0; i < 4; i++) {
        const ang = spin + (i * Math.PI) / 2;
        const ex = Math.cos(ang) * 23;
        const ey = Math.sin(ang) * 23;
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(ex, ey, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'phoenix': {
      // 5. Solar Phoenix: sweeping curved fiery wings
      ctx.beginPath();
      ctx.moveTo(27, 0);
      ctx.lineTo(9, 13);
      ctx.lineTo(-3, 26);
      ctx.lineTo(-16, 19);
      ctx.lineTo(-8, 6);
      ctx.lineTo(-19, 0);
      ctx.lineTo(-8, -6);
      ctx.lineTo(-16, -19);
      ctx.lineTo(-3, -26);
      ctx.lineTo(9, -13);
      ctx.closePath();
      ctx.fill();

      // Golden solar wing borders
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(27, 0);
      ctx.lineTo(-3, 26);
      ctx.moveTo(27, 0);
      ctx.lineTo(-3, -26);
      ctx.stroke();
      break;
    }

    case 'viper': {
      // 6. Toxic Viper: sharp needle nose with flared tail
      ctx.beginPath();
      ctx.moveTo(29, 0);
      ctx.lineTo(3, 8);
      ctx.lineTo(-10, 21);
      ctx.lineTo(-18, 15);
      ctx.lineTo(-12, 4);
      ctx.lineTo(-17, 0);
      ctx.lineTo(-12, -4);
      ctx.lineTo(-18, -15);
      ctx.lineTo(-10, -21);
      ctx.lineTo(3, -8);
      ctx.closePath();
      ctx.fill();

      // Twin fang laser guides
      ctx.strokeStyle = '#a3e635';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(29, -2);
      ctx.lineTo(34, -2);
      ctx.moveTo(29, 2);
      ctx.lineTo(34, 2);
      ctx.stroke();
      break;
    }

    case 'specter': {
      // 7. Void Specter: ethereal curved ghost silhouette
      ctx.beginPath();
      ctx.moveTo(23, 0);
      ctx.lineTo(13, 16);
      ctx.lineTo(-8, 19);
      ctx.lineTo(-4, 9);
      ctx.lineTo(-19, 13);
      ctx.lineTo(-13, 0);
      ctx.lineTo(-19, -13);
      ctx.lineTo(-4, -9);
      ctx.lineTo(-8, -19);
      ctx.lineTo(13, -16);
      ctx.closePath();
      ctx.fill();

      // Hollow phase core
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(-2, 0, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'titan': {
      // 8. Siege Titan: massive armored wedge
      ctx.beginPath();
      ctx.moveTo(19, -15);
      ctx.lineTo(23, 0);
      ctx.lineTo(19, 15);
      ctx.lineTo(-18, 19);
      ctx.lineTo(-25, 9);
      ctx.lineTo(-21, 0);
      ctx.lineTo(-25, -9);
      ctx.lineTo(-18, -19);
      ctx.closePath();
      ctx.fill();

      // Frontal ram shield line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(19, -15);
      ctx.lineTo(23, 0);
      ctx.lineTo(19, 15);
      ctx.stroke();
      break;
    }

    case 'valkyrie': {
      // 9. Valkyrie: high-speed twin-fin fighter with dual vertical stabilizing rudders
      ctx.beginPath();
      ctx.moveTo(27, 0);
      ctx.lineTo(5, 10);
      ctx.lineTo(-8, 23);
      ctx.lineTo(-17, 13);
      ctx.lineTo(-11, 0);
      ctx.lineTo(-17, -13);
      ctx.lineTo(-8, -23);
      ctx.lineTo(5, -10);
      ctx.closePath();
      ctx.fill();

      // Twin stabilizer rudders
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-2, 12);
      ctx.lineTo(-14, 18);
      ctx.moveTo(-2, -12);
      ctx.lineTo(-14, -18);
      ctx.stroke();
      break;
    }

    case 'interceptor': {
      // 10. Interceptor: needle-nosed dart with quadruple aerodynamic fins
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(10, 6);
      ctx.lineTo(-4, 20);
      ctx.lineTo(-16, 16);
      ctx.lineTo(-9, 0);
      ctx.lineTo(-16, -16);
      ctx.lineTo(-4, -20);
      ctx.lineTo(10, -6);
      ctx.closePath();
      ctx.fill();

      // Quad fin trim
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(0, 12);
      ctx.moveTo(18, 0);
      ctx.lineTo(0, -12);
      ctx.stroke();
      break;
    }

    case 'nebula': {
      // 11. Nebula: cosmic crystalline 6-pointed prism vessel
      ctx.beginPath();
      ctx.moveTo(26, 0);
      ctx.lineTo(12, 14);
      ctx.lineTo(0, 24);
      ctx.lineTo(-14, 16);
      ctx.lineTo(-20, 0);
      ctx.lineTo(-14, -16);
      ctx.lineTo(0, -24);
      ctx.lineTo(12, -14);
      ctx.closePath();
      ctx.fill();

      // Crystal facet inner diamond
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(0, 12);
      ctx.lineTo(-10, 0);
      ctx.lineTo(0, -12);
      ctx.closePath();
      ctx.stroke();
      break;
    }

    case 'hyperion': {
      // 12. Hyperion: grand majestic crown wings with twin command spires
      ctx.beginPath();
      ctx.moveTo(27, 0);
      ctx.lineTo(15, 15);
      ctx.lineTo(3, 25);
      ctx.lineTo(-14, 21);
      ctx.lineTo(-9, 8);
      ctx.lineTo(-21, 0);
      ctx.lineTo(-9, -8);
      ctx.lineTo(-14, -21);
      ctx.lineTo(3, -25);
      ctx.lineTo(15, -15);
      ctx.closePath();
      ctx.fill();

      // Regal crown trim
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(27, 0);
      ctx.lineTo(15, 15);
      ctx.lineTo(3, 25);
      ctx.moveTo(27, 0);
      ctx.lineTo(15, -15);
      ctx.lineTo(3, -25);
      ctx.stroke();
      break;
    }

    case 'chronos': {
      // 13. Chronos: time-warp singularity diamond with dual temporal arcs
      ctx.beginPath();
      ctx.moveTo(28, 0);
      ctx.lineTo(0, 20);
      ctx.lineTo(-23, 0);
      ctx.lineTo(0, -20);
      ctx.closePath();
      ctx.fill();

      // Rotating temporal arc
      const timeAngle = (performance.now() * 0.002) % (Math.PI * 2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 10, timeAngle, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'eclipse': {
      // 14. Eclipse: crescent-moon scythe hull with dark-matter energy intake
      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.lineTo(26, 18);
      ctx.lineTo(4, 22);
      ctx.lineTo(-16, 14);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-16, -14);
      ctx.lineTo(4, -22);
      ctx.lineTo(26, -18);
      ctx.closePath();
      ctx.fill();

      // Dark matter inner void
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(-2, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'vortex': {
      // 15. Vortex: spiral kinetic interceptor with vortex blade strakes
      ctx.beginPath();
      ctx.moveTo(28, 0);
      ctx.lineTo(12, 14);
      ctx.lineTo(-8, 22);
      ctx.lineTo(-18, 12);
      ctx.lineTo(-12, 0);
      ctx.lineTo(-18, -12);
      ctx.lineTo(-8, -22);
      ctx.lineTo(12, -14);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 1.5);
      ctx.stroke();
      break;
    }

    case 'aurora': {
      // 16. Aurora: organic curved manta-ray wings with shimmering edges
      ctx.beginPath();
      ctx.moveTo(25, 0);
      ctx.quadraticCurveTo(12, 14, -2, 26);
      ctx.lineTo(-16, 18);
      ctx.lineTo(-8, 6);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-8, -6);
      ctx.lineTo(-16, -18);
      ctx.quadraticCurveTo(12, -14, 25, 0);
      ctx.closePath();
      ctx.fill();

      // Iridescent edge glow
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }

    case 'chimera': {
      // 17. Chimera: triple-hull attack corvette with dual outriggers
      // Central hull
      ctx.beginPath();
      ctx.moveTo(26, 0);
      ctx.lineTo(10, 6);
      ctx.lineTo(-18, 5);
      ctx.lineTo(-18, -5);
      ctx.lineTo(10, -6);
      ctx.closePath();
      ctx.fill();
      // Outriggers
      ctx.fillRect(0, -18, 16, 5);
      ctx.fillRect(0, 13, 16, 5);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, -18, 16, 5);
      ctx.strokeRect(0, 13, 16, 5);
      break;
    }

    case 'tempest': {
      // 18. Tempest: storm-chaser fighter with forward jagged lightning prongs
      ctx.beginPath();
      ctx.moveTo(29, -4);
      ctx.lineTo(24, 0);
      ctx.lineTo(29, 4);
      ctx.lineTo(12, 10);
      ctx.lineTo(-6, 24);
      ctx.lineTo(-15, 14);
      ctx.lineTo(-7, 4);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-7, -4);
      ctx.lineTo(-15, -14);
      ctx.lineTo(-6, -24);
      ctx.lineTo(12, -10);
      ctx.closePath();
      ctx.fill();

      // Jagged conductor lines
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(29, -4);
      ctx.lineTo(10, 0);
      ctx.lineTo(29, 4);
      ctx.stroke();
      break;
    }

    case 'pulsar': {
      // 19. Pulsar: dual-fuselage catamaran fighter with glowing central plasma bridge
      // Port hull
      ctx.beginPath();
      ctx.moveTo(25, -9);
      ctx.lineTo(-15, -17);
      ctx.lineTo(-8, -9);
      ctx.lineTo(-15, -4);
      ctx.closePath();
      ctx.fill();

      // Starboard hull
      ctx.beginPath();
      ctx.moveTo(25, 9);
      ctx.lineTo(-15, 4);
      ctx.lineTo(-8, 9);
      ctx.lineTo(-15, 17);
      ctx.closePath();
      ctx.fill();

      // Central plasma bridge
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(0, -6, 8, 12);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, -6, 8, 12);
      break;
    }

    case 'scythe': {
      // 20. Scythe: curved forward claws
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(25, 14);
      ctx.lineTo(5, 16);
      ctx.lineTo(-15, 12);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-15, -12);
      ctx.lineTo(5, -16);
      ctx.lineTo(25, -14);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }

    case 'kraken': {
      // 21. Kraken: heavy biomechanical titan with 6 swept plasma fins
      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.lineTo(15, 16);
      ctx.lineTo(0, 24);
      ctx.lineTo(-12, 18);
      ctx.lineTo(-18, 10);
      ctx.lineTo(-12, 0);
      ctx.lineTo(-18, -10);
      ctx.lineTo(-12, -18);
      ctx.lineTo(0, -24);
      ctx.lineTo(15, -16);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }

    case 'solaris': {
      // 22. Solaris: radiating sun-burst fighter with 8 angular solar sails
      ctx.beginPath();
      ctx.moveTo(27, 0);
      ctx.lineTo(14, 13);
      ctx.lineTo(0, 24);
      ctx.lineTo(-12, 20);
      ctx.lineTo(-19, 0);
      ctx.lineTo(-12, -20);
      ctx.lineTo(0, -24);
      ctx.lineTo(14, -13);
      ctx.closePath();
      ctx.fill();

      // Radiating solar sails
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * 25, Math.sin(ang) * 25);
        ctx.stroke();
      }
      break;
    }

    case 'abyss': {
      // 23. Abyss: dark matter singularity diamond
      ctx.beginPath();
      ctx.moveTo(27, 0);
      ctx.lineTo(0, 19);
      ctx.lineTo(-22, 0);
      ctx.lineTo(0, -19);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }

    case 'sentinel': {
      // 24. Sentinel: hexagonal defense battlestar with reinforced bow
      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.lineTo(14, 15);
      ctx.lineTo(-8, 20);
      ctx.lineTo(-20, 12);
      ctx.lineTo(-16, 0);
      ctx.lineTo(-20, -12);
      ctx.lineTo(-8, -20);
      ctx.lineTo(14, -15);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }

    case 'phantom':
    default: {
      // 25. Standard Phantom: sleek delta arrowhead fighter with swept back stabilizers
      ctx.beginPath();
      ctx.moveTo(25, 0);
      ctx.lineTo(-14, -17);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-14, 17);
      ctx.closePath();
      ctx.fill();

      // Wing trim lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-8, -10);
      ctx.moveTo(14, 0);
      ctx.lineTo(-8, 10);
      ctx.stroke();
      break;
    }
  }

  // Universal glowing cockpit canopy
  ctx.fillStyle = '#ffffff';
  if (useGlow) ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(2, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Procedural Hats & Headgear
 */
export function drawShipHats(
  ctx: CanvasRenderingContext2D,
  hat: HatType,
  useGlow: boolean
): void {
  if (!hat || hat === 'none') return;

  ctx.save();
  if (useGlow) {
    ctx.shadowBlur = 8;
  }

  switch (hat) {
    case 'crown': {
      ctx.fillStyle = '#facc15';
      if (useGlow) ctx.shadowColor = '#facc15';
      ctx.beginPath();
      ctx.moveTo(6, -9);
      ctx.lineTo(12, -13);
      ctx.lineTo(8, -4);
      ctx.lineTo(14, 0);
      ctx.lineTo(8, 4);
      ctx.lineTo(12, 13);
      ctx.lineTo(6, 9);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'visor':
    case 'cyber_shades':
    case 'pilot_goggles': {
      ctx.fillStyle = '#22d3ee';
      if (useGlow) ctx.shadowColor = '#22d3ee';
      ctx.fillRect(0, -7, 6, 14);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, -7, 6, 14);
      break;
    }

    case 'horns':
    case 'neon_horns': {
      ctx.fillStyle = '#f43f5e';
      if (useGlow) ctx.shadowColor = '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(10, -19);
      ctx.lineTo(4, -8);
      ctx.moveTo(0, 10);
      ctx.lineTo(10, 19);
      ctx.lineTo(4, 8);
      ctx.fill();
      break;
    }

    case 'halo': {
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.5;
      if (useGlow) ctx.shadowColor = '#fde047';
      ctx.beginPath();
      ctx.ellipse(3, 0, 15, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'samurai':
    case 'imperial_helm': {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      if (useGlow) ctx.shadowColor = '#facc15';
      ctx.beginPath();
      ctx.arc(5, 0, 11, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(12, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'headset': {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      if (useGlow) ctx.shadowColor = '#06b6d4';
      ctx.beginPath();
      ctx.arc(0, 0, 15, -Math.PI * 0.7, Math.PI * 0.7);
      ctx.stroke();
      // Mic boom
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(10, 12);
      ctx.stroke();
      break;
    }

    case 'viking_helmet': {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-2, -12);
      ctx.lineTo(6, -20);
      ctx.moveTo(-2, 12);
      ctx.lineTo(6, 20);
      ctx.stroke();
      break;
    }

    case 'golden_monocle': {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(6, -4, 4, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'ninja_headband': {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-6, -4, 4, 8);
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-20, 6);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-22, -6);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'pirate_tricorne': {
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(0, -11);
      ctx.lineTo(-9, 0);
      ctx.lineTo(0, 11);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'plasma_antennae': {
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(2, -8);
      ctx.lineTo(12, -16);
      ctx.moveTo(2, 8);
      ctx.lineTo(12, 16);
      ctx.stroke();
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(12, -16, 2.5, 0, Math.PI * 2);
      ctx.arc(12, 16, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'cyber_mask': {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(4, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, -3, 2, 2);
      ctx.fillRect(4, 1, 2, 2);
      break;
    }

    case 'quantum_hood': {
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 12, -Math.PI * 0.7, Math.PI * 0.7);
      ctx.stroke();
      break;
    }

    default:
      break;
  }

  ctx.restore();
}

/**
 * Procedural Accessories (Wings, Drones, Auras, Tails, Generators)
 */
export function drawShipAccessories(
  ctx: CanvasRenderingContext2D,
  accessory: AccessoryType | undefined,
  shipColor: string,
  isDashing: boolean,
  now: number,
  useGlow: boolean
): void {
  if (!accessory || accessory === 'none') return;

  ctx.save();

  switch (accessory) {
    case 'energy_wings': {
      // Radiant energy wings on flanks with pulsating feather tips
      const wingFlare = isDashing ? 1.4 : 1.0 + Math.sin(now * 0.006) * 0.15;
      ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      if (useGlow) {
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      ctx.moveTo(5, 10);
      ctx.lineTo(-2, 34 * wingFlare);
      ctx.lineTo(-18, 26 * wingFlare);
      ctx.lineTo(-11, 10);
      ctx.moveTo(5, -10);
      ctx.lineTo(-2, -34 * wingFlare);
      ctx.lineTo(-18, -26 * wingFlare);
      ctx.lineTo(-11, -10);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'orbit_drone': {
      // Orbiting satellite drone spinning around the player at a 34px radius
      const droneAngle = (now * 0.003) % (Math.PI * 2);
      const dx = Math.cos(droneAngle) * 34;
      const dy = Math.sin(droneAngle) * 34;
      ctx.fillStyle = '#a855f7';
      if (useGlow) {
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.arc(dx, dy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Laser guide line to ship
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(dx, dy);
      ctx.stroke();
      break;
    }

    case 'cyber_tail': {
      // Kinetic undulating segmented tail
      ctx.strokeStyle = shipColor || '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      const wave1 = Math.sin(now * 0.008) * 6;
      const wave2 = Math.sin(now * 0.008 + 1) * 9;
      const wave3 = Math.sin(now * 0.008 + 2) * 12;
      ctx.lineTo(-24, wave1);
      ctx.lineTo(-32, wave2);
      ctx.lineTo(-40, wave3);
      ctx.stroke();
      // Tail blade
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(-40, wave3, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'ring_of_fire': {
      // Radiant fire ring
      const ringAngle = (now * 0.002) % (Math.PI * 2);
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 14, ringAngle, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'nano_shield_aura': {
      // Shimmering nano shield aura
      const pulse = 24 + Math.sin(now * 0.005) * 4;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 2;
      if (useGlow) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
      }
      ctx.beginPath();
      ctx.arc(0, 0, pulse, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'plasma_fins': {
      // Aerodynamic spoiler fins with neon edge glow
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -12);
      ctx.lineTo(-24, -22);
      ctx.moveTo(-10, 12);
      ctx.lineTo(-24, 22);
      ctx.stroke();
      break;
    }

    case 'quantum_spikes': {
      // Sharp energy spikes protruding from the ship
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, -16);
      ctx.lineTo(16, -24);
      ctx.moveTo(8, 16);
      ctx.lineTo(16, 24);
      ctx.stroke();
      break;
    }

    case 'photon_cape': {
      // Flowing energy particle mesh trailing the ship
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -10);
      ctx.quadraticCurveTo(-25, Math.sin(now * 0.006) * 8, -36, 0);
      ctx.quadraticCurveTo(-25, -Math.sin(now * 0.006) * 8, -10, 10);
      ctx.stroke();
      break;
    }

    case 'holo_emblem': {
      // Floating rotating hologram crest
      const rot = (now * 0.002) % (Math.PI * 2);
      ctx.save();
      ctx.translate(0, 0);
      ctx.rotate(rot);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-8, -8, 16, 16);
      ctx.restore();
      break;
    }

    case 'warp_crystal': {
      // Glowing warp crystal
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, 7);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'satellite_dish': {
      // Orbital communications dish
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-8, -10, 6, Math.PI * 0.2, Math.PI * 1.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-8, -10);
      ctx.lineTo(-4, -14);
      ctx.stroke();
      break;
    }

    default:
      break;
  }

  ctx.restore();
}

/**
 * Procedural Configuration for ALL Engine Trails
 */
export function getTrailParticleStyle(trailType: TrailType | string): {
  color: string;
  size: number;
  type: 'spark' | 'smoke' | 'matrix' | 'star';
} {
  switch (trailType) {
    case 'fire':
      return {
        color: Math.random() > 0.4 ? '#f97316' : '#ef4444',
        size: 3.5 + Math.random() * 4,
        type: 'smoke',
      };

    case 'lightning':
      return {
        color: Math.random() > 0.5 ? '#38bdf8' : '#e0e7ff',
        size: 2.2 + Math.random() * 3,
        type: 'spark',
      };

    case 'rainbow': {
      const hues = [0, 45, 120, 190, 280, 320];
      return {
        color: `hsl(${hues[Math.floor(Math.random() * hues.length)]}, 100%, 65%)`,
        size: 2.5 + Math.random() * 3,
        type: 'spark',
      };
    }

    case 'matrix':
      return {
        color: '#22c55e',
        size: 2.5 + Math.random() * 2.5,
        type: 'matrix',
      };

    case 'stars':
    case 'solar_gold':
      return {
        color: Math.random() > 0.5 ? '#fbbf24' : '#f59e0b',
        size: 2.5 + Math.random() * 3.5,
        type: 'star',
      };

    case 'plasma_purple':
      return {
        color: Math.random() > 0.5 ? '#a855f7' : '#c084fc',
        size: 3.5 + Math.random() * 3.5,
        type: 'smoke',
      };

    case 'quantum_cyan':
      return {
        color: '#22d3ee',
        size: 2.5 + Math.random() * 3.5,
        type: 'spark',
      };

    case 'toxic_acid':
      return {
        color: '#84cc16',
        size: 3 + Math.random() * 3.5,
        type: 'smoke',
      };

    case 'hyperdrive_red':
      return {
        color: '#f43f5e',
        size: 2.5 + Math.random() * 4,
        type: 'spark',
      };

    case 'void_blackhole':
      return {
        color: Math.random() > 0.6 ? '#6366f1' : '#1e1b4b',
        size: 4 + Math.random() * 4,
        type: 'smoke',
      };

    case 'ice_comet':
      return {
        color: Math.random() > 0.5 ? '#bae6fd' : '#e0f2fe',
        size: 2.2 + Math.random() * 3,
        type: 'spark',
      };

    case 'bubble_neon':
      return {
        color: Math.random() > 0.5 ? '#ec4899' : '#06b6d4',
        size: 3.5 + Math.random() * 4,
        type: 'smoke',
      };

    case 'glitch_binary':
      return {
        color: Math.random() > 0.5 ? '#06b6d4' : '#f43f5e',
        size: 2.8 + Math.random() * 3,
        type: 'matrix',
      };

    case 'cherry_blossom':
      return {
        color: Math.random() > 0.5 ? '#f472b6' : '#fbcfe8',
        size: 3 + Math.random() * 3,
        type: 'star',
      };

    case 'default':
    default:
      return {
        color: '#38bdf8',
        size: 2.2 + Math.random() * 2.8,
        type: 'spark',
      };
  }
}
