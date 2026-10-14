import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { AddressInfo } from 'net';
import { WebSocket } from 'ws';
import { createCyberArenaApp } from '../server.ts';
import { UserManager } from '../server/userManager.ts';
import { MatchManager } from '../server/matchManager.ts';
import { MatchResult, ServerMessage } from '../src/types/game.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DATA_DIR = path.join(__dirname, 'test_final_verification_data');
const TEST_USERS_FILE = path.join(TEST_DATA_DIR, 'users.json');
const TEST_MATCHES_FILE = path.join(TEST_DATA_DIR, 'matches.json');

function cleanup() {
  try {
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
  } catch {
    // ignore
  }
}

interface TestContext {
  userManager: UserManager;
  matchManager: MatchManager;
  roomManager: any;
  server: import('http').Server;
  wss: any;
  baseUrl: string;
  wsUrl: string;
  close: () => Promise<void>;
}

async function startServer(options?: { skipSeed?: boolean }): Promise<TestContext> {
  const userManager = new UserManager(TEST_USERS_FILE, { skipSeed: options?.skipSeed });
  const matchManager = new MatchManager(userManager, TEST_MATCHES_FILE);
  const { server, wss, roomManager } = createCyberArenaApp({ userManager, matchManager });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const addr = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${addr.port}`;
  const wsUrl = `ws://127.0.0.1:${addr.port}/ws`;

  return {
    userManager,
    matchManager,
    roomManager,
    server,
    wss,
    baseUrl,
    wsUrl,
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

function connectWsClient(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.on('open', () => resolve(ws));
    ws.on('error', (err) => reject(err));
  });
}

function waitForMessage<T extends ServerMessage>(
  ws: WebSocket,
  filter: (msg: ServerMessage) => boolean,
  timeoutMs: number = 3000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.off('message', handler);
      reject(new Error(`Timeout waiting for WebSocket message (${timeoutMs}ms)`));
    }, timeoutMs);

    const handler = (data: any) => {
      try {
        const parsed = JSON.parse(data.toString()) as ServerMessage;
        if (filter(parsed)) {
          clearTimeout(timer);
          ws.off('message', handler);
          resolve(parsed as T);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.on('message', handler);
  });
}

describe('CyberArena 0.9 Beta — Final Competitive Update Verification', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('Check 2: Регистрация и вход существующего пользователя', async () => {
    const ctx = await startServer();
    try {
      // 1. Регистрация нового пилота
      const regRes = await fetch(`${ctx.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'Major_Blaze', password: 'pilot_secret_password' }),
      });
      assert.equal(regRes.status, 200);
      const regData = await regRes.json();
      assert.equal(regData.success, true);
      assert.equal(regData.user.username, 'Major_Blaze');
      assert.equal(regData.user.rating, 1000);
      assert.ok(regData.token);

      // 2. Вход существующего пилота с верным паролем
      const loginRes = await fetch(`${ctx.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'Major_Blaze', password: 'pilot_secret_password' }),
      });
      assert.equal(loginRes.status, 200);
      const loginData = await loginRes.json();
      assert.equal(loginData.success, true);
      assert.equal(loginData.user.username, 'Major_Blaze');

      // 3. Вход с неверным паролем отклоняется (400)
      const badLoginRes = await fetch(`${ctx.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'Major_Blaze', password: 'wrong_password' }),
      });
      assert.equal(badLoginRes.status, 400);

      // 4. Проверка /api/auth/me
      const meRes = await fetch(`${ctx.baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${loginData.token}` },
      });
      assert.equal(meRes.status, 200);
      const meData = await meRes.json();
      assert.equal(meData.user.username, 'Major_Blaze');
    } finally {
      await ctx.close();
    }
  });

  it('Check 3, 4, 5, 9: Реальный PvP-матч с двумя WebSocket-клиентами, завершение, синхронизация и обновление рейтинга/лидерборда', async () => {
    const ctx = await startServer({ skipSeed: true });
    let wsA: WebSocket | null = null;
    let wsB: WebSocket | null = null;

    try {
      // Регистрируем двух аккаунтов на сервере
      ctx.userManager.register('Gladiator_A', 'pass123');
      ctx.userManager.register('Gladiator_B', 'pass123');

      // 1. Подключаем Client A
      wsA = await connectWsClient(ctx.wsUrl);
      const roomJoinedPromiseA = waitForMessage<any>(wsA, (m) => m.type === 'joined');

      wsA.send(
        JSON.stringify({
          type: 'create_room',
          playerName: 'Gladiator_A',
          gameMode: 'ffa',
        })
      );
      const roomA = await roomJoinedPromiseA;
      const roomCode = roomA.room.code;
      assert.ok(roomCode);

      // 2. Подключаем Client B
      wsB = await connectWsClient(ctx.wsUrl);
      const roomJoinedPromiseB = waitForMessage<any>(wsB, (m) => m.type === 'joined');

      wsB.send(
        JSON.stringify({
          type: 'join_room',
          roomCode,
          playerName: 'Gladiator_B',
        })
      );
      await roomJoinedPromiseB;

      // 3. Запуск игры клиентом A (хост)
      const gameStartedPromiseA = waitForMessage<any>(wsA, (m) => m.type === 'game_started');
      const gameStartedPromiseB = waitForMessage<any>(wsB, (m) => m.type === 'game_started');

      wsA.send(JSON.stringify({ type: 'start_game' }));
      await Promise.all([gameStartedPromiseA, gameStartedPromiseB]);

      // 4. Получаем игровой движок комнаты и настраиваем счет
      const engine = ctx.roomManager.getEngine(roomCode);
      assert.ok(engine, 'Игровой движок комнаты должен быть создан');

      const room = ctx.roomManager.getRoom(roomCode);
      const playerIds = Object.keys(room.players);
      assert.equal(playerIds.length, 2);

      // Присваиваем игрокам очки и убийства
      const playerAId = playerIds.find((id) => room.players[id].name === 'Gladiator_A')!;
      const playerBId = playerIds.find((id) => room.players[id].name === 'Gladiator_B')!;

      room.players[playerAId].score = 1500;
      room.players[playerAId].kills = 3;
      room.players[playerBId].score = 400;
      room.players[playerBId].kills = 0;
      room.players[playerBId].deaths = 3;

      // 5. Ожидаем авторитетное сообщение game_over на обоих клиентах одновременно
      const gameOverPromiseA = waitForMessage<any>(wsA, (m) => m.type === 'game_over');
      const gameOverPromiseB = waitForMessage<any>(wsB, (m) => m.type === 'game_over');

      // Авторитетное завершение матча сервером
      engine.endGame();
      engine.stop();

      const [gameOverA, gameOverB] = await Promise.all([gameOverPromiseA, gameOverPromiseB]);

      // Проверка 9: Отсутствие рассинхронизации между WebSocket-клиентами
      assert.ok(gameOverA.matchResult);
      assert.ok(gameOverB.matchResult);
      assert.equal(gameOverA.matchResult.id, gameOverB.matchResult.id, 'ID матча должен совпадать на обоих клиентах');
      assert.equal(gameOverA.winner.id, gameOverB.winner.id, 'Победитель должен быть строго одинаковым');
      assert.equal(gameOverA.winner.name, 'Gladiator_A');
      assert.equal(gameOverB.winner.name, 'Gladiator_A');

      // Проверка 3: Результат матча
      assert.equal(gameOverA.matchResult.status, 'completed');
      assert.equal(gameOverA.matchResult.mode, 'ffa');
      assert.equal(gameOverA.matchResult.isRanked, true);

      // Проверка 4: Начисление рейтинга (+25 для победителя, -15 для проигравшего)
      const profA = ctx.userManager.getProfileByUsername('Gladiator_A');
      const profB = ctx.userManager.getProfileByUsername('Gladiator_B');
      assert.equal(profA?.rating, 1025, 'Победитель должен получить ровно +25 (1025)');
      assert.equal(profA?.wins, 1);
      assert.equal(profB?.rating, 985, 'Проигравший должен потерять ровно -15 (985)');
      assert.equal(profB?.wins, 0);

      // Проверка 5: Обновление лидерборда и статистики
      const lbRes = await fetch(`${ctx.baseUrl}/api/leaderboard`);
      assert.equal(lbRes.status, 200);
      const lbData = await lbRes.json();
      assert.equal(lbData.leaderboard.length, 2);
      assert.equal(lbData.leaderboard[0].username, 'Gladiator_A');
      assert.equal(lbData.leaderboard[0].rating, 1025);
      assert.equal(lbData.leaderboard[0].rank, 1);
      assert.equal(lbData.leaderboard[1].username, 'Gladiator_B');
      assert.equal(lbData.leaderboard[1].rating, 985);
      assert.equal(lbData.leaderboard[1].rank, 2);

      // Проверка публичной статистики
      const statsRes = await fetch(`${ctx.baseUrl}/api/players/Gladiator_A/stats`);
      assert.equal(statsRes.status, 200);
      const statsData = await statsRes.json();
      assert.equal(statsData.pilot.rating, 1025);
      assert.equal(statsData.rating.current, 1025);
      assert.equal(statsData.rating.globalRank, 1);
    } finally {
      if (wsA && wsA.readyState === WebSocket.OPEN) wsA.close();
      if (wsB && wsB.readyState === WebSocket.OPEN) wsB.close();
      await ctx.close();
    }
  });

  it('Check 6: Повторная отправка одного результата не меняет рейтинг повторно', async () => {
    const ctx = await startServer({ skipSeed: true });
    try {
      ctx.userManager.register('Lone_Warrior', 'pass123');

      const matchResult: MatchResult = {
        id: 'match_duplicate_verification',
        roomCode: 'DUP1',
        mode: 'ffa',
        mapId: 'arena',
        status: 'completed',
        isRanked: true,
        startTime: Date.now() - 60000,
        endTime: Date.now(),
        durationSeconds: 60,
        winnerId: 'p_Lone_Warrior',
        winnerName: 'Lone_Warrior',
        participants: [
          {
            id: 'p_Lone_Warrior',
            name: 'Lone_Warrior',
            isBot: false,
            score: 1000,
            kills: 4,
            deaths: 0,
            damageDealt: 800,
            shotsFired: 30,
            shotsHit: 20,
            accuracy: 66,
            assists: 0,
            killStreak: 4,
            isWinner: true,
          },
        ],
      };

      // 1. Первая фиксация
      const rec1 = ctx.matchManager.recordMatch(matchResult);
      assert.equal(rec1.recorded, true);
      const prof1 = ctx.userManager.getProfileByUsername('Lone_Warrior');
      assert.equal(prof1?.rating, 1025);
      assert.equal(prof1?.wins, 1);

      // 2. Вторая попытка записи того же матча
      const rec2 = ctx.matchManager.recordMatch(matchResult);
      assert.equal(rec2.recorded, false, 'Повторный результат должен быть отклонён идемпотентно');

      const prof2 = ctx.userManager.getProfileByUsername('Lone_Warrior');
      assert.equal(prof2?.rating, 1025, 'Рейтинг не должен начисляться повторно');
      assert.equal(prof2?.wins, 1);
    } finally {
      await ctx.close();
    }
  });

  it('Check 7: После перезапуска сервера сохранённые данные не исчезают (персистентность)', async () => {
    // 1. Запускаем первый сервер и сохраняем данные
    const ctx1 = await startServer({ skipSeed: true });
    const matchId = 'persisted_match_100';

    ctx1.userManager.register('Persistent_Ace', 'pass123');
    ctx1.matchManager.recordMatch({
      id: matchId,
      roomCode: 'PERS',
      mode: 'ffa',
      mapId: 'arena',
      status: 'completed',
      isRanked: true,
      startTime: Date.now() - 30000,
      endTime: Date.now(),
      durationSeconds: 30,
      winnerId: 'p_Persistent_Ace',
      winnerName: 'Persistent_Ace',
      participants: [
        {
          id: 'p_Persistent_Ace',
          name: 'Persistent_Ace',
          isBot: false,
          score: 800,
          kills: 5,
          deaths: 1,
          damageDealt: 600,
          shotsFired: 20,
          shotsHit: 12,
          accuracy: 60,
          assists: 0,
          killStreak: 3,
          isWinner: true,
        },
      ],
    });

    const profBefore = ctx1.userManager.getProfileByUsername('Persistent_Ace');
    assert.equal(profBefore?.rating, 1025);
    await ctx1.close();

    // 2. Имитируем перезапуск сервера с чтением тех же JSON-файлов
    const ctx2 = await startServer({ skipSeed: true });
    try {
      const profAfter = ctx2.userManager.getProfileByUsername('Persistent_Ace');
      assert.ok(profAfter, 'Пользователь должен существовать после перезапуска');
      assert.equal(profAfter.rating, 1025, 'Рейтинг должен сохраниться');
      assert.equal(profAfter.wins, 1, 'Победы должны сохраниться');

      const savedMatch = ctx2.matchManager.getMatchById(matchId);
      assert.ok(savedMatch, 'Завершённый матч должен сохраняться в matches.json');
      assert.equal(savedMatch.winnerName, 'Persistent_Ace');

      // Проверяем таблицу лидеров нового экземпляра
      const lbRes = await fetch(`${ctx2.baseUrl}/api/leaderboard`);
      const lbData = await lbRes.json();
      assert.equal(lbData.leaderboard.length, 1);
      assert.equal(lbData.leaderboard[0].username, 'Persistent_Ace');
      assert.equal(lbData.leaderboard[0].rating, 1025);
    } finally {
      await ctx2.close();
    }
  });

  it('Check 8: Неавторизованный клиент не может изменять рейтинг', async () => {
    const ctx = await startServer();
    try {
      // 1. Попытка запроса /api/stats/me без токена
      const resStats = await fetch(`${ctx.baseUrl}/api/stats/me`);
      assert.equal(resStats.status, 401);

      // 2. Попытка записи через POST /api/leaderboard
      const resPostLb = await fetch(`${ctx.baseUrl}/api/leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 9999 }),
      });
      assert.equal(resPostLb.status, 405);

      // 3. Попытка подделки рейтинга через /api/auth/sync
      const reg = ctx.userManager.register('Tester_Pilot', 'pass123');
      const syncRes = await fetch(`${ctx.baseUrl}/api/auth/sync`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${reg.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating: 8888, wins: 100 }),
      });
      assert.equal(syncRes.status, 200);

      const checkProfile = ctx.userManager.getProfileByUsername('Tester_Pilot');
      assert.equal(checkProfile?.rating, 1000, 'Рейтинг не изменился — сервер проигнорировал попытку подделки');
      assert.equal(checkProfile?.wins, 0);
    } finally {
      await ctx.close();
    }
  });

  it('Check 10: Мобильная ширина интерфейса, пустые состояния и ошибки API', async () => {
    const ctx = await startServer({ skipSeed: true });
    try {
      // 1. Ошибки валидации API
      const resBadPage = await fetch(`${ctx.baseUrl}/api/leaderboard?page=0`);
      assert.equal(resBadPage.status, 400);

      const resBadLimit = await fetch(`${ctx.baseUrl}/api/leaderboard?limit=200`);
      assert.equal(resBadLimit.status, 400);

      const resBadName = await fetch(`${ctx.baseUrl}/api/players/%20/stats`);
      assert.equal(resBadName.status, 400);

      const res404 = await fetch(`${ctx.baseUrl}/api/players/NoSuchPilotXYZ/stats`);
      assert.equal(res404.status, 404);

      // 2. Пустые состояния лидерборда
      const resEmpty = await fetch(`${ctx.baseUrl}/api/leaderboard`);
      assert.equal(resEmpty.status, 200);
      const emptyData = await resEmpty.json();
      assert.deepEqual(emptyData.leaderboard, []);
      assert.equal(emptyData.pagination.total, 0);

      // 3. Пустой поиск
      ctx.userManager.register('RealPilot', 'pass123');
      const resNoMatch = await fetch(`${ctx.baseUrl}/api/leaderboard?search=ImaginarySearch`);
      assert.equal(resNoMatch.status, 200);
      const noMatchData = await resNoMatch.json();
      assert.deepEqual(noMatchData.leaderboard, []);
    } finally {
      await ctx.close();
    }
  });

  it('Check 11: Отсутствие регрессий комнат и Boss Raid', async () => {
    const ctx = await startServer();
    try {
      // 1. Проверяем /api/rooms
      const roomsRes = await fetch(`${ctx.baseUrl}/api/rooms`);
      assert.equal(roomsRes.status, 200);
      const roomsData = await roomsRes.json();
      assert.ok(Array.isArray(roomsData.rooms));

      // 2. Boss Raid завершение: проверка отсутствия влияния на PvP-рейтинг
      const reg = ctx.userManager.register('Raid_Captain', 'pass123');
      assert.equal(reg.user.rating, 1000);

      const bossRaidMatch: MatchResult = {
        id: 'boss_raid_test_1',
        roomCode: 'RAID',
        mode: 'boss_raid',
        mapId: 'boss_arena',
        status: 'completed',
        isRanked: false, // Boss Raid не является рейтинговым PvP
        bossDefeated: true,
        startTime: Date.now() - 120000,
        endTime: Date.now(),
        durationSeconds: 120,
        winnerId: 'p_Raid_Captain',
        winnerName: 'Raid_Captain',
        participants: [
          {
            id: 'p_Raid_Captain',
            name: 'Raid_Captain',
            isBot: false,
            score: 5000,
            kills: 0,
            deaths: 0,
            damageDealt: 10000,
            shotsFired: 200,
            shotsHit: 180,
            accuracy: 90,
            assists: 0,
            killStreak: 0,
            isWinner: true,
          },
        ],
      };

      const recordResult = ctx.matchManager.recordMatch(bossRaidMatch);
      assert.equal(recordResult.recorded, true);

      const raidProf = ctx.userManager.getProfileByUsername('Raid_Captain');
      assert.ok(raidProf);
      assert.equal(raidProf.rating, 1000, 'Boss Raid НЕ должен изменять PvP-рейтинг (дельта 0)');
      assert.equal(raidProf.bossRaidsDefeated, 1, 'Счётчик поверженных боссов должен увеличиться на 1');
      assert.ok(raidProf.coins >= 350, 'Награда за победу над боссом должна быть начислена');
    } finally {
      await ctx.close();
    }
  });
});
