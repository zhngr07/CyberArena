import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { AddressInfo } from 'net';
import { createCyberArenaApp } from '../server.ts';
import { UserManager } from '../server/userManager.ts';
import { MatchManager } from '../server/matchManager.ts';
import { MatchResult } from '../src/types/game.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DATA_DIR = path.join(__dirname, 'test_api_data');
const TEST_USERS_FILE = path.join(TEST_DATA_DIR, 'api_users.json');
const TEST_MATCHES_FILE = path.join(TEST_DATA_DIR, 'api_matches.json');

function cleanup() {
  try {
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
  } catch {
    // ignore
  }
}

function createTestMatch(params: {
  id: string;
  winnerName: string | null;
  players: Array<{
    name: string;
    isWinner: boolean;
    score: number;
    kills?: number;
    deaths?: number;
    damageDealt?: number;
    shotsFired?: number;
    shotsHit?: number;
    accuracy?: number;
  }>;
  status?: 'completed' | 'draw' | 'aborted';
  mode?: 'ffa' | 'boss_raid' | 'tdm';
}): MatchResult {
  return {
    id: params.id,
    roomCode: 'TEST',
    mode: params.mode || 'ffa',
    mapId: 'arena',
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
      kills: p.kills ?? (p.score > 0 ? 5 : 0),
      deaths: p.deaths ?? 1,
      damageDealt: p.damageDealt ?? 500,
      shotsFired: p.shotsFired ?? 20,
      shotsHit: p.shotsHit ?? 10,
      accuracy: p.accuracy ?? 50,
      assists: 0,
      killStreak: 0,
      isWinner: p.isWinner,
    })),
  };
}

interface TestServerContext {
  userManager: UserManager;
  matchManager: MatchManager;
  server: import('http').Server;
  baseUrl: string;
  close: () => Promise<void>;
}

async function startTestServer(options?: { skipSeed?: boolean }): Promise<TestServerContext> {
  const userManager = new UserManager(TEST_USERS_FILE, { skipSeed: options?.skipSeed });
  const matchManager = new MatchManager(userManager, TEST_MATCHES_FILE);
  const { server, wss } = createCyberArenaApp({ userManager, matchManager });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const addr = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  return {
    userManager,
    matchManager,
    server,
    baseUrl,
    close: () =>
      new Promise<void>((resolve, reject) => {
        try {
          wss.close();
        } catch {
          // ignore
        }
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

describe('CyberArena Stage 0.9.4 — API рейтинга, статистики и таблицы лидеров', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('1. Авторизация: GET /api/stats/me и /api/rating/me отклоняют запросы без токена (401)', async () => {
    const ctx = await startTestServer();
    try {
      const resStatsNoAuth = await fetch(`${ctx.baseUrl}/api/stats/me`);
      assert.equal(resStatsNoAuth.status, 401, 'Без токена должен возвращаться статус 401');
      const dataStats = await resStatsNoAuth.json();
      assert.equal(dataStats.success, false);
      assert.ok(dataStats.error);

      const resStatsBadAuth = await fetch(`${ctx.baseUrl}/api/stats/me`, {
        headers: { Authorization: 'Bearer fake_invalid_token_999' },
      });
      assert.equal(resStatsBadAuth.status, 401, 'С недействительным токеном должен возвращаться статус 401');

      const resRatingNoAuth = await fetch(`${ctx.baseUrl}/api/rating/me`);
      assert.equal(resRatingNoAuth.status, 401);
      const dataRating = await resRatingNoAuth.json();
      assert.equal(dataRating.success, false);
    } finally {
      await ctx.close();
    }
  });

  it('2. Авторизация: GET /api/stats/me и /api/rating/me возвращают данные авторизованного игрока (200)', async () => {
    const ctx = await startTestServer();
    try {
      const reg = ctx.userManager.register('Vanguard_Pilot', 'secure_pass123');
      const token = reg.token;

      // GET /api/stats/me
      const resStats = await fetch(`${ctx.baseUrl}/api/stats/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(resStats.status, 200);
      const dataStats = await resStats.json();
      assert.equal(dataStats.success, true);
      assert.equal(dataStats.pilot.username, 'Vanguard_Pilot');
      assert.equal(dataStats.pilot.rating, 1000);
      assert.equal(dataStats.pilot.rankTier, 'veteran');
      assert.equal(typeof dataStats.pilot.globalRank, 'number');
      assert.equal(dataStats.rating.current, 1000);

      // GET /api/rating/me
      const resRating = await fetch(`${ctx.baseUrl}/api/rating/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(resRating.status, 200);
      const dataRating = await resRating.json();
      assert.equal(dataRating.success, true);
      assert.equal(dataRating.username, 'Vanguard_Pilot');
      assert.equal(dataRating.rating, 1000);
      assert.equal(dataRating.rankTier, 'veteran');
      assert.ok(dataRating.globalRank >= 1);
    } finally {
      await ctx.close();
    }
  });

  it('3. Сортировка: Таблица лидеров отсортирована строго по рейтингу (DESC)', async () => {
    const ctx = await startTestServer({ skipSeed: true });
    try {
      ctx.userManager.register('Pilot_Low', 'pass123'); // rating 1000
      ctx.userManager.register('Pilot_Mid', 'pass123'); // rating 1000
      ctx.userManager.register('Pilot_High', 'pass123'); // rating 1000

      // Назначаем им авторские рейтинги через результат матча
      const match = createTestMatch({
        id: 'match_sort_test',
        winnerName: 'Pilot_High',
        players: [
          { name: 'Pilot_High', isWinner: true, score: 1000, kills: 5, deaths: 0 },
          { name: 'Pilot_Low', isWinner: false, score: 100, kills: 0, deaths: 5 },
        ],
      });
      ctx.matchManager.recordMatch(match);

      const res = await fetch(`${ctx.baseUrl}/api/leaderboard`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.leaderboard.length, 3);

      // Pilot_High should have 1025 (+25), Pilot_Mid 1000, Pilot_Low 985 (-15)
      assert.equal(data.leaderboard[0].username, 'Pilot_High');
      assert.equal(data.leaderboard[0].rating, 1025);
      assert.equal(data.leaderboard[0].rank, 1);
      assert.equal(data.leaderboard[0].globalRank, 1);

      assert.equal(data.leaderboard[1].username, 'Pilot_Mid');
      assert.equal(data.leaderboard[1].rating, 1000);
      assert.equal(data.leaderboard[1].rank, 2);

      assert.equal(data.leaderboard[2].username, 'Pilot_Low');
      assert.equal(data.leaderboard[2].rating, 985);
      assert.equal(data.leaderboard[2].rank, 3);
    } finally {
      await ctx.close();
    }
  });

  it('4. Пагинация: Корректное разбиение на страницы с параметрами page и limit', async () => {
    const ctx = await startTestServer({ skipSeed: true });
    try {
      for (let i = 1; i <= 5; i++) {
        ctx.userManager.register(`Racer_${i}`, 'pass123');
      }

      // Страница 1 с limit=2
      const resPage1 = await fetch(`${ctx.baseUrl}/api/leaderboard?page=1&limit=2`);
      assert.equal(resPage1.status, 200);
      const dataPage1 = await resPage1.json();
      assert.equal(dataPage1.leaderboard.length, 2);
      assert.equal(dataPage1.leaderboard[0].rank, 1);
      assert.equal(dataPage1.leaderboard[1].rank, 2);
      assert.equal(dataPage1.pagination.page, 1);
      assert.equal(dataPage1.pagination.limit, 2);
      assert.equal(dataPage1.pagination.total, 5);
      assert.equal(dataPage1.pagination.totalPages, 3);
      assert.equal(dataPage1.pagination.hasNext, true);
      assert.equal(dataPage1.pagination.hasPrev, false);

      // Страница 2 с limit=2
      const resPage2 = await fetch(`${ctx.baseUrl}/api/leaderboard?page=2&limit=2`);
      assert.equal(resPage2.status, 200);
      const dataPage2 = await resPage2.json();
      assert.equal(dataPage2.leaderboard.length, 2);
      assert.equal(dataPage2.leaderboard[0].rank, 3);
      assert.equal(dataPage2.leaderboard[1].rank, 4);
      assert.equal(dataPage2.pagination.page, 2);
      assert.equal(dataPage2.pagination.hasNext, true);
      assert.equal(dataPage2.pagination.hasPrev, true);

      // Страница 3 с limit=2 (последняя)
      const resPage3 = await fetch(`${ctx.baseUrl}/api/leaderboard?page=3&limit=2`);
      assert.equal(resPage3.status, 200);
      const dataPage3 = await resPage3.json();
      assert.equal(dataPage3.leaderboard.length, 1);
      assert.equal(dataPage3.leaderboard[0].rank, 5);
      assert.equal(dataPage3.pagination.hasNext, false);
      assert.equal(dataPage3.pagination.hasPrev, true);

      // Страница за пределами (page=99)
      const resPageOut = await fetch(`${ctx.baseUrl}/api/leaderboard?page=99&limit=2`);
      assert.equal(resPageOut.status, 200);
      const dataOut = await resPageOut.json();
      assert.equal(dataOut.leaderboard.length, 0);
      assert.equal(dataOut.pagination.page, 99);
      assert.equal(dataOut.pagination.hasNext, false);
    } finally {
      await ctx.close();
    }
  });

  it('5. Пустой список: База без записей и поиск без совпадений возвращают пустой список с корректным JSON', async () => {
    const ctx = await startTestServer({ skipSeed: true });
    try {
      // База полностью пустая
      const resEmpty = await fetch(`${ctx.baseUrl}/api/leaderboard`);
      assert.equal(resEmpty.status, 200);
      const dataEmpty = await resEmpty.json();
      assert.equal(dataEmpty.success, true);
      assert.deepEqual(dataEmpty.leaderboard, []);
      assert.equal(dataEmpty.pagination.total, 0);
      assert.equal(dataEmpty.pagination.totalPages, 0);
      assert.equal(dataEmpty.pagination.hasNext, false);
      assert.equal(dataEmpty.pagination.hasPrev, false);

      // Регистрируем одного игрока
      ctx.userManager.register('Lone_Star', 'pass123');

      // Поиск без совпадений
      const resNoMatch = await fetch(`${ctx.baseUrl}/api/leaderboard?search=NonExistentGhost999`);
      assert.equal(resNoMatch.status, 200);
      const dataNoMatch = await resNoMatch.json();
      assert.equal(dataNoMatch.success, true);
      assert.deepEqual(dataNoMatch.leaderboard, []);
      assert.equal(dataNoMatch.pagination.total, 0);
    } finally {
      await ctx.close();
    }
  });

  it('6. Поиск по имени: Параметр search фильтрует по подстроке и сохраняет globalRank', async () => {
    const ctx = await startTestServer({ skipSeed: true });
    try {
      ctx.userManager.register('Cyber_Ace', 'pass123');
      ctx.userManager.register('Shadow_Hunter', 'pass123');
      ctx.userManager.register('Cyber_Titan', 'pass123');

      const res = await fetch(`${ctx.baseUrl}/api/leaderboard?search=cyber`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.leaderboard.length, 2);
      assert.ok(data.leaderboard.every((p: any) => p.username.toLowerCase().includes('cyber')));

      // Поиск через алиас 'q'
      const resQ = await fetch(`${ctx.baseUrl}/api/leaderboard?q=hunter`);
      assert.equal(resQ.status, 200);
      const dataQ = await resQ.json();
      assert.equal(dataQ.leaderboard.length, 1);
      assert.equal(dataQ.leaderboard[0].username, 'Shadow_Hunter');
    } finally {
      await ctx.close();
    }
  });

  it('7. Валидация параметров: Неверные параметры пагинации и поиска возвращают 400 Bad Request', async () => {
    const ctx = await startTestServer();
    try {
      // page <= 0
      const resPageZero = await fetch(`${ctx.baseUrl}/api/leaderboard?page=0`);
      assert.equal(resPageZero.status, 400);
      assert.equal((await resPageZero.json()).success, false);

      const resPageNeg = await fetch(`${ctx.baseUrl}/api/leaderboard?page=-3`);
      assert.equal(resPageNeg.status, 400);

      const resPageStr = await fetch(`${ctx.baseUrl}/api/leaderboard?page=abc`);
      assert.equal(resPageStr.status, 400);

      // limit <= 0 or > 100
      const resLimitZero = await fetch(`${ctx.baseUrl}/api/leaderboard?limit=0`);
      assert.equal(resLimitZero.status, 400);

      const resLimitTooHigh = await fetch(`${ctx.baseUrl}/api/leaderboard?limit=101`);
      assert.equal(resLimitTooHigh.status, 400);

      const resLimitStr = await fetch(`${ctx.baseUrl}/api/leaderboard?limit=invalid`);
      assert.equal(resLimitStr.status, 400);

      // search слишком длинный (> 50)
      const longQuery = 'a'.repeat(51);
      const resLongSearch = await fetch(`${ctx.baseUrl}/api/leaderboard?search=${longQuery}`);
      assert.equal(resLongSearch.status, 400);

      // Пустой username в /api/players/:username/stats
      const resEmptyUser = await fetch(`${ctx.baseUrl}/api/players/%20/stats`);
      assert.equal(resEmptyUser.status, 400);
    } finally {
      await ctx.close();
    }
  });

  it('8. Недоступные данные: Запрос публичной статистики несуществующего игрока возвращает 404', async () => {
    const ctx = await startTestServer();
    try {
      const res404 = await fetch(`${ctx.baseUrl}/api/players/PhantomGhostUnknown999/stats`);
      assert.equal(res404.status, 404);
      const data404 = await res404.json();
      assert.equal(data404.success, false);
      assert.equal(data404.error, 'Pilot not found');

      const resLegacy404 = await fetch(`${ctx.baseUrl}/api/stats/player/PhantomGhostUnknown999`);
      assert.equal(resLegacy404.status, 404);
    } finally {
      await ctx.close();
    }
  });

  it('9. Публичная статистика: GET /api/players/:username/stats возвращает публичный профиль и телеметрию', async () => {
    const ctx = await startTestServer();
    try {
      ctx.userManager.register('Public_Hero', 'pass123');

      // Регистрируем матч
      ctx.matchManager.recordMatch(
        createTestMatch({
          id: 'match_public_stat',
          winnerName: 'Public_Hero',
          players: [
            {
              name: 'Public_Hero',
              isWinner: true,
              score: 1500,
              kills: 7,
              deaths: 2,
              damageDealt: 1200,
              shotsFired: 50,
              shotsHit: 30,
              accuracy: 60,
            },
          ],
        })
      );

      const res = await fetch(`${ctx.baseUrl}/api/players/Public_Hero/stats`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.pilot.username, 'Public_Hero');
      assert.equal(data.pilot.rating, 1025);
      assert.equal(data.matchTelemetry.kills, 7);
      assert.equal(data.matchTelemetry.damageDealt, 1200);
      assert.equal(data.matchTelemetry.accuracy, 60);
    } finally {
      await ctx.close();
    }
  });

  it('10. Безопасность: Пароли, хеши и токены не возвращаются ни в одном маршруте', async () => {
    const ctx = await startTestServer();
    try {
      const { user, token } = ctx.userManager.register('Secret_Agent', 'super_secret_password_999');

      // 1. Leaderboard
      const resLb = await fetch(`${ctx.baseUrl}/api/leaderboard?search=Secret_Agent`);
      const dataLb = await resLb.json();
      const item = dataLb.leaderboard[0];
      assert.equal(item.passwordHash, undefined, 'passwordHash не должен возвращаться в leaderboard');
      assert.equal(item.token, undefined, 'token не должен возвращаться в leaderboard');
      assert.equal((item as any).password, undefined);

      // 2. /api/stats/me
      const resMe = await fetch(`${ctx.baseUrl}/api/stats/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataMe = await resMe.json();
      assert.equal(dataMe.pilot.passwordHash, undefined);
      assert.equal(dataMe.pilot.token, undefined);

      // 3. /api/players/:username/stats
      const resPub = await fetch(`${ctx.baseUrl}/api/players/Secret_Agent/stats`);
      const dataPub = await resPub.json();
      assert.equal(dataPub.pilot.passwordHash, undefined);
      assert.equal(dataPub.pilot.token, undefined);
    } finally {
      await ctx.close();
    }
  });

  it('11. Защита от записи: Методы POST/PUT/DELETE отклоняются со статусом 405 Method Not Allowed', async () => {
    const ctx = await startTestServer();
    try {
      // POST на /api/leaderboard
      const resPostLb = await fetch(`${ctx.baseUrl}/api/leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 9999 }),
      });
      assert.equal(resPostLb.status, 405, 'POST на /api/leaderboard должен возвращать 405 Method Not Allowed');
      const dataPost = await resPostLb.json();
      assert.equal(dataPost.success, false);

      // POST на /api/rating/me
      const resPostRating = await fetch(`${ctx.baseUrl}/api/rating/me`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 5000 }),
      });
      assert.equal(resPostRating.status, 405);

      // PUT на /api/players/Pilot/stats
      const resPutStats = await fetch(`${ctx.baseUrl}/api/players/SomePilot/stats`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kills: 100 }),
      });
      assert.equal(resPutStats.status, 405);
    } finally {
      await ctx.close();
    }
  });

  it('12. Серверный авторитет и синхронизация: Клиент не может изменить рейтинг через /api/auth/sync', async () => {
    const ctx = await startTestServer();
    try {
      const { user, token } = ctx.userManager.register('Hacker_Pilot', 'pass123');
      assert.equal(user.rating, 1000);

      // Попытка передать фиктивный рейтинг и победы
      const syncRes = await fetch(`${ctx.baseUrl}/api/auth/sync`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: 9999,
          wins: 500,
          kills: 9999,
          matchWon: true,
        }),
      });
      assert.equal(syncRes.status, 200);

      // Проверяем актуальный профиль
      const verifyRes = await fetch(`${ctx.baseUrl}/api/stats/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataVerify = await verifyRes.json();
      assert.equal(dataVerify.pilot.rating, 1000, 'Рейтинг должен остаться 1000 — клиентские данные проигнорированы');
      assert.equal(dataVerify.pilot.wins, 0);
      assert.equal(dataVerify.pilot.kills, 0);
    } finally {
      await ctx.close();
    }
  });

  it('13. Идемпотентность и консистентность: Повторный матч не изменяет рейтинг и порядок в таблице лидеров', async () => {
    const ctx = await startTestServer({ skipSeed: true });
    try {
      ctx.userManager.register('Duelist_A', 'pass123');
      ctx.userManager.register('Duelist_B', 'pass123');

      const match = createTestMatch({
        id: 'duel_idempotent_test',
        winnerName: 'Duelist_A',
        players: [
          { name: 'Duelist_A', isWinner: true, score: 800, kills: 3, deaths: 0 },
          { name: 'Duelist_B', isWinner: false, score: 200, kills: 0, deaths: 3 },
        ],
      });

      // Первичная обработка
      const rec1 = ctx.matchManager.recordMatch(match);
      assert.equal(rec1.recorded, true);

      const profA1 = ctx.userManager.getProfileByUsername('Duelist_A');
      assert.equal(profA1?.rating, 1025);

      // Повторная обработка того же матча
      const rec2 = ctx.matchManager.recordMatch(match);
      assert.equal(rec2.recorded, false, 'Повторный матч должен быть отклонён идемпотентно');

      const profA2 = ctx.userManager.getProfileByUsername('Duelist_A');
      assert.equal(profA2?.rating, 1025, 'Рейтинг не должен измениться при повторном матче');

      // Проверяем таблицу лидеров
      const resLb = await fetch(`${ctx.baseUrl}/api/leaderboard`);
      const dataLb = await resLb.json();
      assert.equal(dataLb.leaderboard[0].username, 'Duelist_A');
      assert.equal(dataLb.leaderboard[0].rating, 1025);
      assert.equal(dataLb.leaderboard[1].username, 'Duelist_B');
      assert.equal(dataLb.leaderboard[1].rating, 985);
    } finally {
      await ctx.close();
    }
  });
});
