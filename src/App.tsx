import { useState, useEffect, useRef } from 'react';
import { networkManager } from './services/network.ts';
import { soundManager } from './services/audio.ts';
import { authService, PilotProfile } from './services/auth.ts';
import { Header } from './components/Header.tsx';
import { MainMenu } from './components/MainMenu.tsx';
import { LobbyRoom } from './components/LobbyRoom.tsx';
import { GameCanvas } from './components/GameCanvas.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { HowToPlayModal } from './components/HowToPlayModal.tsx';
import { ShopModal } from './components/ShopModal.tsx';
import { WhatsNewModal } from './components/WhatsNewModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { PilotLeaderboardModal } from './components/PilotLeaderboardModal.tsx';
import {
  Bullet,
  KillEvent,
  MapObstacle,
  Player,
  PlayerCosmetics,
  PlayerInput,
  PlayerScoreSummary,
  PowerUp,
  RoomState,
  BossState,
  GameMode,
} from './types/game.ts';
import { Language } from './data/translations.ts';
import { getEquippedCosmetics, getSavedCoins } from './data/shopItems.ts';
import { MobileControlSettings, loadMobileSettings, saveMobileSettings } from './types/mobileControls.ts';

type AppView = 'menu' | 'lobby' | 'game';

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      return (localStorage.getItem('cyber_lang') as Language) || 'ru';
    } catch {
      return 'ru';
    }
  });

  const [mobileSettings, setMobileSettings] = useState<MobileControlSettings>(() => loadMobileSettings());

  const handleUpdateMobileSettings = (newSettings: MobileControlSettings) => {
    setMobileSettings(newSettings);
    saveMobileSettings(newSettings);
  };

  const [coins, setCoins] = useState<number>(() => getSavedCoins());

  const [cosmetics, setCosmetics] = useState<PlayerCosmetics>(() => getEquippedCosmetics());

  const [playerName, setPlayerName] = useState(() => {
    try {
      return localStorage.getItem('cyber_player_name') || `Pilot_${Math.floor(Math.random() * 900 + 100)}`;
    } catch {
      return 'Pilot_101';
    }
  });

  const [playerColor, setPlayerColor] = useState(() => {
    try {
      return localStorage.getItem('cyber_player_color') || '#06b6d4';
    } catch {
      return '#06b6d4';
    }
  });

  const [view, setView] = useState<AppView>('menu');
  const [room, setRoom] = useState<RoomState | null>(null);
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);
  const [latency, setLatency] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & Settings
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showShop, setShowShop] = useState<boolean>(false);
  const [showWhatsNew, setShowWhatsNew] = useState<boolean>(false);
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  // Pilot Profile & Auth State
  const [currentUser, setCurrentUser] = useState<PilotProfile | null>(() => authService.getCurrentUser());

  // Boss Raid State
  const [boss, setBoss] = useState<BossState | null>(null);

  // Sync auth updates
  useEffect(() => {
    const unsub = authService.subscribe((user) => {
      setCurrentUser(user);
      if (user) {
        setPlayerName(user.username);
        setCoins(user.coins);
      }
    });
    return () => unsub();
  }, []);

  // UI Scale & Debug Overlay
  const [uiScale, setUiScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('cyber_ui_scale');
      if (saved) return parseFloat(saved) || 1.0;
      // Default to 0.85 on small screens for comfortable mobile viewing
      return window.innerWidth < 640 ? 0.85 : 1.0;
    } catch {
      return 1.0;
    }
  });

  const [showDebug, setShowDebug] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cyber_debug_network') === 'true';
    } catch {
      return false;
    }
  });

  const [fpsBoost, setFpsBoost] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cyber_fps_boost');
      return saved !== null ? saved === 'true' : true; // Default ON for 60-120 FPS
    } catch {
      return true;
    }
  });

  const handleToggleFpsBoost = (boost: boolean) => {
    setFpsBoost(boost);
    try {
      localStorage.setItem('cyber_fps_boost', String(boost));
    } catch {
      // ignore
    }
  };

  const handleUiScaleChange = (scale: number) => {
    setUiScale(scale);
    try {
      localStorage.setItem('cyber_ui_scale', scale.toString());
    } catch {
      // ignore
    }
  };

  const handleToggleDebug = (show: boolean) => {
    setShowDebug(show);
    try {
      localStorage.setItem('cyber_debug_network', String(show));
    } catch {
      // ignore
    }
  };

  // In-Game Live State
  const [playersTick, setPlayersTick] = useState<Record<string, Partial<Player>>>({});
  const [projectiles, setProjectiles] = useState<Bullet[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [obstacles, setObstacles] = useState<MapObstacle[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(180);
  const [killFeed, setKillFeed] = useState<KillEvent[]>([]);
  const [gameOverData, setGameOverData] = useState<{
    scores: PlayerScoreSummary[];
    winner: PlayerScoreSummary;
  } | null>(null);

  // Keep player preferences in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cyber_lang', lang);
    } catch {
      // ignore
    }
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem('cyber_player_name', playerName);
    } catch {
      // ignore
    }
  }, [playerName]);

  useEffect(() => {
    try {
      localStorage.setItem('cyber_player_color', playerColor);
    } catch {
      // ignore
    }
  }, [playerColor]);

  // Eager connection & real-time ping monitor
  useEffect(() => {
    networkManager.connect().catch(() => {});

    const unsubStats = networkManager.onStats((stats) => {
      if (stats.ping > 0) {
        setLatency(stats.ping);
      }
    });

    const interval = setInterval(() => {
      if (networkManager.latency > 0) {
        setLatency(networkManager.latency);
      }
    }, 300);

    return () => {
      clearInterval(interval);
      unsubStats();
    };
  }, []);

  // Setup WebSocket subscriptions
  useEffect(() => {
    const unsubJoined = networkManager.onJoined(({ player, room }) => {
      setLocalPlayer(player);
      setRoom(room);
      setErrorMessage(null);
      setIsConnecting(false);

      if (room.status === 'playing') {
        setView('game');
      } else {
        setView('lobby');
      }
    });

    const unsubRoom = networkManager.onRoomUpdate((updatedRoom) => {
      setRoom(updatedRoom);
      const myId = networkManager.getLocalPlayerId();
      if (myId && updatedRoom.players[myId]) {
        setLocalPlayer(updatedRoom.players[myId]);
      }
      if (updatedRoom.status === 'playing') {
        setView('game');
      } else if (updatedRoom.status === 'waiting' || updatedRoom.status === 'starting') {
        setGameOverData(null);
        setView('lobby');
      }
    });

    let lastReportedSec = -1;
    const unsubTick = networkManager.onTick((tick) => {
      const sec = Math.ceil(tick.timeRemaining);
      if (sec !== lastReportedSec) {
        lastReportedSec = sec;
        setTimeRemaining(sec);
      }
      if (tick.boss !== undefined) {
        setBoss(tick.boss);
      }
      // Note: High-frequency entity ticks are consumed directly by GameCanvas via networkManager.onTick
      // with 0ms latency, eliminating React main-thread render stalls.
    });

    const unsubCountdown = networkManager.onCountdown((count) => {
      soundManager.playCountdown(count === 1);
      setRoom((prev) => (prev ? { ...prev, countdown: count, status: 'starting' } : null));
    });

    const unsubGameStart = networkManager.onGameStart(() => {
      soundManager.playGameStart();
      setGameOverData(null);
      setView('game');
    });

    const unsubKill = networkManager.onKill((kill) => {
      setKillFeed((prev) => [kill, ...prev.slice(0, 7)]);
      const myId = networkManager.getLocalPlayerId();
      if (myId === kill.killerId) {
        soundManager.playPickup();
      }
    });

    const unsubGameOver = networkManager.onGameOver((data) => {
      setGameOverData(data);
      // Refresh coins
      setCoins(getSavedCoins());
    });

    const unsubError = networkManager.onError((msg) => {
      setErrorMessage(msg);
      setIsConnecting(false);
    });

    const unsubDisconnect = networkManager.onDisconnect(() => {
      // Disconnected
    });

    return () => {
      unsubJoined();
      unsubRoom();
      unsubTick();
      unsubCountdown();
      unsubGameStart();
      unsubKill();
      unsubGameOver();
      unsubError();
      unsubDisconnect();
    };
  }, []);

  // Check URL query param ?room=CODE on load for 1-click friend join!
  const hasAutoJoined = useRef(false);
  useEffect(() => {
    if (hasAutoJoined.current) return;
    hasAutoJoined.current = true;

    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      handleJoinRoom(roomFromUrl.toUpperCase());
    }
  }, []);

  // Actions
  const handleCreateRoom = async (mapId: string = 'neon_grid', mode?: GameMode) => {
    setIsConnecting(true);
    setErrorMessage(null);
    try {
      await networkManager.createRoom(playerName, playerColor, mapId, mode, cosmetics);
    } catch (err) {
      console.error(err);
      setErrorMessage(lang === 'ru' ? 'Ошибка подключения к серверу. Попробуйте еще раз.' : 'Failed to connect to server. Retrying...');
      setIsConnecting(false);
    }
  };

  const handleCreateBossRaid = async () => {
    await handleCreateRoom('boss_arena', 'boss_raid');
  };

  const handleJoinRoom = async (code: string) => {
    setIsConnecting(true);
    setErrorMessage(null);
    try {
      await networkManager.joinRoom(code, playerName, playerColor, cosmetics);
    } catch (err) {
      console.error(err);
      setErrorMessage(lang === 'ru' ? 'Не удалось подключиться к комнате.' : 'Could not connect to room server.');
      setIsConnecting(false);
    }
  };

  // Instant solo/quick play with bots
  const handleQuickPlay = async () => {
    setIsConnecting(true);
    setErrorMessage(null);
    try {
      await networkManager.createRoom(playerName, playerColor, 'neon_grid', cosmetics);
      // Auto add 2 bots and start
      setTimeout(() => {
        networkManager.addBot();
        networkManager.addBot();
      }, 200);
    } catch (err) {
      console.error(err);
      setErrorMessage(lang === 'ru' ? 'Не удалось запустить тренировку.' : 'Could not launch practice match.');
      setIsConnecting(false);
    }
  };

  const handleToggleReady = () => {
    networkManager.toggleReady();
  };

  const handleAddBot = () => {
    networkManager.addBot();
  };

  const handleKickPlayer = (targetId: string) => {
    networkManager.kickPlayer(targetId);
  };

  const handleChangeMap = (mapId: string) => {
    networkManager.changeMap(mapId);
  };

  const handleStartGame = () => {
    networkManager.startGame();
  };

  const handleSendInput = (input: PlayerInput) => {
    networkManager.sendInput(input);
  };

  const handlePlayAgain = () => {
    setGameOverData(null);
    networkManager.playAgain();
    setView('lobby');
  };

  const handleLeaveRoom = () => {
    networkManager.leaveRoom();
    setRoom(null);
    setLocalPlayer(null);
    setGameOverData(null);
    setView('menu');

    // Remove room param from URL if present
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url.toString());
  };

  const handleEquipCosmetics = (nextCosmetics: PlayerCosmetics) => {
    setCosmetics(nextCosmetics);
    networkManager.updateCosmetics(nextCosmetics);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden scanlines">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Global Navigation Header - hidden on mobile during combat to maximize screen space */}
      <div className={view === 'game' ? 'hidden md:block' : 'block'}>
        <Header
          latency={latency}
          lang={lang}
          coins={coins}
          currentUser={currentUser}
          onToggleLang={() => setLang((l) => (l === 'ru' ? 'en' : 'ru'))}
          onOpenHelp={() => setShowHelp(true)}
          onOpenShop={() => setShowShop(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenWhatsNew={() => setShowWhatsNew(true)}
          onOpenProfile={() => (currentUser ? setShowProfile(true) : setShowAuth(true))}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
        />
      </div>

      {/* Main View Router */}
      <main className={`flex-1 flex flex-col relative z-10 ${view !== 'game' ? 'overflow-y-auto overscroll-contain h-[calc(100dvh-60px)] touch-pan-y' : 'overflow-hidden h-full'}`}>
        {view === 'menu' && (
          <MainMenu
            playerName={playerName}
            setPlayerName={setPlayerName}
            playerColor={playerColor}
            setPlayerColor={setPlayerColor}
            cosmetics={cosmetics}
            coins={coins}
            lang={lang}
            currentUser={currentUser}
            onCreateRoom={handleCreateRoom}
            onCreateBossRaid={handleCreateBossRaid}
            onJoinRoom={handleJoinRoom}
            onQuickPlay={handleQuickPlay}
            onOpenHelp={() => setShowHelp(true)}
            onOpenShop={() => setShowShop(true)}
            onOpenWhatsNew={() => setShowWhatsNew(true)}
            onOpenProfile={() => setShowProfile(true)}
            onOpenAuth={() => setShowAuth(true)}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            errorMessage={errorMessage}
            isConnecting={isConnecting}
            uiScale={uiScale}
            onUiScaleChange={handleUiScaleChange}
          />
        )}

        {view === 'lobby' && room && localPlayer && (
          <LobbyRoom
            room={room}
            localPlayer={localPlayer}
            lang={lang}
            onToggleReady={handleToggleReady}
            onAddBot={handleAddBot}
            onKickPlayer={handleKickPlayer}
            onChangeMap={handleChangeMap}
            onChangeMode={(m) => networkManager.changeMode(m)}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
            onOpenHelp={() => setShowHelp(true)}
            onUpdateLoadout={(weapon, modifiers) => networkManager.updateLoadout(weapon, modifiers)}
          />
        )}

        {view === 'game' && room && localPlayer && (
          <GameCanvas
            localPlayerId={localPlayer.id}
            mapId={room.mapId}
            timeRemaining={timeRemaining}
            players={room.players}
            projectiles={projectiles}
            powerUps={room.powerUps}
            obstacles={room.obstacles}
            killFeed={killFeed}
            latency={latency}
            lang={lang}
            uiScale={uiScale}
            showDebug={showDebug}
            onToggleDebug={handleToggleDebug}
            fpsBoost={fpsBoost}
            onToggleFpsBoost={handleToggleFpsBoost}
            mobileSettings={mobileSettings}
            onSendInput={handleSendInput}
            onExitGame={handleLeaveRoom}
            onOpenSettings={() => setShowSettings(true)}
            boss={boss}
          />
        )}
      </main>

      {/* Match Over Modal */}
      {gameOverData && (
        <GameOverModal
          scores={gameOverData.scores}
          winner={gameOverData.winner}
          localPlayerId={localPlayer?.id || ''}
          lang={lang}
          onPlayAgain={handlePlayAgain}
          onReturnToMenu={handleLeaveRoom}
          onOpenShop={() => setShowShop(true)}
        />
      )}

      {/* How to Play with Friend (5th Grader Step-by-Step Guide) Modal */}
      <HowToPlayModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        lang={lang}
        currentRoomCode={room?.code}
      />

      {/* Customization Shop Modal */}
      <ShopModal
        isOpen={showShop}
        onClose={() => {
          setShowShop(false);
          setCoins(getSavedCoins());
        }}
        lang={lang}
        onEquipCosmetics={handleEquipCosmetics}
      />

      {/* Controls & Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        lang={lang}
        onSelectLang={(l) => setLang(l)}
        uiScale={uiScale}
        onUiScaleChange={handleUiScaleChange}
        showDebug={showDebug}
        onToggleDebug={handleToggleDebug}
        fpsBoost={fpsBoost}
        onToggleFpsBoost={handleToggleFpsBoost}
        mobileSettings={mobileSettings}
        onUpdateMobileSettings={handleUpdateMobileSettings}
      />

      {/* What's New? Patch Notes & Overhaul Overview Modal */}
      {showWhatsNew && (
        <WhatsNewModal
          lang={lang}
          onClose={() => setShowWhatsNew(false)}
          onToggleLang={() => setLang((l) => (l === 'ru' ? 'en' : 'ru'))}
        />
      )}

      {/* Pilot Authentication (Login / Password / Registration) Modal */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        lang={lang}
        defaultUsername={playerName}
        currentCoins={coins}
        currentCosmetics={cosmetics}
        onSuccess={(user) => {
          setCurrentUser(user);
          setPlayerName(user.username);
          setCoins(user.coins);
        }}
      />

      {/* Pilot Profile & Combat Career Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        lang={lang}
        profile={currentUser}
        onOpenLeaderboard={() => {
          setShowProfile(false);
          setShowLeaderboard(true);
        }}
        onOpenShop={() => {
          setShowProfile(false);
          setShowShop(true);
        }}
        onLogout={() => {
          authService.logout();
          setShowProfile(false);
        }}
      />

      {/* Pilot Hall of Fame / Leaderboard Modal */}
      <PilotLeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        lang={lang}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
