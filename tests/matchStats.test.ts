import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameEngine } from '../server/gameEngine.ts';
import { MatchManager } from '../server/matchManager.ts';
import { Player, RoomState, MatchResult, MatchParticipantSummary } from '../src/types/game.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DATA_DIR = path.join(__dirname, 'test_data');
const TEST_MATCHES_FILE = path.join(TEST_DATA_DIR, 'test_matches.json');

function cleanupTestFiles() {
  try {
    if (fs.existsSync(TEST_MATCHES_FILE)) {
      fs.unlinkSync(TEST_MATCHES_FILE);
    }
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
  } catch {
    // ignore
  }
}

function createMockPlayer(id: string, name: string, overrides: Partial<Player> = {}): Player {
  return {
    id,
    name,
    color: '#06b6d4',
    isHost: false,
    isReady: true,
    ping: 20,
    x: 200,
    y: 200,
    vx: 0,
    vy: 0,
    angle: 0,
    health: 100,
    maxHealth: 100,
    shield: 100,
    maxShield: 100,
    score: 0,
    kills: 0,
    deaths: 0,
    damageDealt: 0,
    shotsFired: 0,
    shotsHit: 0,
    killStreak: 0,
    killStreakTier: 'none',
    bounty: 0,
    weapon: 'plasma',
    activeModifiers: [],
    isDashing: false,
    dashCooldown: 0,
    speedMultiplier: 1.0,
    speedBoostRemaining: 0,
    invulnerableUntil: 0,
    isDead: false,
    respawnAt: 0,
    ...overrides,
  };
}

function createMockRoom(players: Record<string, Player>, mode: RoomState['gameMode'] = 'ffa'): RoomState {
  return {
    code: 'TEST1',
    hostId: Object.keys(players)[0] || 'p1',
    status: 'playing',
    gameMode: mode,
    countdown: 0,
    matchTimeRemaining: 180,
    matchDuration: 180,
    mapId: mode === 'boss_raid' ? 'boss_arena' : 'nebula_arena',
    players,
    projectiles: [],
    powerUps: [],
    obstacles: [],
    killFeed: [],
  };
}

describe('CyberArena Server Match Statistics (0.9.2)', () => {
  beforeEach(() => {
    cleanupTestFiles();
  });

  afterEach(() => {
    cleanupTestFiles();
  });

  it('1. Победа (Victory): Победитель определяется сервером, статистика корректно начисляется', () => {
    const p1 = createMockPlayer('p1', 'AcePilot', { score: 1200, kills: 6, deaths: 1, damageDealt: 850 });
    const p2 = createMockPlayer('p2', 'RivalPilot', { score: 400, kills: 2, deaths: 4, damageDealt: 320 });

    const room = createMockRoom({ p1, p2 }, 'ffa');
    let capturedResult: MatchResult | undefined;

    const engine = new GameEngine(room, {
      onTick: () => {},
      onKill: () => {},
      onGameOver: (_scores, _winner, matchResult) => {
        capturedResult = matchResult;
      },
    });

    // Match time expires
    (engine as any).endGame();

    assert.ok(capturedResult, 'MatchResult должен быть сгенерирован сервером');
    const result: MatchResult = capturedResult;
    assert.equal(result.status, 'completed', 'Статус матча должен быть completed');
    assert.equal(result.winnerId, 'p1', 'Победитель должен быть p1');
    assert.equal(result.winnerName, 'AcePilot');

    const part1 = result.participants.find((p: MatchParticipantSummary) => p.id === 'p1');
    const part2 = result.participants.find((p: MatchParticipantSummary) => p.id === 'p2');
    assert.ok(part1);
    assert.ok(part2);
    assert.equal(part1.isWinner, true, 'Победитель должен иметь флаг isWinner = true');
    assert.equal(part2.isWinner, false, 'Проигравший должен иметь флаг isWinner = false');
    assert.equal(part1.kills, 6);
    assert.equal(part1.deaths, 1);
    assert.equal(part1.damageDealt, 850);
    assert.equal(part2.kills, 2);
    assert.equal(part2.deaths, 4);

    // Save and check match manager
    const matchManager = new MatchManager(undefined, TEST_MATCHES_FILE);
    const { recorded } = matchManager.recordMatch(result);
    assert.equal(recorded, true, 'Матч должен быть записан');

    const aggStats = matchManager.getPlayerAggregatedStats('AcePilot');
    assert.ok(aggStats);
    assert.equal(aggStats.matchesPlayed, 1);
    assert.equal(aggStats.wins, 1);
    assert.equal(aggStats.losses, 0);
    assert.equal(aggStats.draws, 0);
    assert.equal(aggStats.kills, 6);
    assert.equal(aggStats.deaths, 1);
    assert.equal(aggStats.damageDealt, 850);
  });

  it('2. Поражение (Defeat): В Boss Raid при истечении времени и живом боссе засчитывается поражение', () => {
    const p1 = createMockPlayer('p1', 'RaidLeader', { score: 500, kills: 0, deaths: 2, damageDealt: 12000 });
    const room = createMockRoom({ p1 }, 'boss_raid');
    room.boss = {
      id: 'boss_omega',
      name: 'ТИТАН ПУСТОТЫ',
      x: 500,
      y: 500,
      vx: 0,
      vy: 0,
      angle: 0,
      health: 8000, // Босс всё ещё жив!
      maxHealth: 30000,
      shield: 0,
      maxShield: 2000,
      phase: 3,
      isEnraged: true,
      radius: 90,
      damageContribution: { p1: 12000 },
    };

    let capturedResult: MatchResult | undefined;
    const engine = new GameEngine(room, {
      onTick: () => {},
      onKill: () => {},
      onGameOver: (_scores, _winner, matchResult) => {
        capturedResult = matchResult;
      },
    });

    // Match time expires, boss not killed
    (engine as any).endGame();

    assert.ok(capturedResult);
    const result: MatchResult = capturedResult;
    assert.equal(result.status, 'completed');
    assert.equal(result.bossDefeated, false, 'Босс не был побеждён');
    assert.equal(result.winnerId, null, 'У игроков нет победы');
    assert.equal(result.participants[0].isWinner, false, 'Игрок потерпел поражение от босса');

    const matchManager = new MatchManager(undefined, TEST_MATCHES_FILE);
    matchManager.recordMatch(result);
    const aggStats = matchManager.getPlayerAggregatedStats('RaidLeader');
    assert.ok(aggStats);
    assert.equal(aggStats.matchesPlayed, 1);
    assert.equal(aggStats.wins, 0, 'Победа не должна быть начислена при поражении');
    assert.equal(aggStats.losses, 1, 'Поражение засчитано');
    assert.equal(aggStats.bossRaidsDefeated, 0);
  });

  it('3. Ничья (Draw): Одинаковые очки приводят к статусу draw без фиктивной победы', () => {
    const p1 = createMockPlayer('p1', 'Alpha', { score: 800, kills: 4, deaths: 4, damageDealt: 600 });
    const p2 = createMockPlayer('p2', 'Bravo', { score: 800, kills: 4, deaths: 4, damageDealt: 600 });

    const room = createMockRoom({ p1, p2 }, 'ffa');
    let capturedResult: MatchResult | undefined;

    const engine = new GameEngine(room, {
      onTick: () => {},
      onKill: () => {},
      onGameOver: (_scores, _winner, matchResult) => {
        capturedResult = matchResult;
      },
    });

    (engine as any).endGame();

    assert.ok(capturedResult);
    const result: MatchResult = capturedResult;
    assert.equal(result.status, 'draw', 'Матч с равным счётом должен завершаться как ничья (draw)');
    assert.equal(result.winnerId, null, 'В ничьей winnerId должен быть null');
    assert.equal(result.winnerName, null);
    assert.equal(result.participants[0].isWinner, false);
    assert.equal(result.participants[1].isWinner, false);

    const matchManager = new MatchManager(undefined, TEST_MATCHES_FILE);
    matchManager.recordMatch(result);

    const stats1 = matchManager.getPlayerAggregatedStats('Alpha');
    assert.ok(stats1);
    assert.equal(stats1.matchesPlayed, 1);
    assert.equal(stats1.wins, 0);
    assert.equal(stats1.draws, 1);
    assert.equal(stats1.losses, 0);
  });

  it('4. Выход игрока (Player Exit) и незавершённый матч (Aborted): Не даёт ложную победу', () => {
    const p1 = createMockPlayer('p1', 'Leaver1', { score: 100, disconnected: true });
    const p2 = createMockPlayer('p2', 'Leaver2', { score: 50, disconnected: true });

    const room = createMockRoom({ p1, p2 }, 'ffa');
    let capturedResult: MatchResult | undefined;

    const engine = new GameEngine(room, {
      onTick: () => {},
      onKill: () => {},
      onGameOver: (_scores, _winner, matchResult) => {
        capturedResult = matchResult;
      },
    });

    // All players abandoned / match aborted
    engine.abortMatch('all_players_left');

    assert.ok(capturedResult);
    const result: MatchResult = capturedResult;
    assert.equal(result.status, 'aborted', 'Преждевременно покинутый матч должен иметь статус aborted');
    assert.equal(result.winnerId, null, 'В отменённом матче нет победителя');
    assert.equal(result.participants[0].isWinner, false);
    assert.equal(result.participants[1].isWinner, false);
    assert.equal(result.participants[0].disconnected, true);
    assert.equal(result.participants[1].disconnected, true);

    const matchManager = new MatchManager(undefined, TEST_MATCHES_FILE);
    matchManager.recordMatch(result);

    // Aborted match does not increment matchesPlayed
    const stats = matchManager.getPlayerAggregatedStats('Leaver1');
    assert.ok(stats);
    assert.equal(stats.matchesPlayed, 0, 'Отменённый матч не засчитывается как сыгранный');
    assert.equal(stats.wins, 0);
  });

  it('5. Идемпотентность (Duplicate completion): Повторное завершение не изменяет статистику дважды', () => {
    const p1 = createMockPlayer('p1', 'HeroPilot', { score: 1000, kills: 5, deaths: 0, damageDealt: 900 });
    const room = createMockRoom({ p1 }, 'ffa');

    let gameOverCallCount = 0;
    let capturedResult: MatchResult | undefined;

    const engine = new GameEngine(room, {
      onTick: () => {},
      onKill: () => {},
      onGameOver: (_scores, _winner, matchResult) => {
        gameOverCallCount++;
        capturedResult = matchResult;
      },
    });

    // 1st completion
    (engine as any).endGame();
    // 2nd completion (e.g. repeated timer or event callback)
    (engine as any).endGame();
    // 3rd completion
    engine.abortMatch();

    assert.equal(gameOverCallCount, 1, 'GameEngine должен вызывать onGameOver ровно один раз');
    assert.ok(capturedResult);
    const result: MatchResult = capturedResult;

    const matchManager = new MatchManager(undefined, TEST_MATCHES_FILE);
    // 1st record attempt
    const firstAttempt = matchManager.recordMatch(result);
    assert.equal(firstAttempt.recorded, true, 'Первая запись должна пройти успешно');

    // 2nd record attempt with identical match ID
    const secondAttempt = matchManager.recordMatch(result);
    assert.equal(secondAttempt.recorded, false, 'Повторная запись должна быть отвергнута (идемпотентность)');

    // 3rd record attempt
    const thirdAttempt = matchManager.recordMatch(result);
    assert.equal(thirdAttempt.recorded, false);

    // Total recorded matches must be exactly 1
    const matches = matchManager.getRecentMatches();
    assert.equal(matches.length, 1, 'В хранилище должен быть ровно один матч');

    const aggStats = matchManager.getPlayerAggregatedStats('HeroPilot');
    assert.ok(aggStats);
    assert.equal(aggStats.matchesPlayed, 1, 'matchesPlayed должен быть равен 1');
    assert.equal(aggStats.wins, 1, 'wins должен быть равен 1');
    assert.equal(aggStats.kills, 5, 'kills не должны удваиваться');
  });

  it('6. Персистентность (Persistence): Записанные матчи сохраняются в JSON-файле и восстанавливаются', () => {
    const p1 = createMockPlayer('p1', 'PersistentPilot', { score: 950, kills: 3, deaths: 1, damageDealt: 700 });
    const room = createMockRoom({ p1 }, 'ffa');

    let capturedResult: MatchResult | undefined;
    const engine = new GameEngine(room, {
      onTick: () => {},
      onKill: () => {},
      onGameOver: (_scores, _winner, mr) => {
        capturedResult = mr;
      },
    });
    (engine as any).endGame();
    assert.ok(capturedResult);
    const result: MatchResult = capturedResult;

    // Write with manager 1
    const manager1 = new MatchManager(undefined, TEST_MATCHES_FILE);
    manager1.recordMatch(result);

    assert.ok(fs.existsSync(TEST_MATCHES_FILE), 'Файл matches.json должен быть создан');

    // Read with a fresh manager 2 instance
    const manager2 = new MatchManager(undefined, TEST_MATCHES_FILE);
    const restored = manager2.getMatchById(result.id);
    assert.ok(restored, 'Матч должен быть восстановлен из файла');
    assert.equal(restored.winnerName, 'PersistentPilot');
    assert.equal(restored.participants[0].kills, 3);
  });
});
