import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MatchResult, MatchStatus } from '../src/types/game.ts';
import { UserManager } from './userManager.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json');

export interface PlayerAggregatedStats {
  playerName: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  kills: number;
  deaths: number;
  damageDealt: number;
  shotsFired: number;
  shotsHit: number;
  accuracy: number;
  kd: string;
  winRate: string;
  highestScore: number;
  bossRaidsDefeated: number;
}

export class MatchManager {
  private matches: Map<string, MatchResult> = new Map();
  private userManager?: UserManager;
  private customMatchesFile?: string;

  constructor(userManager?: UserManager, customFilePath?: string) {
    this.userManager = userManager;
    this.customMatchesFile = customFilePath;
    this.ensureDataDir();
    this.loadMatches();
  }

  private getFilePath(): string {
    return this.customMatchesFile || MATCHES_FILE;
  }

  private ensureDataDir() {
    try {
      const dir = path.dirname(this.getFilePath());
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (e) {
      console.error('Failed to create match data dir', e);
    }
  }

  private loadMatches() {
    try {
      const file = this.getFilePath();
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf-8');
        const list: MatchResult[] = JSON.parse(raw);
        for (const m of list) {
          if (m && m.id) {
            this.matches.set(m.id, m);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load matches from file, using in-memory', e);
    }
  }

  private saveMatches() {
    try {
      this.ensureDataDir();
      const list = Array.from(this.matches.values());
      fs.writeFileSync(this.getFilePath(), JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save matches to file', e);
    }
  }

  /**
   * Authoritatively record a match result.
   * Enforces strict idempotency: if match with same ID is already recorded,
   * it is NOT recorded again and user statistics are NOT updated a second time.
   */
  public recordMatch(result: MatchResult): { recorded: boolean; match: MatchResult } {
    if (!result || !result.id) {
      throw new Error('Invalid match result: missing ID');
    }

    if (this.matches.has(result.id)) {
      // Idempotency: match already recorded
      return { recorded: false, match: this.matches.get(result.id)! };
    }

    // Clone to prevent external mutations
    const cleanResult: MatchResult = JSON.parse(JSON.stringify(result));
    this.matches.set(cleanResult.id, cleanResult);
    this.saveMatches();

    // Authoritatively apply outcome to registered user accounts
    if (this.userManager && typeof this.userManager.applyAuthoritativeMatchResult === 'function') {
      try {
        this.userManager.applyAuthoritativeMatchResult(cleanResult);
      } catch (err) {
        console.error('Error applying match result to user profiles:', err);
      }
    }

    return { recorded: true, match: cleanResult };
  }

  public getMatchById(id: string): MatchResult | null {
    return this.matches.get(id) || null;
  }

  public getRecentMatches(limit: number = 30): MatchResult[] {
    const all = Array.from(this.matches.values());
    all.sort((a, b) => b.endTime - a.endTime);
    return all.slice(0, limit);
  }

  public getMatchesByPlayer(playerNameOrId: string, limit: number = 30): MatchResult[] {
    const key = playerNameOrId.trim().toLowerCase();
    const list: MatchResult[] = [];

    for (const m of this.matches.values()) {
      const participated = m.participants.some(
        (p) => p.name.toLowerCase() === key || p.id === playerNameOrId
      );
      if (participated) {
        list.push(m);
      }
    }

    list.sort((a, b) => b.endTime - a.endTime);
    return list.slice(0, limit);
  }

  public getPlayerAggregatedStats(playerNameOrId: string): PlayerAggregatedStats | null {
    const key = playerNameOrId.trim().toLowerCase();
    const matches = this.getMatchesByPlayer(playerNameOrId, 1000);
    if (matches.length === 0) return null;

    let matchesPlayed = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let kills = 0;
    let deaths = 0;
    let damageDealt = 0;
    let shotsFired = 0;
    let shotsHit = 0;
    let highestScore = 0;
    let bossRaidsDefeated = 0;
    let resolvedName = playerNameOrId;

    for (const m of matches) {
      const part = m.participants.find(
        (p) => p.name.toLowerCase() === key || p.id === playerNameOrId
      );
      if (!part) continue;

      resolvedName = part.name;

      if (m.status !== 'aborted') {
        matchesPlayed++;
        if (m.status === 'draw') {
          draws++;
        } else if (part.isWinner) {
          wins++;
        } else {
          losses++;
        }
      }

      kills += part.kills || 0;
      deaths += part.deaths || 0;
      damageDealt += part.damageDealt || 0;
      shotsFired += part.shotsFired || 0;
      shotsHit += part.shotsHit || 0;
      highestScore = Math.max(highestScore, part.score || 0);

      if (m.mode === 'boss_raid' && m.bossDefeated && part.isWinner) {
        bossRaidsDefeated++;
      }
    }

    const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);
    const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) + '%' : '0%';
    const accuracy = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0;

    return {
      playerName: resolvedName,
      matchesPlayed,
      wins,
      draws,
      losses,
      kills,
      deaths,
      damageDealt,
      shotsFired,
      shotsHit,
      accuracy,
      kd,
      winRate,
      highestScore,
      bossRaidsDefeated,
    };
  }
}
