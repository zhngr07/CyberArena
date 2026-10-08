import { WebSocket } from 'ws';
import {
  ClientMessage,
  GameMode,
  KillEvent,
  Player,
  PlayerScoreSummary,
  RoomState,
  ServerMessage,
  WeaponModifier,
  WeaponType,
} from '../src/types/game.ts';
import { GameEngine } from './gameEngine.ts';
import { GAME_CONSTANTS } from '../src/data/weapons.ts';

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  roomCode: string;
  reconnectToken: string;
  lastPing: number;
}

const BOT_NAMES = ['Viper_AI', 'CyberGh0st', 'NeonWraith', 'ZeroBit', 'HyperPulse', 'VoidWalker'];
const BOT_COLORS = ['#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  private engines: Map<string, GameEngine> = new Map();
  private connections: Map<WebSocket, ClientConnection> = new Map();
  private reconnectTokens: Map<string, { playerId: string; roomCode: string; disconnectedAt: number }> = new Map();
  private countdownTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // Periodically clean up stale rooms and disconnect tokens
    setInterval(() => {
      this.cleanupStale();
    }, 15000);
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return this.rooms.has(code) ? this.generateCode() : code;
  }

  private broadcast(roomCode: string, message: ServerMessage, excludeWs?: WebSocket) {
    const msgStr = JSON.stringify(message);
    for (const [ws, conn] of this.connections.entries()) {
      if (conn.roomCode === roomCode && ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        ws.send(msgStr);
      }
    }
  }

  private sendTo(ws: WebSocket, message: ServerMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  public handleConnection(ws: WebSocket) {
    ws.on('message', (data: string | Buffer) => {
      try {
        const msg: ClientMessage = JSON.parse(data.toString());
        this.processMessage(ws, msg);
      } catch (err) {
        console.error('Error parsing client message:', err);
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('WebSocket client error:', err);
      this.handleDisconnect(ws);
    });
  }

  private processMessage(ws: WebSocket, msg: ClientMessage) {
    switch (msg.type) {
      case 'create_room':
        this.createRoom(
          ws,
          msg.playerName,
          msg.playerColor,
          msg.mapId,
          msg.cosmetics,
          msg.initialWeapon,
          msg.initialModifiers,
          msg.gameMode
        );
        break;
      case 'join_room':
        this.joinRoom(ws, msg.roomCode, msg.playerName, msg.playerColor, msg.reconnectToken, msg.cosmetics, msg.initialWeapon, msg.initialModifiers);
        break;
      case 'update_loadout': {
        const conn = this.connections.get(ws);
        if (!conn) break;
        const room = this.rooms.get(conn.roomCode);
        if (!room) break;
        const player = room.players[conn.playerId];
        if (!player) break;
        if (msg.weapon) {
          player.weapon = msg.weapon;
          player.loadoutWeapon = msg.weapon;
        }
        if (msg.modifiers) {
          player.activeModifiers = msg.modifiers.slice(0, 3);
          player.loadoutModifiers = [...player.activeModifiers];
        }
        const engine = this.engines.get(conn.roomCode);
        if (engine) {
          const ep = engine.room.players[conn.playerId];
          if (ep) {
            if (msg.weapon) {
              ep.weapon = msg.weapon;
              ep.loadoutWeapon = msg.weapon;
            }
            if (msg.modifiers) {
              ep.activeModifiers = msg.modifiers.slice(0, 3);
              ep.loadoutModifiers = [...ep.activeModifiers];
            }
          }
        }
        this.broadcast(conn.roomCode, { type: 'room_snapshot', room });
        break;
      }
      case 'update_cosmetics':
        this.updateCosmetics(ws, msg.cosmetics);
        break;
      case 'toggle_ready':
        this.toggleReady(ws);
        break;
      case 'add_bot':
        this.addBot(ws);
        break;
      case 'kick_player':
        this.kickPlayer(ws, msg.targetId);
        break;
      case 'change_map':
        this.changeMap(ws, msg.mapId);
        break;
      case 'change_mode':
        this.changeMode(ws, msg.mode);
        break;
      case 'start_game':
        this.startGameNow(ws);
        break;
      case 'input':
        this.handlePlayerInput(ws, msg);
        break;
      case 'play_again':
        this.handlePlayAgain(ws);
        break;
      case 'leave_room':
        this.handleDisconnect(ws);
        break;
      case 'ping': {
        this.sendTo(ws, { type: 'pong', clientTime: msg.timestamp, serverTime: Date.now() });
        const conn = this.connections.get(ws);
        if (conn) {
          const room = this.rooms.get(conn.roomCode);
          if (room && room.players[conn.playerId]) {
            if (typeof msg.lastRtt === 'number' && msg.lastRtt > 0) {
              room.players[conn.playerId].ping = Math.round(msg.lastRtt);
            }
          }
        }
        break;
      }
    }
  }

  private updateCosmetics(ws: WebSocket, cosmetics: any) {
    const conn = this.connections.get(ws);
    if (!conn) return;
    const room = this.rooms.get(conn.roomCode);
    if (!room) return;
    const player = room.players[conn.playerId];
    if (!player) return;
    player.cosmetics = cosmetics;
    this.broadcast(conn.roomCode, { type: 'room_snapshot', room });
  }

  private createRoom(
    ws: WebSocket,
    playerName: string,
    playerColor: string,
    mapId?: string,
    cosmetics?: any,
    initialWeapon?: WeaponType,
    initialModifiers?: WeaponModifier[],
    gameMode?: GameMode
  ) {
    const code = this.generateCode();
    const playerId = `p_${Math.random().toString(36).substring(2, 9)}`;
    const reconnectToken = `tok_${Math.random().toString(36).substring(2, 12)}`;

    const chosenMode: GameMode = gameMode || 'ffa';
    const chosenMap = mapId || (chosenMode === 'boss_raid' ? 'boss_arena' : 'asteroid_field');

    const player: Player = {
      id: playerId,
      name: playerName.trim().substring(0, 16) || 'CyberWarrior',
      color: playerColor || '#06b6d4',
      cosmetics: cosmetics || { shipModel: 'phantom', hat: 'none', trail: 'default', title: 'rookie' },
      isHost: true,
      isReady: true, // Host is ready by default
      ping: 15,
      x: 300,
      y: 300,
      vx: 0,
      vy: 0,
      angle: 0,
      health: GAME_CONSTANTS.MAX_HULL,
      maxHealth: GAME_CONSTANTS.MAX_HULL,
      shield: GAME_CONSTANTS.MAX_SHIELD,
      maxShield: GAME_CONSTANTS.MAX_SHIELD,
      score: 0,
      kills: 0,
      deaths: 0,
      damageDealt: 0,
      shotsFired: 0,
      shotsHit: 0,
      killStreak: 0,
      killStreakTier: 'none',
      bounty: 0,
      assists: 0,
      weapon: initialWeapon || 'plasma',
      activeModifiers: initialModifiers ? initialModifiers.slice(0, 3) : [],
      loadoutWeapon: initialWeapon || 'plasma',
      loadoutModifiers: initialModifiers ? initialModifiers.slice(0, 3) : [],
      isDashing: false,
      dashCooldown: 0,
      speedMultiplier: 1.0,
      speedBoostRemaining: 0,
      invulnerableUntil: 0,
      isDead: false,
      respawnAt: 0,
    };

    const room: RoomState = {
      code,
      hostId: playerId,
      status: 'waiting',
      gameMode: chosenMode,
      countdown: 0,
      matchTimeRemaining: chosenMode === 'boss_raid' ? 300 : GAME_CONSTANTS.MATCH_DURATION_SECONDS, // 5 min for boss raid
      matchDuration: chosenMode === 'boss_raid' ? 300 : GAME_CONSTANTS.MATCH_DURATION_SECONDS,
      mapId: chosenMap,
      players: { [playerId]: player },
      projectiles: [],
      powerUps: [],
      obstacles: [],
      killFeed: [],
    };

    this.rooms.set(code, room);
    this.connections.set(ws, { ws, playerId, roomCode: code, reconnectToken, lastPing: Date.now() });
    this.reconnectTokens.set(reconnectToken, { playerId, roomCode: code, disconnectedAt: 0 });

    this.sendTo(ws, {
      type: 'joined',
      player,
      room,
      reconnectToken,
    });
  }

  private joinRoom(
    ws: WebSocket,
    rawCode: string,
    playerName: string,
    playerColor: string,
    reconnectToken?: string,
    cosmetics?: any,
    initialWeapon?: WeaponType,
    initialModifiers?: WeaponModifier[]
  ) {
    const code = rawCode.trim().toUpperCase();
    const room = this.rooms.get(code);

    if (!room) {
      this.sendTo(ws, { type: 'error', message: `Room "${code}" not found. Check code or create a new room!` });
      return;
    }

    // Check reconnection
    if (reconnectToken && this.reconnectTokens.has(reconnectToken)) {
      const reconn = this.reconnectTokens.get(reconnectToken)!;
      if (reconn.roomCode === code && room.players[reconn.playerId]) {
        const existingPlayer = room.players[reconn.playerId];
        if (cosmetics) existingPlayer.cosmetics = cosmetics;
        this.connections.set(ws, { ws, playerId: existingPlayer.id, roomCode: code, reconnectToken, lastPing: Date.now() });

        this.sendTo(ws, {
          type: 'joined',
          player: existingPlayer,
          room,
          reconnectToken,
        });

        this.broadcast(code, { type: 'player_reconnected', playerId: existingPlayer.id, name: existingPlayer.name }, ws);
        return;
      }
    }

    // Check capacity
    const currentCount = Object.keys(room.players).length;
    if (currentCount >= 8) {
      this.sendTo(ws, { type: 'error', message: 'Room is already full (max 8 players).' });
      return;
    }

    const playerId = `p_${Math.random().toString(36).substring(2, 9)}`;
    const newReconnectToken = `tok_${Math.random().toString(36).substring(2, 12)}`;

    const player: Player = {
      id: playerId,
      name: playerName.trim().substring(0, 16) || `CyberPilot_${Math.floor(Math.random() * 900 + 100)}`,
      color: playerColor || '#ec4899',
      cosmetics: cosmetics || { shipModel: 'phantom', hat: 'none', trail: 'default', title: 'rookie' },
      isHost: false,
      isReady: false,
      ping: 20,
      x: 600,
      y: 600,
      vx: 0,
      vy: 0,
      angle: 0,
      health: GAME_CONSTANTS.MAX_HULL,
      maxHealth: GAME_CONSTANTS.MAX_HULL,
      shield: GAME_CONSTANTS.MAX_SHIELD,
      maxShield: GAME_CONSTANTS.MAX_SHIELD,
      score: 0,
      kills: 0,
      deaths: 0,
      damageDealt: 0,
      shotsFired: 0,
      shotsHit: 0,
      killStreak: 0,
      killStreakTier: 'none',
      bounty: 0,
      assists: 0,
      weapon: initialWeapon || 'plasma',
      activeModifiers: initialModifiers ? initialModifiers.slice(0, 3) : [],
      loadoutWeapon: initialWeapon || 'plasma',
      loadoutModifiers: initialModifiers ? initialModifiers.slice(0, 3) : [],
      isDashing: false,
      dashCooldown: 0,
      speedMultiplier: 1.0,
      speedBoostRemaining: 0,
      invulnerableUntil: 0,
      isDead: false,
      respawnAt: 0,
    };

    room.players[playerId] = player;
    this.connections.set(ws, { ws, playerId, roomCode: code, reconnectToken: newReconnectToken, lastPing: Date.now() });
    this.reconnectTokens.set(newReconnectToken, { playerId, roomCode: code, disconnectedAt: 0 });

    this.sendTo(ws, {
      type: 'joined',
      player,
      room,
      reconnectToken: newReconnectToken,
    });

    this.broadcast(code, { type: 'room_snapshot', room });
  }

  private toggleReady(ws: WebSocket) {
    const conn = this.connections.get(ws);
    if (!conn) return;
    const room = this.rooms.get(conn.roomCode);
    if (!room || room.status !== 'waiting') return;

    const player = room.players[conn.playerId];
    if (!player) return;

    player.isReady = !player.isReady;
    this.broadcast(conn.roomCode, { type: 'room_snapshot', room });

    this.checkAutoStart(conn.roomCode);
  }

  private addBot(ws: WebSocket) {
    const conn = this.connections.get(ws);
    if (!conn) return;
    const room = this.rooms.get(conn.roomCode);
    if (!room || room.hostId !== conn.playerId) return;

    const currentCount = Object.keys(room.players).length;
    if (currentCount >= 8) return;

    const botId = `bot_${Math.random().toString(36).substring(2, 7)}`;
    const botIdx = currentCount % BOT_NAMES.length;
    const botName = `${BOT_NAMES[botIdx]}`;
    const botColor = BOT_COLORS[botIdx];

    const botModels = ['phantom', 'dragon', 'raven', 'dreadnought', 'ufo'] as const;
    const botHats = ['none', 'visor', 'horns', 'halo', 'samurai', 'headset'] as const;
    const botTrails = ['fire', 'lightning', 'rainbow', 'matrix', 'stars'] as const;
    const botTitles = ['sniper', 'slayer', 'untouchable', 'legend'] as const;

    const botPlayer: Player = {
      id: botId,
      name: botName,
      color: botColor,
      cosmetics: {
        shipModel: botModels[botIdx % botModels.length],
        hat: botHats[botIdx % botHats.length],
        trail: botTrails[botIdx % botTrails.length],
        title: botTitles[botIdx % botTitles.length],
      },
      isHost: false,
      isReady: true,
      isBot: true,
      ping: 5,
      x: 800,
      y: 500,
      vx: 0,
      vy: 0,
      angle: 0,
      health: GAME_CONSTANTS.MAX_HULL,
      maxHealth: GAME_CONSTANTS.MAX_HULL,
      shield: GAME_CONSTANTS.MAX_SHIELD,
      maxShield: GAME_CONSTANTS.MAX_SHIELD,
      score: 0,
      kills: 0,
      deaths: 0,
      damageDealt: 0,
      shotsFired: 0,
      shotsHit: 0,
      killStreak: 0,
      killStreakTier: 'none',
      bounty: 0,
      assists: 0,
      weapon: (['plasma', 'burst_cannon', 'spread', 'ricochet_cannon', 'plasma_shotgun', 'missile_launcher'] as WeaponType[])[botIdx % 6],
      activeModifiers: [
        (['homing', 'explosive', 'rapid_fire', 'ricochet', 'shield_breaker', 'freeze', 'gravity', 'chain'] as WeaponModifier[])[botIdx % 8],
      ],
      loadoutWeapon: (['plasma', 'burst_cannon', 'spread', 'ricochet_cannon', 'plasma_shotgun', 'missile_launcher'] as WeaponType[])[botIdx % 6],
      loadoutModifiers: [
        (['homing', 'explosive', 'rapid_fire', 'ricochet', 'shield_breaker', 'freeze', 'gravity', 'chain'] as WeaponModifier[])[botIdx % 8],
      ],
      isDashing: false,
      dashCooldown: 0,
      speedMultiplier: 1.0,
      speedBoostRemaining: 0,
      invulnerableUntil: 0,
      isDead: false,
      respawnAt: 0,
    };

    room.players[botId] = botPlayer;
    this.broadcast(conn.roomCode, { type: 'room_snapshot', room });
    this.checkAutoStart(conn.roomCode);
  }

  private changeMode(ws: WebSocket, mode: any) {
    const conn = this.connections.get(ws);
    if (!conn) return;
    const room = this.rooms.get(conn.roomCode);
    if (!room || room.hostId !== conn.playerId || room.status !== 'waiting') return;

    room.gameMode = mode;
    this.broadcast(conn.roomCode, { type: 'room_snapshot', room });
  }

  private kickPlayer(ws: WebSocket, targetId: string) {
    const conn = this.connections.get(ws);
    if (!conn) return;
    const room = this.rooms.get(conn.roomCode);
    if (!room || room.hostId !== conn.playerId) return;

    if (room.players[targetId]) {
      const target = room.players[targetId];
      delete room.players[targetId];

      // Disconnect client if human
      for (const [cWs, cConn] of this.connections.entries()) {
        if (cConn.playerId === targetId) {
          this.sendTo(cWs, { type: 'error', message: 'You were kicked from the room by the host.' });
          this.connections.delete(cWs);
          cWs.close();
          break;
        }
      }

      this.broadcast(conn.roomCode, { type: 'room_snapshot', room });
    }
  }

  private changeMap(ws: WebSocket, mapId: string) {
    const conn = this.connections.get(ws);
    if (!conn) return;
    const room = this.rooms.get(conn.roomCode);
    if (!room || room.hostId !== conn.playerId || room.status !== 'waiting') return;

    room.mapId = mapId;
    this.broadcast(conn.roomCode, { type: 'room_snapshot', room });
  }

  private checkAutoStart(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'waiting') return;

    const playersList = Object.values(room.players);
    if (playersList.length >= 2 && playersList.every((p) => p.isReady)) {
      this.startCountdown(roomCode);
    } else {
      this.cancelCountdown(roomCode);
    }
  }

  private startCountdown(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room || room.status === 'starting' || room.status === 'playing') return;

    room.status = 'starting';
    let count = 3;
    room.countdown = count;

    this.broadcast(roomCode, { type: 'countdown_tick', count });

    const timer = setInterval(() => {
      count--;
      room.countdown = count;
      if (count > 0) {
        this.broadcast(roomCode, { type: 'countdown_tick', count });
      } else {
        clearInterval(timer);
        this.countdownTimers.delete(roomCode);
        this.launchGame(roomCode);
      }
    }, 1000);

    this.countdownTimers.set(roomCode, timer);
  }

  private cancelCountdown(roomCode: string) {
    const timer = this.countdownTimers.get(roomCode);
    if (timer) {
      clearInterval(timer);
      this.countdownTimers.delete(roomCode);
    }
    const room = this.rooms.get(roomCode);
    if (room && room.status === 'starting') {
      room.status = 'waiting';
      room.countdown = 0;
      this.broadcast(roomCode, { type: 'room_snapshot', room });
    }
  }

  private startGameNow(ws: WebSocket) {
    const conn = this.connections.get(ws);
    if (!conn) return;
    const room = this.rooms.get(conn.roomCode);
    if (!room || room.hostId !== conn.playerId) return;

    // Force start even with 1 player (solo training) or countdown skip
    this.cancelCountdown(conn.roomCode);
    this.launchGame(conn.roomCode);
  }

  private launchGame(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    // Create & run game engine
    const engine = new GameEngine(room, {
      onTick: (tickData) => {
        this.broadcast(roomCode, {
          type: 'game_tick',
          players: tickData.players,
          projectiles: tickData.projectiles,
          powerUps: tickData.powerUps,
          obstacles: tickData.obstacles,
          timeRemaining: tickData.timeRemaining,
          serverTime: tickData.serverTime,
          currentEvent: tickData.currentEvent,
          bountyLeaderId: tickData.bountyLeaderId,
          bountyAmount: tickData.bountyAmount,
          boss: tickData.boss,
        });
      },
      onKill: (kill: KillEvent) => {
        this.broadcast(roomCode, { type: 'kill', kill });
      },
      onGameOver: (scores: PlayerScoreSummary[], winner: PlayerScoreSummary) => {
        this.broadcast(roomCode, { type: 'game_over', scores, winner });
      },
      onPerfectDash: (playerId, bonusScore) => {
        this.broadcast(roomCode, { type: 'perfect_dash', playerId, bonusScore });
      },
      onBountyPlaced: (playerId, playerName, bounty) => {
        this.broadcast(roomCode, { type: 'bounty_placed', playerId, playerName, bounty });
      },
      onBountyClaimed: (killerName, victimName, bounty) => {
        this.broadcast(roomCode, { type: 'bounty_claimed', killerName, victimName, bounty });
      },
      onEventAlert: (event) => {
        this.broadcast(roomCode, { type: 'event_alert', event });
      },
    });

    this.engines.set(roomCode, engine);
    engine.start();

    this.broadcast(roomCode, { type: 'game_started' });
  }

  private handlePlayerInput(ws: WebSocket, msg: Extract<ClientMessage, { type: 'input' }>) {
    const conn = this.connections.get(ws);
    if (!conn) return;
    const engine = this.engines.get(conn.roomCode);
    if (engine && engine.room.status === 'playing') {
      engine.setPlayerInput(conn.playerId, msg.input);
    }
  }

  private handlePlayAgain(ws: WebSocket) {
    const conn = this.connections.get(ws);
    if (!conn) return;
    const room = this.rooms.get(conn.roomCode);
    if (!room) return;

    const existingEngine = this.engines.get(conn.roomCode);
    if (existingEngine) {
      existingEngine.stop();
      this.engines.delete(conn.roomCode);
    }

    room.status = 'waiting';
    room.matchTimeRemaining = GAME_CONSTANTS.MATCH_DURATION_SECONDS;
    room.winnerId = undefined;
    room.killFeed = [];
    room.projectiles = [];
    room.powerUps = [];

    // Reset scores & ready state
    for (const p of Object.values(room.players)) {
      p.score = 0;
      p.kills = 0;
      p.deaths = 0;
      p.damageDealt = 0;
      p.shotsFired = 0;
      p.shotsHit = 0;
      p.health = GAME_CONSTANTS.MAX_HEALTH;
      p.shield = GAME_CONSTANTS.MAX_SHIELD;
      p.isDead = false;
      p.isReady = p.id === room.hostId || Boolean(p.isBot);
    }

    this.broadcast(conn.roomCode, { type: 'room_snapshot', room });
  }

  public handleDisconnect(ws: WebSocket) {
    const conn = this.connections.get(ws);
    if (!conn) return;

    this.connections.delete(ws);
    const room = this.rooms.get(conn.roomCode);
    if (!room) return;

    const player = room.players[conn.playerId];
    if (!player) return;

    // Save token with timestamp for 20s reconnect window
    this.reconnectTokens.set(conn.reconnectToken, {
      playerId: conn.playerId,
      roomCode: conn.roomCode,
      disconnectedAt: Date.now(),
    });

    this.broadcast(conn.roomCode, {
      type: 'player_disconnected',
      playerId: player.id,
      name: player.name,
    });

    // If host left, assign new host if players exist
    if (room.hostId === conn.playerId) {
      const remainingHuman = Object.values(room.players).find((p) => p.id !== conn.playerId && !p.isBot);
      if (remainingHuman) {
        room.hostId = remainingHuman.id;
        remainingHuman.isHost = true;
      }
    }

    // If waiting in lobby and disconnected, remove after short delay if no reconnect
    setTimeout(() => {
      const isReconnected = Array.from(this.connections.values()).some(
        (c) => c.playerId === conn.playerId
      );
      if (!isReconnected && room.players[conn.playerId]) {
        delete room.players[conn.playerId];
        this.broadcast(conn.roomCode, { type: 'room_snapshot', room });
      }
    }, 12000);
  }

  private cleanupStale() {
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      const hasActiveSockets = Array.from(this.connections.values()).some((c) => c.roomCode === code);
      if (!hasActiveSockets) {
        // Room has no connected sockets
        const engine = this.engines.get(code);
        if (engine) {
          engine.stop();
          this.engines.delete(code);
        }
        this.rooms.delete(code);
      }
    }

    for (const [token, data] of this.reconnectTokens.entries()) {
      if (data.disconnectedAt > 0 && now - data.disconnectedAt > 30000) {
        this.reconnectTokens.delete(token);
      }
    }
  }

  public getPublicRoomsSummary() {
    const list: Array<{ code: string; playersCount: number; mapId: string; status: string }> = [];
    for (const [code, room] of this.rooms.entries()) {
      list.push({
        code,
        playersCount: Object.keys(room.players).length,
        mapId: room.mapId,
        status: room.status,
      });
    }
    return list;
  }
}
