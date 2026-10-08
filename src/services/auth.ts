export interface PilotProfile {
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
  equippedCosmetics: {
    shipModel: string;
    hat: string;
    trail: string;
    title: string;
    color: string;
  };
  createdAt: number;
}

type AuthListener = (user: PilotProfile | null) => void;

class AuthService {
  private user: PilotProfile | null = null;
  private token: string | null = null;
  private listeners: Set<AuthListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.token = localStorage.getItem('cyber_auth_token');
        const savedUser = localStorage.getItem('cyber_user_profile');
        if (savedUser) {
          this.user = JSON.parse(savedUser);
        }
        // Verify with server in background if token exists
        if (this.token) {
          this.fetchMe().catch(() => {});
        }
      } catch {
        // ignore
      }
    }
  }

  public subscribe(cb: AuthListener): () => void {
    this.listeners.add(cb);
    cb(this.user);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.user));
  }

  public getCurrentUser(): PilotProfile | null {
    return this.user;
  }

  public getToken(): string | null {
    return this.token;
  }

  public isLoggedIn(): boolean {
    return !!this.user && !!this.token;
  }

  public async fetchMe(): Promise<PilotProfile | null> {
    if (!this.token) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();
      if (data.success && data.user) {
        this.user = data.user;
        this.persistUser(data.user);
        this.notify();
        return data.user;
      }
    } catch {
      // offline / transient
    }
    return null;
  }

  public async register(username: string, password: string, initialData?: any): Promise<PilotProfile> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, initialData }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Ошибка регистрации');
    }

    this.token = data.token;
    this.user = data.user;
    if (this.token) localStorage.setItem('cyber_auth_token', this.token);
    this.persistUser(data.user);
    this.notify();
    return data.user;
  }

  public async login(username: string, password: string): Promise<PilotProfile> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Ошибка входа');
    }

    this.token = data.token;
    this.user = data.user;
    if (this.token) localStorage.setItem('cyber_auth_token', this.token);
    this.persistUser(data.user);
    this.notify();
    return data.user;
  }

  public logout() {
    this.token = null;
    this.user = null;
    try {
      localStorage.removeItem('cyber_auth_token');
      localStorage.removeItem('cyber_user_profile');
    } catch {
      // ignore
    }
    this.notify();
  }

  public async syncProgress(delta: {
    coinsAdded?: number;
    coinsSpent?: number;
    matchWon?: boolean;
    kills?: number;
    deaths?: number;
    score?: number;
    bossDefeated?: boolean;
    isMvp?: boolean;
    ownedCosmetics?: any;
    equippedCosmetics?: any;
  }): Promise<PilotProfile | null> {
    if (!this.token) return null;
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(delta),
      });
      const data = await res.json();
      if (data.success && data.user) {
        this.user = data.user;
        this.persistUser(data.user);
        this.notify();
        return data.user;
      }
    } catch {
      // ignore
    }
    return null;
  }

  public async getTopPilots(): Promise<PilotProfile[]> {
    try {
      const res = await fetch('/api/leaderboard/pilots');
      const data = await res.json();
      return data.pilots || [];
    } catch {
      return [];
    }
  }

  private persistUser(u: PilotProfile) {
    try {
      localStorage.setItem('cyber_user_profile', JSON.stringify(u));
      localStorage.setItem('cyber_player_name', u.username);
    } catch {
      // ignore
    }
  }
}

export const authService = new AuthService();
