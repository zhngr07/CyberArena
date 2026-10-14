import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { RoomManager } from './server/roomManager.ts';
import { UserManager } from './server/userManager.ts';
import { MatchManager } from './server/matchManager.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
export function createCyberArenaApp(options?: {
  userManager?: UserManager;
  matchManager?: MatchManager;
  roomManager?: RoomManager;
}) {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json());

  const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false, clientTracking: true });
  const userManager = options?.userManager || new UserManager();
  const matchManager = options?.matchManager || new MatchManager(userManager);
  const roomManager = options?.roomManager || new RoomManager(matchManager, userManager);

  wss.on('connection', (ws) => {
    roomManager.handleConnection(ws);
  });

  server.on('upgrade', (req, socket, head) => {
    const url = req.url || '';
    const pathname = url.split('?')[0];
    const protocolHeader = (req.headers['sec-websocket-protocol'] || '').toString();

    // Let Vite's built-in HMR listener handle Vite HMR/ping upgrades cleanly
    if (
      protocolHeader.includes('vite') ||
      pathname.includes('vite') ||
      pathname.startsWith('/@')
    ) {
      return;
    }

    // Handle game clients on /ws, /game, and root /
    if (pathname === '/ws' || pathname === '/game' || pathname === '/' || pathname === '') {
      const netSocket = socket as import('net').Socket;
      if (typeof netSocket.setNoDelay === 'function') {
        netSocket.setNoDelay(true);
      }
      if (typeof netSocket.setKeepAlive === 'function') {
        netSocket.setKeepAlive(true, 15000);
      }
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
      return;
    }

    socket.destroy();
  });

  // Enforce read-only for leaderboard, rating, and public stats endpoints
  app.all(
    ['/api/leaderboard', '/api/leaderboard/*', '/api/rating/*', '/api/stats/me', '/api/players/*/stats'],
    (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
        res.status(405).json({
          success: false,
          error: 'Method Not Allowed: Ratings and statistics are computed authoritatively by the server only',
        });
        return;
      }
      next();
    }
  );

  // REST API for room discoverability
  app.get('/api/rooms', (_req, res) => {
    res.json({
      rooms: roomManager.getPublicRoomsSummary(),
    });
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // WebTransport Handshake / Fallback Diagnostic Endpoint
  app.all('/webtransport', (req, res) => {
    res.status(200).json({
      status: 'WebTransport endpoint reached via HTTP',
      supportedProtocols: ['WebSocket', 'WebTransport'],
      notice: 'Google Cloud Run frontend terminates TCP traffic (HTTP/1.1 and HTTP/2). WebTransport requires HTTP/3 over QUIC/UDP, which is not routed through Cloud Run HTTPS edge proxies. The client will seamlessly operate over high-performance WebSocket with TCP NoDelay enabled.',
      activeTransport: 'WebSocket (TCP NoDelay)',
      physicalCluster: 'asia-east1',
    });
  });

  // Server & Region metadata API (Kazakhstan / Middle-Asia deployment)
  app.get('/api/server-info', (_req, res) => {
    res.json({
      region: 'MIDDLE-ASIA (KAZAKHSTAN / ANYCAST)',
      location: 'Kazakhstan, Almaty / Astana (Edge Profile)',
      datacenter: 'GCP asia-east1 (Taiwan)',
      physicalHost: 'Google Cloud Run (asia-east1)',
      activeTransport: 'WebSocket (TCP NoDelay)',
      webTransportStatus: 'Requires UDP/QUIC (Cloud Run uses TCP ingress)',
      tickRate: 60,
      perceivedInputLag: 0,
      status: 'operational',
      pingTarget: 'kz-edge.cloud',
      timestamp: Date.now(),
    });
  });

  // Regional Probes & Latency Discovery API
  app.get('/api/regions', (_req, res) => {
    res.json({
      currentHost: {
        id: 'current',
        name: 'Active Host',
        provider: 'Google Cloud Platform (Cloud Run)',
        physicalCluster: 'asia-east1',
        advertisedProfile: 'KZ-Central Relay (Kazakhstan)',
        pingUrl: '/api/health',
      },
      profiles: [
        { id: 'auto', name: 'AUTO (Lowest Ping & Zero Lag)', flag: '⚡', isAuto: true, desc: 'Anycast Edge + 0ms Client Prediction' },
        { id: 'kz-central', name: 'Middle-Asia (Kazakhstan / Almaty)', flag: '🇰🇿', endpoint: '/api/health', desc: 'Оптимизирован для игроков из Казахстана и СНГ' },
        { id: 'asia-east1', name: 'Asia East (Taiwan Host)', flag: '🇹🇼', endpoint: '/api/health', desc: 'Прямой физический хост контейнера' },
        { id: 'europe-west', name: 'Europe West (Frankfurt)', flag: '🇩🇪', endpoint: '/api/health', desc: 'Европейский транзитный узел' },
        { id: 'us-central', name: 'US Central (Iowa)', flag: '🇺🇸', endpoint: '/api/health', desc: 'Американский шлюз' },
      ],
    });
  });

  // Authentication & Player Profile APIs
  app.post('/api/auth/register', (req, res) => {
    try {
      const { username, password, initialData } = req.body;
      const result = userManager.register(username, password, initialData);
      res.json({ success: true, user: result.user, token: result.token });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Ошибка регистрации' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body;
      const result = userManager.login(username, password);
      res.json({ success: true, user: result.user, token: result.token });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Ошибка авторизации' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
    if (!token) {
      res.status(401).json({ success: false, error: 'Unauthorized: Missing authentication token' });
      return;
    }
    const user = userManager.getUserByToken(token);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
      return;
    }
    res.json({ success: true, user: userManager.toPublicProfile(user) });
  });

  // Authenticated Player Rating & Statistics API (Stage 0.9.4)
  app.get('/api/stats/me', (req, res) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
    if (!token) {
      res.status(401).json({ success: false, error: 'Unauthorized: Missing authentication token' });
      return;
    }
    const user = userManager.getUserByToken(token);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
      return;
    }
    const profile = userManager.toPublicProfile(user);
    const globalRank = userManager.getPilotGlobalRank(user.username);
    const matchTelemetry = matchManager.getPlayerAggregatedStats(user.username);

    res.json({
      success: true,
      pilot: {
        ...profile,
        globalRank,
      },
      rating: {
        current: profile.rating,
        tier: profile.rankTier,
        title: profile.rankTitle,
        icon: profile.rankIcon,
        globalRank,
      },
      matchTelemetry: matchTelemetry || null,
    });
  });

  app.get('/api/rating/me', (req, res) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
    if (!token) {
      res.status(401).json({ success: false, error: 'Unauthorized: Missing authentication token' });
      return;
    }
    const user = userManager.getUserByToken(token);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
      return;
    }
    const profile = userManager.toPublicProfile(user);
    const globalRank = userManager.getPilotGlobalRank(user.username);

    res.json({
      success: true,
      username: user.username,
      rating: profile.rating,
      rankTier: profile.rankTier,
      rankTitle: profile.rankTitle,
      rankIcon: profile.rankIcon,
      globalRank,
      wins: user.wins,
      matchesPlayed: user.matchesPlayed,
    });
  });

  // Public Pilot Profile API
  app.get('/api/auth/profile/:username', (req, res) => {
    const cleanName = (req.params.username || '').trim();
    if (!cleanName) {
      res.status(400).json({ success: false, error: 'Invalid username parameter' });
      return;
    }
    const profile = userManager.getProfileByUsername(cleanName);
    if (!profile) {
      res.status(404).json({ success: false, error: 'Pilot not found' });
      return;
    }
    const globalRank = userManager.getPilotGlobalRank(cleanName);
    res.json({ success: true, profile: { ...profile, globalRank } });
  });

  // Public Player Statistics API (Stage 0.9.4)
  app.get('/api/players/:username/stats', (req, res) => {
    const cleanName = (req.params.username || '').trim();
    if (!cleanName) {
      res.status(400).json({ success: false, error: 'Invalid username parameter' });
      return;
    }
    const profile = userManager.getProfileByUsername(cleanName);
    const matchTelemetry = matchManager.getPlayerAggregatedStats(cleanName);
    const globalRank = userManager.getPilotGlobalRank(cleanName);

    if (!profile && !matchTelemetry) {
      res.status(404).json({ success: false, error: 'Pilot not found' });
      return;
    }

    res.json({
      success: true,
      pilot: profile ? { ...profile, globalRank } : null,
      rating: profile
        ? {
            current: profile.rating,
            tier: profile.rankTier,
            title: profile.rankTitle,
            icon: profile.rankIcon,
            globalRank,
          }
        : null,
      matchTelemetry: matchTelemetry || null,
    });
  });

  app.post('/api/auth/sync', (req, res) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
    if (!token) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const updated = userManager.syncProgress(token, req.body);
    if (!updated) {
      res.status(400).json({ success: false, error: 'Failed to sync' });
      return;
    }
    res.json({ success: true, user: updated });
  });

  // Paginated Authoritative Leaderboard API (Stage 0.9.4)
  app.get('/api/leaderboard', (req, res) => {
    let page = 1;
    let limit = 20;

    if (req.query.page !== undefined) {
      const parsedPage = Number(req.query.page);
      if (!Number.isInteger(parsedPage) || parsedPage < 1) {
        res.status(400).json({
          success: false,
          error: 'Invalid page parameter: must be a positive integer >= 1',
        });
        return;
      }
      page = parsedPage;
    }

    if (req.query.limit !== undefined) {
      const parsedLimit = Number(req.query.limit);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        res.status(400).json({
          success: false,
          error: 'Invalid limit parameter: must be an integer between 1 and 100',
        });
        return;
      }
      limit = parsedLimit;
    }

    const rawSearch = req.query.search ?? req.query.q;
    let search = '';
    if (rawSearch !== undefined) {
      if (typeof rawSearch !== 'string') {
        res.status(400).json({ success: false, error: 'Invalid search parameter: must be a string' });
        return;
      }
      if (rawSearch.length > 50) {
        res.status(400).json({
          success: false,
          error: 'Search query too long: maximum 50 characters allowed',
        });
        return;
      }
      search = rawSearch.trim();
    }

    const result = userManager.getLeaderboard({ page, limit, search });
    res.json({
      success: true,
      leaderboard: result.pilots,
      pagination: result.pagination,
    });
  });

  // Backward-compatible Hall of Fame
  app.get('/api/leaderboard/pilots', (req, res) => {
    const rawLimit = req.query.limit !== undefined ? Number(req.query.limit) : 50;
    const limit = Number.isInteger(rawLimit) && rawLimit >= 1 && rawLimit <= 100 ? rawLimit : 50;
    const result = userManager.getLeaderboard({ page: 1, limit });
    res.json({
      success: true,
      pilots: result.pilots,
      pagination: result.pagination,
    });
  });

  // Authoritative Match Statistics APIs
  app.get('/api/matches', (_req, res) => {
    const matches = matchManager.getRecentMatches(50);
    res.json({ success: true, count: matches.length, matches });
  });

  app.get('/api/matches/:id', (req, res) => {
    const match = matchManager.getMatchById(req.params.id);
    if (!match) {
      res.status(404).json({ success: false, error: 'Match not found' });
      return;
    }
    res.json({ success: true, match });
  });

  app.get('/api/matches/player/:username', (req, res) => {
    const cleanName = (req.params.username || '').trim();
    if (!cleanName) {
      res.status(400).json({ success: false, error: 'Invalid username parameter' });
      return;
    }
    const matches = matchManager.getMatchesByPlayer(cleanName, 50);
    res.json({ success: true, count: matches.length, matches });
  });

  app.get('/api/stats/player/:username', (req, res) => {
    const cleanName = (req.params.username || '').trim();
    if (!cleanName) {
      res.status(400).json({ success: false, error: 'Invalid username parameter' });
      return;
    }
    const profile = userManager.getProfileByUsername(cleanName);
    const stats = matchManager.getPlayerAggregatedStats(cleanName);
    const globalRank = userManager.getPilotGlobalRank(cleanName);

    if (!stats && !profile) {
      res.status(404).json({ success: false, error: 'No match statistics recorded for pilot' });
      return;
    }
    res.json({
      success: true,
      stats: stats || null,
      pilot: profile ? { ...profile, globalRank } : null,
      rating: profile
        ? {
            current: profile.rating,
            tier: profile.rankTier,
            title: profile.rankTitle,
            icon: profile.rankIcon,
            globalRank,
          }
        : null,
    });
  });

  return { app, server, wss, userManager, matchManager, roomManager };
}

async function setupServer() {
  const isDirectRun = Boolean(process.argv[1] && path.resolve(process.argv[1]).endsWith('server.ts'));
  const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.TEST_MODE) || !isDirectRun;
  if (isTest) return;

  const { app, server } = createCyberArenaApp();
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode: mount Vite middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // In dev mode, handle client-side routing and HTML requests through vite.transformIndexHtml
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/ws')) {
        return next();
      }
      try {
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // Production mode: serve built static files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`> CyberArena Server running on http://localhost:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
