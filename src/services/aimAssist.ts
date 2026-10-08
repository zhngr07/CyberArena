import { Player, MapObstacle } from '../types/game.ts';

export function calculateAimAssist(
  playerX: number,
  playerY: number,
  baseAngle: number,
  enemies: Array<Partial<Player>>,
  obstacles: MapObstacle[],
  assistLevel: 'off' | 'low' | 'medium'
): number {
  if (assistLevel === 'off' || !enemies || enemies.length === 0) {
    return baseAngle;
  }

  // Angular tolerance cone in radians
  const coneRad = assistLevel === 'low' ? (18 * Math.PI) / 180 : (32 * Math.PI) / 180;
  // Maximum acquisition distance (in arena world pixels)
  const maxDistance = 450;
  // Maximum nudge fraction
  const pullFraction = assistLevel === 'low' ? 0.12 : 0.24;
  const maxPullRad = assistLevel === 'low' ? 0.08 : 0.16;

  let bestTarget: { angle: number; diff: number; dist: number } | null = null;

  for (const enemy of enemies) {
    if (!enemy || enemy.isDead || enemy.x === undefined || enemy.y === undefined) continue;
    if (enemy.stealthRemaining && enemy.stealthRemaining > 0) continue; // Respect stealth modifier

    const dx = enemy.x - playerX;
    const dy = enemy.y - playerY;
    const dist = Math.hypot(dx, dy);

    if (dist < 40 || dist > maxDistance) continue;

    const targetAngle = Math.atan2(dy, dx);
    let diff = targetAngle - baseAngle;

    // Normalize diff to [-PI, PI]
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    const absDiff = Math.abs(diff);

    if (absDiff <= coneRad) {
      if (!bestTarget || absDiff < bestTarget.diff) {
        bestTarget = { angle: targetAngle, diff, dist };
      }
    }
  }

  if (bestTarget) {
    const pull = Math.sign(bestTarget.diff) * Math.min(maxPullRad, Math.abs(bestTarget.diff) * pullFraction);
    return baseAngle + pull;
  }

  return baseAngle;
}
