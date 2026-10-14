import React, { useState, useEffect } from 'react';
import {
  Users,
  PlusCircle,
  LogIn,
  Bot,
  RefreshCw,
  Sparkles,
  ArrowRight,
  HelpCircle,
  ShoppingBag,
  Sliders,
  Trophy,
  Shield,
  User,
  Swords,
  Crown,
  Play,
  Zap,
  Flame,
  Globe,
  Settings,
} from 'lucide-react';
import { soundManager } from '../services/audio.ts';
import { Language, TRANSLATIONS } from '../data/translations.ts';
import { PlayerCosmetics } from '../types/game.ts';
import { PilotProfile } from '../services/auth.ts';

interface MainMenuProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  playerColor: string;
  setPlayerColor: (color: string) => void;
  cosmetics: PlayerCosmetics;
  coins: number;
  lang: Language;
  currentUser?: PilotProfile | null;
  onCreateRoom: (mapId?: string) => void;
  onCreateBossRaid?: () => void;
  onJoinRoom: (code: string) => void;
  onQuickPlay: () => void;
  onOpenHelp: () => void;
  onOpenShop: () => void;
  onOpenWhatsNew?: () => void;
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
  onOpenLeaderboard?: () => void;
  errorMessage?: string | null;
  isConnecting: boolean;
  uiScale?: number;
  onUiScaleChange?: (scale: number) => void;
}

const COLOR_PALETTE = [
  { name: 'Neon Cyan', hex: '#06b6d4', ring: 'ring-cyan-400' },
  { name: 'Cyber Pink', hex: '#ec4899', ring: 'ring-pink-400' },
  { name: 'Toxic Emerald', hex: '#10b981', ring: 'ring-emerald-400' },
  { name: 'Void Purple', hex: '#8b5cf6', ring: 'ring-purple-400' },
  { name: 'Solar Amber', hex: '#f59e0b', ring: 'ring-amber-400' },
  { name: 'Plasma Red', hex: '#ef4444', ring: 'ring-red-400' },
];

export const MainMenu: React.FC<MainMenuProps> = ({
  playerName,
  setPlayerName,
  playerColor,
  setPlayerColor,
  cosmetics,
  coins,
  lang,
  currentUser,
  onCreateRoom,
  onCreateBossRaid,
  onJoinRoom,
  onQuickPlay,
  onOpenHelp,
  onOpenShop,
  onOpenWhatsNew,
  onOpenProfile,
  onOpenAuth,
  onOpenLeaderboard,
  errorMessage,
  isConnecting,
  uiScale = 1.0,
  onUiScaleChange,
}) => {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [publicRooms, setPublicRooms] = useState<Array<{ code: string; playersCount: number; status: string }>>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const t = TRANSLATIONS[lang];

  // Fetch active public rooms
  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setPublicRooms(data.rooms || []);
      }
    } catch {
      // offline or local
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchRooms();
      }
    }, 10000);

    const handleFocus = () => {
      fetchRooms();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    soundManager.playShoot('plasma');
    onJoinRoom(roomCodeInput.trim().toUpperCase());
  };

  const handleCreate = () => {
    soundManager.playShoot('plasma');
    onCreateRoom();
  };

  const handleQuick = () => {
    soundManager.playShoot('spread');
    onQuickPlay();
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 py-2 sm:py-5 flex flex-col items-center justify-start select-none safe-pb safe-pl safe-pr min-h-full touch-pan-y pb-24">
      {/* 0.9 REMAKE BANNER */}
      <div className="w-full max-w-xl text-center mb-3 sm:mb-4">
        {onOpenWhatsNew && (
          <button
            onClick={onOpenWhatsNew}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-950 via-purple-950 to-pink-950 hover:from-cyan-900 hover:to-pink-900 border border-cyan-400/60 hover:border-pink-400 text-cyan-200 text-xs font-mono uppercase tracking-wider mb-2.5 shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer transform hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="font-orbitron font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-300 to-amber-300">
              Beta 0.9 - Remake
            </span>
            <span className="px-2 py-0.5 rounded-full bg-pink-500/30 text-white font-bold text-[9px]">
              НОВОЕ МЕНЮ & ЛОББИ
            </span>
          </button>
        )}

        <h2 className="text-3xl sm:text-5xl font-orbitron font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-sky-300 to-pink-500 drop-shadow-[0_0_25px_rgba(6,182,212,0.5)]">
          CYBER<span className="text-pink-400">ARENA</span>
        </h2>
        <p className="mt-1 text-slate-400 text-xs sm:text-sm font-sans max-w-md mx-auto">
          {lang === 'ru'
            ? 'Топовый мультиплеерный кибер-шутер: PvP дуэли, боссы, ангар кастомизации'
            : 'Top-down multiplayer cyber shooter: real-time PvP, epic boss raids, hangar customizer'}
        </p>
      </div>

      {/* PILOT PROFILE BAR */}
      <div className="w-full max-w-xl mb-3.5 bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-3 sm:p-4 backdrop-blur-md shadow-[0_0_25px_rgba(6,182,212,0.15)] flex flex-col sm:flex-row items-center justify-between gap-3">
        {currentUser ? (
          <div className="flex items-center space-x-3.5 min-w-0 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/60 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              {currentUser.rankIcon || '💎'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-orbitron font-black text-sm sm:text-base text-white truncate">
                  {currentUser.username}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 border border-amber-400/50 text-amber-300 shrink-0">
                  {currentUser.rankTitle}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-cyan-300 font-bold">{currentUser.rating} RP</span>
                <span>•</span>
                <span className="text-emerald-400">{currentUser.winRate} WR</span>
                <span>•</span>
                <span className="text-pink-400">{currentUser.kd} K/D</span>
                <span>•</span>
                <span className="text-amber-300 font-bold">{currentUser.coins || coins} 🪙</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3 min-w-0 w-full sm:w-auto">
            <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-orbitron font-bold text-xs sm:text-sm text-slate-200">
                {lang === 'ru' ? 'Гостевой Пилот' : 'Guest Pilot'}
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                {lang === 'ru' ? 'Войдите, чтобы сохранять рейтинг и монеты' : 'Login to save MMR & cosmetics'}
              </div>
            </div>
          </div>
        )}

        {/* Profile Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          {currentUser ? (
            <>
              {onOpenProfile && (
                <button
                  onClick={onOpenProfile}
                  className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-orbitron font-bold transition-all cursor-pointer shadow-sm"
                >
                  {t.profile || 'Профиль'}
                </button>
              )}
              {onOpenLeaderboard && (
                <button
                  onClick={onOpenLeaderboard}
                  className="px-3 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/50 text-amber-300 text-xs font-orbitron font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  title="Таблица лидеров"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'ru' ? 'Топ' : 'Ranks'}</span>
                </button>
              )}
            </>
          ) : (
            <>
              {onOpenAuth && (
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-orbitron font-black transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  {t.login || 'Вход'}
                </button>
              )}
              {onOpenLeaderboard && (
                <button
                  onClick={onOpenLeaderboard}
                  className="p-2 rounded-xl bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/50 text-amber-300 transition-all cursor-pointer"
                  title="Таблица лидеров"
                >
                  <Trophy className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ERROR NOTICE */}
      {errorMessage && (
        <div className="w-full max-w-xl mb-3 p-3 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs text-center font-mono">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* PILOT CALLSIGN & SHIP CUSTOMIZER CARD */}
      <div className="w-full max-w-xl bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-3.5 sm:p-4 mb-3.5 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.12)]">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] uppercase font-orbitron text-cyan-400 font-bold">
            {t.callsignLabel}
          </label>
          <button
            onClick={onOpenShop}
            className="text-[10px] font-mono text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{t.equippedStyle}</span>
            <span className="text-cyan-300 uppercase font-bold">{cosmetics.shipModel}</span>
            <span>•</span>
            <span className="text-amber-400 underline">{lang === 'ru' ? 'Изменить в ангаре ➔' : 'Change in Hangar ➔'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-2.5 mb-3">
          <input
            type="text"
            value={playerName}
            maxLength={16}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder={t.callsignPlaceholder}
            className="flex-1 bg-slate-950/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2 text-slate-100 font-orbitron text-xs sm:text-sm outline-none transition-all placeholder:text-slate-600 shadow-inner"
          />
          {/* Avatar / Hull Preview */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border-2 border-slate-700 shadow-md relative group cursor-pointer shrink-0 transition-transform hover:scale-105"
            style={{ backgroundColor: playerColor }}
            onClick={onOpenShop}
            title={lang === 'ru' ? 'Открыть магазин и примерить обвесы' : 'Open shop and try items'}
          >
            <div className="w-2 h-2 rounded-full bg-white/90 animate-ping" />
            {cosmetics.hat !== 'none' && (
              <span className="absolute -top-2 -right-1 text-xs select-none">
                {cosmetics.hat === 'crown' ? '👑' : cosmetics.hat === 'visor' ? '🕶️' : cosmetics.hat === 'horns' ? '😈' : cosmetics.hat === 'halo' ? '😇' : cosmetics.hat === 'samurai' ? '⚔️' : '🧢'}
              </span>
            )}
          </div>
        </div>

        {/* Color Palette */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400">
            {t.colorSelect}
          </span>
          <div className="flex items-center space-x-2">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setPlayerColor(c.hex)}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl transition-all transform hover:scale-110 flex items-center justify-center cursor-pointer ${
                  playerColor === c.hex
                    ? `scale-110 ring-2 ${c.ring} shadow-[0_0_12px_${c.hex}]`
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              >
                {playerColor === c.hex && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CORE ACTION LAUNCH MODES - 0.9 REMAKE REDESIGN */}
      <div className="w-full max-w-xl space-y-2.5 mb-3.5">
        {/* 1. Create Room Button (Primary Large Card) */}
        <button
          onClick={handleCreate}
          disabled={isConnecting}
          className="w-full group p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-orbitron font-black text-sm sm:text-base tracking-wide flex items-center justify-between shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center space-x-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-slate-950/25 flex items-center justify-center">
              <PlusCircle className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="leading-tight text-slate-950 font-black">
                {t.createRoomBtn}
              </div>
              <div className="text-[10px] font-sans font-normal text-slate-900/80 mt-0.5">
                {lang === 'ru' ? 'Создай своё лобби, выбери карту и позови друзей' : 'Host your private lobby, pick map and invite friends'}
              </div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
        </button>

        {/* 2. Join by Code Input Form */}
        <form onSubmit={handleJoinSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder={t.joinRoomPlaceholder}
              className="w-full bg-slate-900/95 border border-slate-700 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-2xl px-4 py-3 text-pink-300 font-orbitron font-bold tracking-widest text-center text-xs sm:text-sm uppercase outline-none placeholder:text-slate-500 placeholder:tracking-normal placeholder:font-sans"
            />
          </div>
          <button
            type="submit"
            disabled={!roomCodeInput.trim() || isConnecting}
            className="px-6 py-3 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-orbitron font-black text-xs sm:text-sm tracking-wider flex items-center space-x-1.5 shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all cursor-pointer disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{t.joinBtn}</span>
          </button>
        </form>

        {/* 3. Quick Play / Solo Practice with Bots */}
        <button
          onClick={handleQuick}
          disabled={isConnecting}
          className="w-full p-3 rounded-2xl bg-slate-900 border border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-950/20 text-emerald-400 font-orbitron font-bold text-xs sm:text-sm tracking-wide flex items-center justify-between transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] cursor-pointer"
        >
          <div className="flex items-center space-x-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="leading-tight text-white">{t.practiceBtn}</div>
              <div className="text-[10px] font-sans font-normal text-emerald-400/80">
                {lang === 'ru' ? 'Мгновенный бой без ожидания других игроков' : 'Instant combat against practice bots'}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
            SOLO QUICK PLAY
          </span>
        </button>

        {/* 4. Boss Raid Co-op Mode */}
        <button
          onClick={() => {
            soundManager.playShoot('plasma');
            if (onCreateBossRaid) {
              onCreateBossRaid();
            } else {
              onCreateRoom('boss_arena');
            }
          }}
          disabled={isConnecting}
          className="w-full p-3 rounded-2xl bg-gradient-to-r from-purple-950/90 via-pink-950/80 to-red-950/90 hover:from-purple-900/90 hover:to-red-900/90 border border-purple-500/50 hover:border-pink-400 text-pink-300 font-orbitron font-bold text-xs sm:text-sm tracking-wide flex items-center justify-between transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)] transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center space-x-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-base shadow-[0_0_10px_rgba(236,72,153,0.3)]">
              ⚔️
            </div>
            <div>
              <div className="leading-tight text-white flex items-center gap-1.5">
                <span>{lang === 'ru' ? 'РЕЙД НА БОССА (КООП)' : 'BOSS RAID (CO-OP)'}</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-500/30 text-rose-300 border border-rose-400/50">
                  PvE TITAN
                </span>
              </div>
              <div className="text-[10px] font-sans font-normal text-pink-300/80">
                {lang === 'ru' ? 'Все пилоты против гигантского Титана на большой карте!' : 'All pilots unite against the colossal Titan on giant arena!'}
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-pink-400" />
        </button>
      </div>

      {/* QUICK UTILITY DOCK: Shop, How to play, What's New */}
      <div className="w-full max-w-xl mb-3.5 grid grid-cols-2 sm:grid-cols-3 gap-2">
        <button
          onClick={onOpenShop}
          className="p-3 rounded-xl bg-gradient-to-b from-amber-950/70 to-slate-900 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-orbitron font-bold text-xs flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all cursor-pointer transform hover:-translate-y-0.5"
        >
          <ShoppingBag className="w-4 h-4 text-amber-400 mb-1" />
          <span>{lang === 'ru' ? 'МАГАЗИН & АНГАР' : 'SHOP & HANGAR'}</span>
          <span className="text-[9px] font-mono text-amber-400/70">{coins} 🪙</span>
        </button>

        <button
          onClick={onOpenHelp}
          className="p-3 rounded-xl bg-gradient-to-b from-cyan-950/70 to-slate-900 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-orbitron font-bold text-xs flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all cursor-pointer transform hover:-translate-y-0.5"
        >
          <HelpCircle className="w-4 h-4 text-cyan-400 mb-1" />
          <span>{lang === 'ru' ? 'КАК СЫГРАТЬ С ДРУГОМ' : 'HOW TO PLAY'}</span>
          <span className="text-[9px] font-mono text-cyan-400/70">{lang === 'ru' ? 'Инструкция' : 'Quick Guide'}</span>
        </button>

        <button
          onClick={onOpenWhatsNew}
          className="p-3 rounded-xl bg-gradient-to-b from-purple-950/70 to-slate-900 border border-pink-500/50 hover:border-pink-400 text-pink-300 font-orbitron font-bold text-xs flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(236,72,153,0.2)] transition-all cursor-pointer transform hover:-translate-y-0.5 col-span-2 sm:col-span-1"
        >
          <Sparkles className="w-4 h-4 text-pink-400 mb-1" />
          <span>{lang === 'ru' ? 'ЧТО НОВОГО? 0.9' : "WHAT'S NEW 0.9"}</span>
          <span className="text-[9px] font-mono text-pink-400/70">Remake Beta</span>
        </button>
      </div>

      {/* ACTIVE PUBLIC ROOMS EXPLORER */}
      <div className="w-full max-w-xl bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-sm shadow-md">
        <div className="flex items-center justify-between mb-2.5 text-[11px] uppercase font-orbitron tracking-wider text-slate-400">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>{t.activeRooms} ({publicRooms.length})</span>
          </div>
          <button
            onClick={fetchRooms}
            disabled={loadingRooms}
            className="text-slate-400 hover:text-cyan-400 p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Обновить список комнат"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRooms ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {publicRooms.length === 0 ? (
          <div className="text-center py-3 text-xs text-slate-500 font-mono">
            {t.noActiveRooms}
          </div>
        ) : (
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {publicRooms.map((r) => (
              <div
                key={r.code}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 transition-colors"
              >
                <div>
                  <div className="font-orbitron font-bold text-cyan-300 text-xs sm:text-sm tracking-wider">
                    {r.code}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    STATUS: <span className="uppercase text-emerald-400">{r.status === 'playing' ? t.statusPlaying : t.statusWaiting}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-mono text-slate-300">
                    {r.playersCount}/8
                  </span>
                  <button
                    onClick={() => onJoinRoom(r.code)}
                    disabled={r.status === 'playing' && r.playersCount >= 8}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/60 border border-cyan-500/60 text-cyan-300 text-xs font-orbitron font-bold transition-colors cursor-pointer"
                  >
                    {t.joinBtn}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
