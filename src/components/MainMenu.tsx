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

  // Fetch open rooms with visibility check
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
    <div className="w-full max-w-xl mx-auto px-3 py-2 sm:py-5 flex flex-col items-center justify-start select-none safe-pb safe-pl safe-pr min-h-full touch-pan-y pb-24">
      {/* Title Hero - Compact & Balanced */}
      <div className="text-center mb-3 sm:mb-4 relative">
        <button
          onClick={onOpenWhatsNew}
          className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-pink-950/80 via-purple-950/80 to-cyan-950/80 hover:from-pink-900/90 hover:to-cyan-900/90 border border-pink-500/50 hover:border-pink-400 text-pink-300 text-[10px] sm:text-xs font-mono uppercase tracking-wider mb-2 shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all cursor-pointer transform hover:scale-105"
          title={t.whatsNewBtn}
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
          <span className="font-orbitron font-bold text-pink-200">{t.badgeHero}</span>
          <span className="px-1.5 py-0.2 rounded bg-pink-500/30 text-white font-bold text-[9px] uppercase">
            {t.whatsNewBadge}
          </span>
        </button>
        <h2 className="text-2xl sm:text-4xl font-orbitron font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-sky-300 to-pink-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          CYBER<span className="text-pink-400">ARENA</span>
        </h2>
        <p className="mt-1 text-slate-400 max-w-sm mx-auto text-[11px] sm:text-xs">
          {t.menuHeroDesc}
        </p>
      </div>

      {/* Pilot Account & Rank Status Card */}
      <div className="w-full max-w-md mb-3 bg-gradient-to-r from-slate-900/90 via-slate-900/95 to-slate-900/90 border border-cyan-500/40 rounded-xl p-3 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.15)] flex items-center justify-between gap-3">
        {currentUser ? (
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/50 flex items-center justify-center text-xl shrink-0">
              {currentUser.rankIcon || '💎'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-orbitron font-bold text-xs sm:text-sm text-white truncate">
                  {currentUser.username}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 border border-amber-400/40 text-amber-300 shrink-0">
                  {currentUser.rankTitle}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="text-cyan-300 font-bold">{currentUser.rating} RP</span>
                <span>•</span>
                <span>W/L: {currentUser.winRate}</span>
                <span>•</span>
                <span>K/D: {currentUser.kd}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-orbitron font-bold text-xs text-slate-200">
                {lang === 'ru' ? 'Гостевой Пилот' : 'Guest Pilot'}
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                {lang === 'ru' ? 'Войди, чтобы сохранять монеты и рейтинг' : 'Login to sync progress & MMR rating'}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          {currentUser ? (
            <>
              {onOpenProfile && (
                <button
                  onClick={onOpenProfile}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-orbitron font-bold transition-all cursor-pointer shadow-sm"
                >
                  {t.profile || 'Профиль'}
                </button>
              )}
              {onOpenLeaderboard && (
                <button
                  onClick={onOpenLeaderboard}
                  className="p-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/40 text-amber-300 transition-all cursor-pointer"
                  title={t.hallOfFame || 'Зал Славы'}
                >
                  <Trophy className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <>
              {onOpenAuth && (
                <button
                  onClick={onOpenAuth}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-orbitron font-black transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                >
                  {t.login || 'Вход'}
                </button>
              )}
              {onOpenLeaderboard && (
                <button
                  onClick={onOpenLeaderboard}
                  className="p-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/40 text-amber-300 transition-all cursor-pointer"
                  title={t.hallOfFame || 'Зал Славы'}
                >
                  <Trophy className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Featured Update Tab: "Что нового?" */}
      {onOpenWhatsNew && (
        <button
          onClick={onOpenWhatsNew}
          className="w-full max-w-md mb-3 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-pink-950/70 via-purple-950/60 to-cyan-950/70 hover:from-pink-900/80 hover:via-purple-900/70 hover:to-cyan-900/80 border border-pink-500/40 hover:border-pink-300 transition-all cursor-pointer shadow-[0_0_20px_rgba(236,72,153,0.25)] transform hover:-translate-y-0.5 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-left">
              <div className="w-9 h-9 rounded-lg bg-pink-500/20 border border-pink-400/60 flex items-center justify-center text-pink-300 group-hover:scale-110 transition-transform shadow-[0_0_12px_rgba(236,72,153,0.4)]">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-orbitron font-black text-xs sm:text-sm text-pink-300 group-hover:text-pink-200">
                    {t.whatsNewBtn}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-pink-500/30 text-white border border-pink-400/50">
                    {t.whatsNewBadge}
                  </span>
                </div>
                <div className="text-[10px] text-slate-300 font-sans mt-0.5 line-clamp-1">
                  {t.whatsNewSub}
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-pink-400 group-hover:translate-x-1 transition-transform ml-2 shrink-0" />
          </div>
        </button>
      )}

      {/* Primary Top Row: How to play guide & Shop */}
      <div className="w-full max-w-md mb-3 grid grid-cols-2 gap-2">
        <button
          onClick={onOpenHelp}
          className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900/90 hover:to-blue-900/90 border border-cyan-400/50 hover:border-cyan-300 text-cyan-300 font-orbitron font-bold text-xs tracking-wide flex flex-col items-center justify-center text-center shadow-[0_0_12px_rgba(6,182,212,0.2)] transition-all cursor-pointer transform hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] sm:text-xs">{t.howToPlayWithFriendBtn}</span>
          </div>
          <span className="text-[9px] text-cyan-400/70 font-sans font-normal hidden sm:inline">
            {t.howToPlaySub}
          </span>
        </button>

        <button
          onClick={onOpenShop}
          className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-amber-950/80 to-yellow-950/80 hover:from-amber-900/90 hover:to-yellow-900/90 border border-amber-400/50 hover:border-amber-300 text-amber-300 font-orbitron font-bold text-xs tracking-wide flex flex-col items-center justify-center text-center shadow-[0_0_12px_rgba(245,158,11,0.2)] transition-all cursor-pointer transform hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] sm:text-xs">{t.openShopBtn}</span>
          </div>
          <span className="text-[9px] text-amber-400/70 font-sans font-normal hidden sm:inline">
            {t.openShopSub}
          </span>
        </button>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div className="w-full max-w-md mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs text-center font-mono">
          {errorMessage}
        </div>
      )}

      {/* Warrior Customization Card - Compact */}
      <div className="w-full max-w-md bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3 sm:p-4 mb-3 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.12)]">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] uppercase font-orbitron text-cyan-400 font-bold">
            {t.callsignLabel}
          </label>
          <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400">
            <span>{t.equippedStyle}</span>
            <span className="text-cyan-300 uppercase font-bold">{cosmetics.shipModel}</span>
            <span>•</span>
            <span className="text-pink-300 capitalize">{cosmetics.trail}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 mb-2.5">
          <input
            type="text"
            value={playerName}
            maxLength={16}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder={t.callsignPlaceholder}
            className="flex-1 bg-slate-950/80 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg px-3 py-1.5 text-slate-100 font-orbitron text-xs sm:text-sm outline-none transition-all placeholder:text-slate-600"
          />
          {/* Avatar / Hull Preview */}
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center border-2 border-slate-700 shadow-md relative group cursor-pointer"
            style={{ backgroundColor: playerColor }}
            onClick={onOpenShop}
            title={t.openShopBtn}
          >
            <div className="w-2 h-2 rounded-full bg-white/90 animate-ping" />
            {cosmetics.hat !== 'none' && (
              <span className="absolute -top-2 -right-1 text-[11px]">
                {cosmetics.hat === 'crown' ? '👑' : cosmetics.hat === 'visor' ? '🕶️' : cosmetics.hat === 'horns' ? '😈' : cosmetics.hat === 'halo' ? '😇' : cosmetics.hat === 'samurai' ? '⚔️' : '🎧'}
              </span>
            )}
          </div>
        </div>

        {/* Color Palette */}
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          <span className="text-[9px] uppercase font-mono text-slate-400">
            {t.colorSelect}
          </span>
          <div className="flex items-center space-x-2">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setPlayerColor(c.hex)}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg transition-all transform hover:scale-110 flex items-center justify-center cursor-pointer ${
                  playerColor === c.hex
                    ? `scale-110 ring-2 ${c.ring} shadow-[0_0_10px_${c.hex}]`
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

      {/* Main Action Grid - Clear Titles & Helpful Descriptions */}
      <div className="w-full max-w-md space-y-2 mb-3">
        {/* 1. Create Room Button */}
        <button
          onClick={handleCreate}
          disabled={isConnecting}
          className="w-full group px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-orbitron font-black text-xs sm:text-sm tracking-wide flex items-center justify-between shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center space-x-2.5 text-left">
            <div className="w-7 h-7 rounded-lg bg-slate-950/20 flex items-center justify-center">
              <PlusCircle className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <div className="leading-tight">{t.createRoomBtn}</div>
              <div className="text-[9px] font-sans font-normal text-slate-900/80">
                {t.createRoomSub}
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* 2. Join by Code Form */}
        <form onSubmit={handleJoinSubmit} className="flex gap-1.5">
          <div className="flex-1 relative">
            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder={t.joinRoomPlaceholder}
              className="w-full bg-slate-900/90 border border-slate-700 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-xl px-3 py-2 text-pink-300 font-orbitron font-bold tracking-widest text-center text-xs sm:text-sm uppercase outline-none placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-sans placeholder:text-[10px] sm:placeholder:text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={!roomCodeInput.trim() || isConnecting}
            className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-orbitron font-bold text-xs tracking-wider flex items-center space-x-1.5 shadow-[0_0_12px_rgba(236,72,153,0.35)] transition-all cursor-pointer disabled:opacity-50"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{t.joinBtn}</span>
          </button>
        </form>

        {/* 3. Practice Solo with Bots */}
        <button
          onClick={handleQuick}
          disabled={isConnecting}
          className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-950/20 text-emerald-400 font-orbitron font-bold text-xs tracking-wide flex items-center justify-between transition-all shadow-[0_0_12px_rgba(16,185,129,0.15)] cursor-pointer"
        >
          <div className="flex items-center space-x-2.5 text-left">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="leading-tight">{t.practiceBtn}</div>
              <div className="text-[9px] font-sans font-normal text-emerald-400/70">
                {t.practiceSub}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
            SOLO
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
          className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-950/90 via-pink-950/80 to-red-950/90 hover:from-purple-900/90 hover:to-red-900/90 border border-purple-500/50 hover:border-pink-400 text-pink-300 font-orbitron font-bold text-xs tracking-wide flex items-center justify-between transition-all shadow-[0_0_15px_rgba(236,72,153,0.25)] transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center space-x-2.5 text-left">
            <div className="w-7 h-7 rounded-lg bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-sm shadow-[0_0_8px_rgba(236,72,153,0.3)]">
              ⚔️
            </div>
            <div>
              <div className="leading-tight text-white flex items-center gap-1.5">
                <span>{lang === 'ru' ? 'РЕЙД НА БОССА (КООП)' : 'BOSS RAID (CO-OP)'}</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-500/30 text-rose-300 border border-rose-400/50">PvE</span>
              </div>
              <div className="text-[9px] font-sans font-normal text-pink-300/80">
                {lang === 'ru' ? 'Все игроки против одного Титана на большой карте!' : 'All players vs 1 giant Titan boss on massive arena!'}
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-pink-400" />
        </button>
      </div>

      {/* Quick UI Scale Selector (Directly in Main Menu for convenience!) */}
      {onUiScaleChange && (
        <div className="w-full max-w-md flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 mb-3 text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-1.5 text-cyan-400">
            <Sliders className="w-3 h-3" />
            <span className="text-[10px] font-orbitron uppercase">{t.uiScale}:</span>
          </div>
          <div className="flex items-center space-x-1">
            {[0.75, 0.85, 1.0].map((s) => (
              <button
                key={s}
                onClick={() => onUiScaleChange(s)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  Math.abs(uiScale - s) < 0.04
                    ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-950 text-slate-500 hover:text-slate-300 border border-slate-800'
                }`}
              >
                {Math.round(s * 100)}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Public Rooms Explorer - Compact */}
      <div className="w-full max-w-md bg-slate-900/70 border border-slate-800 rounded-xl p-3 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2 text-[10px] uppercase font-orbitron tracking-wider text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.activeRooms} ({publicRooms.length})</span>
          </div>
          <button
            onClick={fetchRooms}
            disabled={loadingRooms}
            className="text-slate-500 hover:text-cyan-400 p-0.5 rounded transition-colors cursor-pointer"
            title="Refresh room list"
          >
            <RefreshCw className={`w-3 h-3 ${loadingRooms ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {publicRooms.length === 0 ? (
          <div className="text-center py-2 text-[11px] text-slate-500 font-mono">
            {t.noActiveRooms}
          </div>
        ) : (
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {publicRooms.map((r) => (
              <div
                key={r.code}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/40 transition-colors"
              >
                <div>
                  <div className="font-orbitron font-bold text-cyan-300 text-xs tracking-wider">
                    {r.code}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400">
                    STATUS: <span className="uppercase text-emerald-400">{r.status === 'playing' ? t.statusPlaying : t.statusWaiting}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono text-slate-300">
                    {r.playersCount}/8
                  </span>
                  <button
                    onClick={() => onJoinRoom(r.code)}
                    disabled={r.status === 'playing' && r.playersCount >= 8}
                    className="px-2.5 py-0.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 text-cyan-300 text-[11px] font-orbitron font-bold transition-colors cursor-pointer"
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
