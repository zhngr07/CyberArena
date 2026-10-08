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

  constructor() {
    this.ensureDataDir();
    this.loadUsers();
    this.seedDefaultPilotsIfEmpty();
  }

  private ensureDataDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (e) {
      console.error('Failed to create data dir', e);
    }
  }

  private loadUsers() {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, 'utf-8');
        const list: StoredUser[] = JSON.parse(raw);
        for (const u of list) {
          this.users.set(u.username.toLowerCase(), u);
        }
      }
    } catch (e) {
      console.error('Failed to load users from file, using in-memory', e);
    }
  }

  private saveUsers() {
    try {
      this.ensureDataDir();
      const list = Array.from(this.users.values());
      fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save users to file', e);
    }
  }

  private seedDefaultPilotsIfEmpty() {
    if (this.users.size > 0) return;

    const initialLegends: Array<Partial<StoredUser> & { username: string; rating: number }> = [
      {
        username: 'Apex_Viper',
        rating: 2650,
        matchesPlayed: 148,
        wins: 112,
        kills: 842,
        deaths: 120,
        highestScore: 3250,
        bossRaidsDefeated: 24,
        mvpCount: 45,
        coins: 1850,
        equippedCosmetics: { shipModel: 'dragon', hat: 'crown', trail: 'lightning', title: 'legend', color: '#f59e0b' },
      },
      {
        username: 'Cyber_Phantom',
        rating: 2310,
        matchesPlayed: 110,
        wins: 76,
        kills: 590,
        deaths: 140,
        highestScore: 2800,
        bossRaidsDefeated: 18,
        mvpCount: 29,
        coins: 1200,
        equippedCosmetics: { shipModel: 'phantom', hat: 'visor', trail: 'matrix', title: 'untouchable', color: '#06b6d4' },
      },
      {
        username: 'Nova_Destroyer',
        rating: 1890,
        matchesPlayed: 92,
        wins: 54,
        kills: 410,
        deaths: 165,
        highestScore: 2100,
        bossRaidsDefeated: 12,
        mvpCount: 19,
        coins: 850,
        equippedCosmetics: { shipModel: 'dreadnought', hat: 'horns', trail: 'fire', title: 'slayer', color: '#ef4444' },
      },
      {
        username: 'Neon_Sniper',
        rating: 1640,
        matchesPlayed: 75,
        wins: 41,
        kills: 330,
        deaths: 115,
        highestScore: 1950,
        bossRaidsDefeated: 9,
        mvpCount: 14,
        coins: 600,
        equippedCosmetics: { shipModel: 'raven', hat: 'samurai', trail: 'rainbow', title: 'sniper', color: '#a855f7' },
      },
      {
        username: 'Galactic_Pilot',
        rating: 1250,
        matchesPlayed: 45,
        wins: 22,
        kills: 180,
        deaths: 95,
        highestScore: 1450,
        bossRaidsDefeated: 4,
        mvpCount: 6,
        coins: 450,
        equippedCosmetics: { shipModel: 'phantom', hat: 'headset', trail: 'stars', title: 'rookie', color: '#10b981' },
      },
    ];

    for (const leg of initialLegends) {
      const user: StoredUser = {
        id: 'legend_' + Math.random().toString(36).slice(2, 9),
        username: leg.username,
        passwordHash: hashPassword('pilot_legend_bot'),
        rating: leg.rating,
        coins: leg.coins || 500,
        matchesPlayed: leg.matchesPlayed || 30,
        wins: leg.wins || 15,
        kills: leg.kills || 100,
        deaths: leg.deaths || 50,
        highestScore: leg.highestScore || 1000,
        bossRaidsDefeated: leg.bossRaidsDefeated || 5,
        mvpCount: leg.mvpCount || 5,
        ownedCosmetics: {
          shipModels: ['phantom', leg.equippedCosmetics?.shipModel || 'phantom'],
          hats: ['none', leg.equippedCosmetics?.hat || 'none'],
          trails: ['default', leg.equippedCosmetics?.trail || 'default'],
          titles: ['rookie', leg.equippedCosmetics?.title || 'rookie'],
        },
        equippedCosmetics: leg.equippedCosmetics || {
          shipModel: 'phantom',
          hat: 'none',
          trail: 'default',
          title: 'rookie',
          color: '#06b6d4',
        },
        createdAt: Date.now() - 30 * 24 * 3600 * 1000,
        lastLoginAt: Date.now() - 3600 * 1000,
      };
      this.users.set(leg.username.toLowerCase(), user);
    }
    this.saveUsers();
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

    if (typeof delta.coinsAdded === 'number') {
      user.coins += delta.coinsAdded;
    }
    if (typeof delta.coinsSpent === 'number') {
      user.coins = Math.max(0, user.coins - delta.coinsSpent);
    }

    if (delta.matchWon !== undefined) {
      user.matchesPlayed++;
      if (delta.matchWon) {
        user.wins++;
        user.rating = Math.round(user.rating + 35); // +35 RP for win
      } else {
        user.rating = Math.max(100, Math.round(user.rating - 15)); // -15 RP for loss
      }
    }

    if (typeof delta.kills === 'number' && delta.kills > 0) {
      user.kills += delta.kills;
      user.rating += delta.kills * 4; // +4 RP per kill
    }
    if (typeof delta.deaths === 'number' && delta.deaths > 0) {
      user.deaths += delta.deaths;
    }

    if (typeof delta.score === 'number') {
      user.highestScore = Math.max(user.highestScore, delta.score);
    }

    if (delta.bossDefeated) {
      user.bossRaidsDefeated = (user.bossRaidsDefeated || 0) + 1;
      user.rating += 50; // +50 RP for boss defeat
      user.coins += 250;
    }

    if (delta.isMvp) {
      user.mvpCount = (user.mvpCount || 0) + 1;
      user.rating += 25; // +25 RP for MVP
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

  public getTopPilots(limit: number = 30): PublicPilotProfile[] {
    const all = Array.from(this.users.values());
    all.sort((a, b) => b.rating - a.rating || b.wins - a.wins || b.kills - a.kills);
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
