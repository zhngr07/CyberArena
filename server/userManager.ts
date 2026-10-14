import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export interface StoredUser {
  id: string;
  username: string;
  passwordHash: string;
  rating: number; // MMR / Rank Points (1000 base)
  coins: number;
  matchesPlayed: number;
  wins: number;
  kills: number;
  deaths: number;
  highestScore: number;
  bossRaidsDefeated: number;
  mvpCount: number;
  ownedCosmetics: {
    shipModels: string[];
    hats: string[];
    trails: string[];
    titles: string[];
  };
  equippedCosmetics: {
    shipModel: string;
    hat: string;
    trail: string;
    title: string;
    color: string;
  };
  createdAt: number;
  lastLoginAt: number;
}

export interface PublicPilotProfile {
  id: string;
  username: string;
  rating: number;
  rankTier: 'recruit' | 'guardian' | 'veteran' | 'ace' | 'master' | 'apex';
  rankTitle: string;
  rankIcon: string;
  coins: number;
  matchesPlayed: number;
  wins: number;
  kills: number;
  deaths: number;
  kd: string;
  winRate: string;
  highestScore: number;
  bossRaidsDefeated: number;
  mvpCount: number;
  equippedCosmetics: StoredUser['equippedCosmetics'];
  createdAt: number;
}

export interface LeaderboardEntry extends PublicPilotProfile {
  rank: number;
  globalRank: number;
}

export interface LeaderboardPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface LeaderboardResponse {
  pilots: LeaderboardEntry[];
  pagination: LeaderboardPagination;
}

function computeRank(rating: number) {
  if (rating >= 2500) {
    return { rankTier: 'apex' as const, rankTitle: 'АБСОЛЮТ / APEX DOMINATOR', rankIcon: '⚡' };
  }
  if (rating >= 2000) {
    return { rankTier: 'master' as const, rankTitle: 'МАСТЕР / MASTER', rankIcon: '👑' };
  }
  if (rating >= 1500) {
    return { rankTier: 'ace' as const, rankTitle: 'КИБЕР-АС / CYBER ACE', rankIcon: '💎' };
  }
  if (rating >= 1000) {
    return { rankTier: 'veteran' as const, rankTitle: 'ВЕТЕРАН / VETERAN', rankIcon: '🥇' };
  }
  if (rating >= 500) {
    return { rankTier: 'guardian' as const, rankTitle: 'СТРАЖ / GUARDIAN', rankIcon: '🥈' };
  }
  return { rankTier: 'recruit' as const, rankTitle: 'РЕКРУТ / RECRUIT', rankIcon: '🥉' };
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_cyber_arena_salt_2026').digest('hex');
}

export class UserManager {
  private users: Map<string, StoredUser> = new Map(); // username.toLowerCase() -> StoredUser
  private tokens: Map<string, string> = new Map(); // token -> username
  private processedMatchIds: Set<string> = new Set();
  private customUsersFile?: string;

  constructor(customUsersFile?: string, options?: { skipSeed?: boolean }) {
    this.customUsersFile = customUsersFile;
    this.ensureDataDir();
    this.loadUsers();
    this.loadProcessedMatches();
    if (!options?.skipSeed) {
      this.seedDefaultPilotsIfEmpty();
    }
  }

  private getUsersFile(): string {
    return this.customUsersFile || USERS_FILE;
  }

  private ensureDataDir() {
    try {
      const dir = path.dirname(this.getUsersFile());
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (e) {
      console.error('Failed to create data dir', e);
    }
  }

  private loadUsers() {
    try {
      const file = this.getUsersFile();
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf-8');
        const list: StoredUser[] = JSON.parse(raw);
        for (const u of list) {
          this.users.set(u.username.toLowerCase(), u);
        }
      }
    } catch (e) {
      console.error('Failed to load users from file, using in-memory', e);
    }
  }

  private loadProcessedMatches() {
    try {
      const matchesFile = path.join(path.dirname(this.getUsersFile()), 'matches.json');
      if (fs.existsSync(matchesFile)) {
        const raw = fs.readFileSync(matchesFile, 'utf-8');
        const list: Array<{ id: string }> = JSON.parse(raw);
        for (const m of list) {
          if (m && m.id) {
            this.processedMatchIds.add(m.id);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  private saveUsers() {
    try {
      this.ensureDataDir();
      const file = this.getUsersFile();
      const list = Array.from(this.users.values());
      fs.writeFileSync(file, JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save users to file', e);
    }
  }

  private seedDefaultPilotsIfEmpty() {
    // 0.9 Beta Remake: No fake bot accounts. Leaderboard displays only real registered pilots.
    return;
  }

  public register(
    username: string,
    password: string,
    initialData?: {
      coins?: number;
      ownedCosmetics?: StoredUser['ownedCosmetics'];
      equippedCosmetics?: StoredUser['equippedCosmetics'];
      stats?: { matchesPlayed?: number; wins?: number; kills?: number; deaths?: number };
    }
  ): { user: PublicPilotProfile; token: string } {
    const cleanUser = username.trim();
    if (cleanUser.length < 3 || cleanUser.length > 20) {
      throw new Error('Имя пилота должно содержать от 3 до 20 символов / Username must be 3-20 characters');
    }
    if (!/^[a-zA-Z0-9_\u0400-\u04FF\s-]+$/.test(cleanUser)) {
      throw new Error('Недопустимые символы в имени / Invalid characters in username');
    }
    if (!password || password.length < 4) {
      throw new Error('Пароль должен быть не менее 4 символов / Password must be at least 4 characters');
    }

    const key = cleanUser.toLowerCase();
    if (this.users.has(key)) {
      throw new Error('Пилот с таким именем уже зарегистрирован! / Callsign already taken. Choose another or login.');
    }

    const newUser: StoredUser = {
      id: 'pilot_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      username: cleanUser,
      passwordHash: hashPassword(password),
      rating: 1000, // starting rating: Veteran / Bronze baseline
      coins: Math.max(100, initialData?.coins || 150),
      matchesPlayed: initialData?.stats?.matchesPlayed || 0,
      wins: initialData?.stats?.wins || 0,
      kills: initialData?.stats?.kills || 0,
      deaths: initialData?.stats?.deaths || 0,
      highestScore: 0,
      bossRaidsDefeated: 0,
      mvpCount: 0,
      ownedCosmetics: initialData?.ownedCosmetics || {
        shipModels: ['phantom'],
        hats: ['none'],
        trails: ['default'],
        titles: ['rookie'],
      },
      equippedCosmetics: initialData?.equippedCosmetics || {
        shipModel: 'phantom',
        hat: 'none',
        trail: 'default',
        title: 'rookie',
        color: '#06b6d4',
      },
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };

    this.users.set(key, newUser);
    this.saveUsers();

    const token = this.generateToken(cleanUser);
    return {
      user: this.toPublicProfile(newUser),
      token,
    };
  }

  public login(username: string, password: string): { user: PublicPilotProfile; token: string } {
    const cleanUser = username.trim();
    const key = cleanUser.toLowerCase();
    const user = this.users.get(key);
    if (!user) {
      throw new Error('Пилот с таким именем не найден! / Pilot not found. Check callsign or register.');
    }

    const hash = hashPassword(password);
    if (user.passwordHash !== hash) {
      throw new Error('Неверный пароль! / Incorrect password.');
    }

    user.lastLoginAt = Date.now();
    this.saveUsers();

    const token = this.generateToken(user.username);
    return {
      user: this.toPublicProfile(user),
      token,
    };
  }

  public getUserByToken(token: string): StoredUser | null {
    const username = this.tokens.get(token);
    if (!username) return null;
    return this.users.get(username.toLowerCase()) || null;
  }

  public getProfileByUsername(username: string): PublicPilotProfile | null {
    const u = this.users.get(username.trim().toLowerCase());
    return u ? this.toPublicProfile(u) : null;
  }

  public syncProgress(
    token: string,
    delta: {
      coinsAdded?: number;
      coinsSpent?: number;
      matchWon?: boolean;
      kills?: number;
      deaths?: number;
      score?: number;
      bossDefeated?: boolean;
      isMvp?: boolean;
      ownedCosmetics?: StoredUser['ownedCosmetics'];
      equippedCosmetics?: StoredUser['equippedCosmetics'];
    }
  ): PublicPilotProfile | null {
    const user = this.getUserByToken(token);
    if (!user) return null;

    // Secure sync: Cosmetics and shop purchases can be synced.
    // Match outcome stats (wins, kills, deaths, matchWon, bossDefeated)
    // are strictly server-authoritative and applied via applyAuthoritativeMatchResult.
    if (typeof delta.coinsSpent === 'number') {
      user.coins = Math.max(0, user.coins - delta.coinsSpent);
    }

    if (delta.ownedCosmetics) {
      user.ownedCosmetics = {
        shipModels: Array.from(new Set([...user.ownedCosmetics.shipModels, ...delta.ownedCosmetics.shipModels])),
        hats: Array.from(new Set([...user.ownedCosmetics.hats, ...delta.ownedCosmetics.hats])),
        trails: Array.from(new Set([...user.ownedCosmetics.trails, ...delta.ownedCosmetics.trails])),
        titles: Array.from(new Set([...user.ownedCosmetics.titles, ...delta.ownedCosmetics.titles])),
      };
    }

    if (delta.equippedCosmetics) {
      user.equippedCosmetics = { ...user.equippedCosmetics, ...delta.equippedCosmetics };
    }

    this.saveUsers();
    return this.toPublicProfile(user);
  }

  public applyAuthoritativeMatchResult(match: import('../src/types/game.ts').MatchResult): boolean {
    if (!match || !match.id || !Array.isArray(match.participants)) return false;

    // Strict idempotency: if match was already processed, ignore immediately
    if (this.processedMatchIds.has(match.id)) {
      return false;
    }
    this.processedMatchIds.add(match.id);

    // Competitive rating rules (0.9.3):
    // Ranked PvP is only FFA. Boss raid is PvE co-op (never ranked).
    // Aborted matches are non-ranked / unfinished.
    const isRankedPvP = match.isRanked !== false && match.mode === 'ffa' && match.status !== 'aborted';

    let hasChanges = false;
    for (const participant of match.participants) {
      if (participant.isBot) continue;

      const user = this.users.get(participant.name.trim().toLowerCase());
      if (!user) continue;

      hasChanges = true;
      if (match.status !== 'aborted') {
        user.matchesPlayed++;
        if (match.status === 'completed' && participant.isWinner) {
          user.wins++;
          user.coins += 150;
        } else {
          user.coins += 30;
        }
      }

      user.kills += participant.kills || 0;
      user.deaths += participant.deaths || 0;
      user.highestScore = Math.max(user.highestScore, participant.score || 0);

      if (match.mode === 'boss_raid' && match.bossDefeated && participant.isWinner) {
        user.bossRaidsDefeated = (user.bossRaidsDefeated || 0) + 1;
        user.coins += 250;
      }

      // Rating updates
      if (isRankedPvP) {
        if (match.status === 'draw') {
          // Ничья: 0
          participant.ratingDelta = 0;
          participant.newRating = user.rating;
        } else if (match.status === 'completed') {
          if (participant.isWinner) {
            // Победа в рейтинговом матче: +25
            user.rating += 25;
            participant.ratingDelta = 25;
            participant.newRating = user.rating;
          } else {
            // Поражение: -15. Минимальный рейтинг: 0.
            const oldRating = user.rating;
            user.rating = Math.max(0, user.rating - 15);
            participant.ratingDelta = user.rating - oldRating;
            participant.newRating = user.rating;
          }
        }
      } else {
        // Незавершённый или нерейтинговый матч не изменяет рейтинг
        participant.ratingDelta = 0;
        participant.newRating = user.rating;
      }
    }

    if (hasChanges) {
      this.saveUsers();
    }
    return true;
  }

  public getPilotGlobalRank(username: string): number | null {
    if (!username) return null;
    const key = username.trim().toLowerCase();
    const all = Array.from(this.users.values()).filter((u) => !u.id.startsWith('legend_'));
    all.sort((a, b) => b.rating - a.rating || b.wins - a.wins || b.kills - a.kills || a.createdAt - b.createdAt);
    const index = all.findIndex((u) => u.username.toLowerCase() === key);
    return index >= 0 ? index + 1 : null;
  }

  public getLeaderboard(options?: { page?: number; limit?: number; search?: string }): LeaderboardResponse {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.max(1, Math.min(100, options?.limit || 20));
    const search = options?.search ? options.search.trim().toLowerCase() : '';

    const all = Array.from(this.users.values()).filter((u) => !u.id.startsWith('legend_'));
    all.sort((a, b) => b.rating - a.rating || b.wins - a.wins || b.kills - a.kills || a.createdAt - b.createdAt);

    // Compute absolute global rank for every user
    const rankedAll = all.map((user, idx) => ({
      user,
      globalRank: idx + 1,
    }));

    const filtered = search
      ? rankedAll.filter((item) => item.user.username.toLowerCase().includes(search))
      : rankedAll;

    const total = filtered.length;
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    const pilots: LeaderboardEntry[] = paginated.map((item, index) => {
      const profile = this.toPublicProfile(item.user);
      return {
        ...profile,
        rank: startIndex + index + 1,
        globalRank: item.globalRank,
      };
    });

    return {
      pilots,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1 && totalPages > 0,
      },
    };
  }

  public getTopPilots(limit: number = 30): PublicPilotProfile[] {
    const all = Array.from(this.users.values());
    all.sort((a, b) => b.rating - a.rating || b.wins - a.wins || b.kills - a.kills || a.createdAt - b.createdAt);
    return all.slice(0, limit).map((u) => this.toPublicProfile(u));
  }

  private generateToken(username: string): string {
    const token = 'tok_' + crypto.randomBytes(24).toString('hex');
    this.tokens.set(token, username);
    return token;
  }

  public toPublicProfile(u: StoredUser): PublicPilotProfile {
    const rank = computeRank(u.rating);
    const kd = u.deaths > 0 ? (u.kills / u.deaths).toFixed(2) : u.kills.toFixed(2);
    const winRate = u.matchesPlayed > 0 ? Math.round((u.wins / u.matchesPlayed) * 100) + '%' : '0%';

    return {
      id: u.id,
      username: u.username,
      rating: u.rating,
      rankTier: rank.rankTier,
      rankTitle: rank.rankTitle,
      rankIcon: rank.rankIcon,
      coins: u.coins,
      matchesPlayed: u.matchesPlayed,
      wins: u.wins,
      kills: u.kills,
      deaths: u.deaths,
      kd,
      winRate,
      highestScore: u.highestScore,
      bossRaidsDefeated: u.bossRaidsDefeated || 0,
      mvpCount: u.mvpCount || 0,
      equippedCosmetics: u.equippedCosmetics,
      createdAt: u.createdAt,
    };
  }
}
