import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MatchManager } from '../server/matchManager.ts';
import { UserManager } from '../server/userManager.ts';
import { MatchResult } from '../src/types/game.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DATA_DIR = path.join(__dirname, 'test_ranking_data');
const TEST_USERS_FILE = path.join(TEST_DATA_DIR, 'test_users.json');
const TEST_MATCHES_FILE = path.join(TEST_DATA_DIR, 'test_matches.json');

function cleanup() {
  try {
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
  } catch {
    // ignore
  }
}

function createRankedMatch(params: {
  id: string;
  winnerName: string | null;
  players: Array<{ name: string; isWinner: boolean; score: number }>;
  status?: 'completed' | 'draw' | 'aborted';
  mode?: 'ffa' | 'boss_raid' | 'tdm';
}): MatchResult {
  return {
    id: params.id,
    roomCode: 'RNK1',
    mode: params.mode || 'ffa',
    mapId: 'nebula_arena',
    status: params.status || 'completed',
    isRanked: (params.mode || 'ffa') === 'ffa',
    startTime: Date.now() - 60000,
    endTime: Date.now(),
    durationSeconds: 60,
    winnerId: params.winnerName ? `p_${params.winnerName}` : null,
    winnerName: params.winnerName,
    participants: params.players.map((p) => ({
      id: `p_${p.name}`,
      name: p.name,
      isBot: false,
      score: p.score,
      kills: p.score > 0 ? 5 : 0,
      deaths: 1,
      damageDealt: 500,
      shotsFired: 20,
      shotsHit: 10,
      accuracy: 50,
      assists: 0,
      killStreak: 0,
      isWinner: p.isWinner,
    })),
  };
}

describe('CyberArena Stage 0.9.3 — Рейтинговые очки (Rating Rules)', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('1. Победа изменяет рейтинг ровно на +25', () => {
    const userManager = new UserManager(TEST_USERS_FILE);
    const { user } = userManager.register('Gladiator_One', 'secret123');
    assert.equal(user.rating, 1000, 'Начальный рейтинг должен быть 1000');

    const matchManager = new MatchManager(userManager, TEST_MATCHES_FILE);
    const match = createRankedMatch({
      id: 'match_win_1',
      winnerName: 'Gladiator_One',
      players: [
        { name: 'Gladiator_One', isWinner: true, score: 1000 },
        { name: 'Opponent_Two', isWinner: false, score: 400 },
      ],
    });

    const result = matchManager.recordMatch(match);
    assert.equal(result.recorded, true);

    const updatedProfile = userManager.getProfileByUsername('Gladiator_One');
    assert.ok(updatedProfile);
    assert.equal(updatedProfile.rating, 1025, 'Рейтинг победителя должен стать ровно 1025 (+25)');
    assert.equal(updatedProfile.wins, 1);
  });

  it('2. Поражение изменяет рейтинг ровно на −15', () => {
    const userManager = new UserManager(TEST_USERS_FILE);
    const { user } = userManager.register('Defeated_Pilot', 'secret123');
    assert.equal(user.rating, 1000);

    const matchManager = new MatchManager(userManager, TEST_MATCHES_FILE);
    const match = createRankedMatch({
      id: 'match_loss_1',
      winnerName: 'Someone_Else',
      players: [
        { name: 'Defeated_Pilot', isWinner: false, score: 300 },
        { name: 'Someone_Else', isWinner: true, score: 900 },
      ],
    });

    matchManager.recordMatch(match);

    const updatedProfile = userManager.getProfileByUsername('Defeated_Pilot');
    assert.ok(updatedProfile);
    assert.equal(updatedProfile.rating, 985, 'Рейтинг проигравшего должен стать ровно 985 (-15)');
  });

  it('3. Ничья не меняет рейтинг (дельта 0); Boss Raid и Aborted также не меняют рейтинг', () => {
    const userManager = new UserManager(TEST_USERS_FILE);
    const { user } = userManager.register('Tie_Master', 'secret123');
    assert.equal(user.rating, 1000);

    const matchManager = new MatchManager(userManager, TEST_MATCHES_FILE);

    // 3a. Ничья в FFA
    const drawMatch = createRankedMatch({
      id: 'match_draw_1',
      winnerName: null,
      status: 'draw',
      players: [
        { name: 'Tie_Master', isWinner: false, score: 600 },
        { name: 'Opponent', isWinner: false, score: 600 },
      ],
    });
    matchManager.recordMatch(drawMatch);

    let profile = userManager.getProfileByUsername('Tie_Master');
    assert.ok(profile);
    assert.equal(profile.rating, 1000, 'Ничья должна давать дельту 0 (рейтинг остаётся 1000)');

    // 3b. Победа в Boss Raid (PvE рейд не является рейтинговым PvP)
    const bossMatch = createRankedMatch({
      id: 'match_boss_1',
      winnerName: 'Tie_Master',
      mode: 'boss_raid',
      players: [{ name: 'Tie_Master', isWinner: true, score: 5000 }],
    });
    bossMatch.bossDefeated = true;
    matchManager.recordMatch(bossMatch);

    profile = userManager.getProfileByUsername('Tie_Master');
    assert.ok(profile);
    assert.equal(profile.rating, 1000, 'Победа в Boss Raid НЕ должна менять PvP-рейтинг (остаётся 1000)');
    assert.equal(profile.bossRaidsDefeated, 1, 'Босс должен быть зачтён в PvE статистику');

    // 3c. Незавершённый матч (aborted)
    const abortedMatch = createRankedMatch({
      id: 'match_abort_1',
      winnerName: null,
      status: 'aborted',
      players: [{ name: 'Tie_Master', isWinner: false, score: 100 }],
    });
    matchManager.recordMatch(abortedMatch);

    profile = userManager.getProfileByUsername('Tie_Master');
    assert.ok(profile);
    assert.equal(profile.rating, 1000, 'Абортированный матч не должен менять рейтинг');
  });

  it('4. Рейтинг не становится отрицательным (минимальный рейтинг: 0)', () => {
    const userManager = new UserManager(TEST_USERS_FILE);
    userManager.register('LowRankPilot', 'pass123');

    // Искусственно устанавливаем рейтинг 10 для проверки границы
    const stored = (userManager as any).users.get('lowrankpilot');
    assert.ok(stored);
    stored.rating = 10;
    (userManager as any).saveUsers();

    const matchManager = new MatchManager(userManager, TEST_MATCHES_FILE);

    // Первое поражение: 10 - 15 = должно стать 0 (не -5)
    const loss1 = createRankedMatch({
      id: 'match_loss_floor_1',
      winnerName: 'Victor',
      players: [{ name: 'LowRankPilot', isWinner: false, score: 200 }],
    });
    matchManager.recordMatch(loss1);

    let profile = userManager.getProfileByUsername('LowRankPilot');
    assert.ok(profile);
    assert.equal(profile.rating, 0, 'Рейтинг должен быть ограничен снизу 0');

    // Второе поражение при рейтинге 0: должно остаться 0
    const loss2 = createRankedMatch({
      id: 'match_loss_floor_2',
      winnerName: 'Victor',
      players: [{ name: 'LowRankPilot', isWinner: false, score: 100 }],
    });
    matchManager.recordMatch(loss2);

    profile = userManager.getProfileByUsername('LowRankPilot');
    assert.ok(profile);
    assert.equal(profile.rating, 0, 'Рейтинг не может стать отрицательным');
  });

  it('5. Повторная обработка одного матча не начисляет очки второй раз', () => {
    const userManager = new UserManager(TEST_USERS_FILE);
    userManager.register('IdempotentPilot', 'pass123');

    const matchManager = new MatchManager(userManager, TEST_MATCHES_FILE);
    const winMatch = createRankedMatch({
      id: 'match_repeat_1',
      winnerName: 'IdempotentPilot',
      players: [{ name: 'IdempotentPilot', isWinner: true, score: 800 }],
    });

    // Первая обработка: +25 -> 1025
    const res1 = matchManager.recordMatch(winMatch);
    assert.equal(res1.recorded, true);

    let profile = userManager.getProfileByUsername('IdempotentPilot');
    assert.ok(profile);
    assert.equal(profile.rating, 1025);

    // Вторая обработка того же матча
    const res2 = matchManager.recordMatch(winMatch);
    assert.equal(res2.recorded, false);

    // Прямой вызов applyAuthoritativeMatchResult того же матча
    const applied = userManager.applyAuthoritativeMatchResult(winMatch);
    assert.equal(applied, false, 'Повторный вызов applyAuthoritativeMatchResult должен быть отвергнут');

    profile = userManager.getProfileByUsername('IdempotentPilot');
    assert.ok(profile);
    assert.equal(profile.rating, 1025, 'Рейтинг не должен измениться повторно (остаётся 1025)');
    assert.equal(profile.matchesPlayed, 1);
  });

  it('6. Клиент не может назначить себе произвольный рейтинг через API', () => {
    const userManager = new UserManager(TEST_USERS_FILE);
    const { token } = userManager.register('HackerPilot', 'secretPass');

    // Попытка передать произвольный высокий рейтинг в syncProgress
    const maliciousPayload = {
      rating: 99999,
      ratingDelta: 5000,
      matchWon: true,
      kills: 50,
      deaths: 0,
      coinsAdded: 100000,
    };

    const synced = userManager.syncProgress(token, maliciousPayload as any);
    assert.ok(synced);
    assert.equal(synced.rating, 1000, 'Рейтинг пилота остался 1000, клиент не может внедрить поддельный рейтинг');
    assert.equal(synced.kills, 0, 'Фраги не принимаются от клиента');
    assert.equal(synced.wins, 0, 'Победы не принимаются от клиента');

    const profile = userManager.getProfileByUsername('HackerPilot');
    assert.ok(profile);
    assert.equal(profile.rating, 1000);
  });

  it('7. Параллельные запросы не приводят к двойному начислению очков', async () => {
    const userManager = new UserManager(TEST_USERS_FILE);
    userManager.register('ConcurrentPilot', 'pass123');

    const matchManager = new MatchManager(userManager, TEST_MATCHES_FILE);
    const winMatch = createRankedMatch({
      id: 'match_concurrent_1',
      winnerName: 'ConcurrentPilot',
      players: [{ name: 'ConcurrentPilot', isWinner: true, score: 1200 }],
    });

    // 10 параллельных попыток записать один и тот же матч
    const results = await Promise.all([
      Promise.resolve().then(() => matchManager.recordMatch(winMatch)),
      Promise.resolve().then(() => matchManager.recordMatch(winMatch)),
      Promise.resolve().then(() => matchManager.recordMatch(winMatch)),
      Promise.resolve().then(() => matchManager.recordMatch(winMatch)),
      Promise.resolve().then(() => matchManager.recordMatch(winMatch)),
      Promise.resolve().then(() => matchManager.recordMatch(winMatch)),
      Promise.resolve().then(() => matchManager.recordMatch(winMatch)),
      Promise.resolve().then(() => matchManager.recordMatch(winMatch)),
      Promise.resolve().then(() => matchManager.recordMatch(winMatch)),
      Promise.resolve().then(() => matchManager.recordMatch(winMatch)),
    ]);

    const recordedCount = results.filter((r) => r.recorded).length;
    assert.equal(recordedCount, 1, 'Ровно один параллельный запрос должен быть записан');

    const profile = userManager.getProfileByUsername('ConcurrentPilot');
    assert.ok(profile);
    assert.equal(profile.rating, 1025, 'Рейтинг должен вырасти ровно один раз (+25 -> 1025)');
    assert.equal(profile.matchesPlayed, 1);
  });
});
