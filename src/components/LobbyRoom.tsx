import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  Crown,
  Bot,
  Play,
  UserX,
  LogOut,
  Map as MapIcon,
  Sparkles,
  Share2,
  HelpCircle,
  Shield,
  Zap,
  Swords,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { RoomState, Player, WeaponModifier, WeaponType, GameMode } from '../types/game.ts';
import { MAPS, ARENA_MAPS } from '../data/maps.ts';
import { WEAPONS, MODIFIER_METAS } from '../data/weapons.ts';
import { soundManager } from '../services/audio.ts';
import { Language, TRANSLATIONS } from '../data/translations.ts';

interface LobbyRoomProps {
  room: RoomState;
  localPlayer: Player;
  lang: Language;
  onToggleReady: () => void;
  onAddBot: () => void;
  onKickPlayer: (targetId: string) => void;
  onChangeMap: (mapId: string) => void;
  onChangeMode?: (mode: GameMode) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onOpenHelp: () => void;
  onUpdateLoadout?: (weapon: WeaponType, modifiers: WeaponModifier[]) => void;
}

export const LobbyRoom: React.FC<LobbyRoomProps> = ({
  room,
  localPlayer,
  lang,
  onToggleReady,
  onAddBot,
  onKickPlayer,
  onChangeMap,
  onChangeMode,
  onStartGame,
  onLeaveRoom,
  onOpenHelp,
  onUpdateLoadout,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>(localPlayer.weapon || 'plasma');
  const [selectedModifiers, setSelectedModifiers] = useState<WeaponModifier[]>(localPlayer.activeModifiers || []);

  const t = TRANSLATIONS[lang];
  const playersList = Object.values(room.players);
  const isHost = localPlayer.isHost;
  const currentMap = MAPS[room.mapId] || MAPS['neon_grid'] || Object.values(MAPS)[0];

  const directJoinUrl = `${window.location.origin}${window.location.pathname}?room=${room.code}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    soundManager.playPickup();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directJoinUrl);
    setCopiedLink(true);
    soundManager.playPickup();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CyberArena: Neon Battle',
          text: lang === 'ru' ? `Заходи в моё лобби ${room.code}!` : `Join my lobby ${room.code}!`,
          url: directJoinUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSelectWeapon = (w: WeaponType) => {
    setSelectedWeapon(w);
    soundManager.playShoot(w);
    if (onUpdateLoadout) {
      onUpdateLoadout(w, selectedModifiers);
    }
  };

  const handleToggleModifier = (mod: WeaponModifier) => {
    let next: WeaponModifier[];
    if (selectedModifiers.includes(mod)) {
      next = selectedModifiers.filter((m) => m !== mod);
    } else {
      if (selectedModifiers.length >= 3) {
        next = [...selectedModifiers.slice(1), mod];
      } else {
        next = [...selectedModifiers, mod];
      }
    }
    setSelectedModifiers(next);
    soundManager.playPickup();
    if (onUpdateLoadout) {
      onUpdateLoadout(selectedWeapon, next);
    }
  };

  const handleReadyClick = () => {
    soundManager.playShoot('plasma');
    onToggleReady();
  };

  const handleAddBotClick = () => {
    soundManager.playPickup();
    onAddBot();
  };

  const handleStartNowClick = () => {
    soundManager.playGameStart();
    onStartGame();
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-5 flex flex-col justify-start min-h-full relative select-none safe-pb safe-pl safe-pr pb-32 touch-pan-y">
      {/* Starting countdown overlay */}
      {room.status === 'starting' && room.countdown > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="text-cyan-400 font-orbitron text-xl sm:text-2xl font-bold mb-3 tracking-widest animate-pulse uppercase">
            {t.countdownText}
          </div>
          <div className="text-8xl sm:text-9xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 via-pink-400 to-purple-600 drop-shadow-[0_0_40px_rgba(6,182,212,0.8)] animate-bounce">
            {room.countdown}
          </div>
          <div className="mt-6 text-xs sm:text-sm font-mono text-slate-400 uppercase">
            БОЕВЫЕ СИСТЕМЫ ЗАВЕДЕНЫ • СТАРТ СЕКТОРА
          </div>
        </div>
      )}

      {/* TOP HEADER & EXIT BUTTON BAR */}
      <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-3 sm:p-4 mb-4 backdrop-blur-md shadow-[0_0_25px_rgba(6,182,212,0.15)] flex flex-wrap items-center justify-between gap-3">
        {/* Room Code Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-950 border border-cyan-400/50 shadow-inner">
            <span className="text-[10px] font-mono text-slate-400 uppercase">{lang === 'ru' ? 'КОД:' : 'CODE:'}</span>
            <span className="font-orbitron font-black text-base sm:text-lg text-cyan-300 tracking-widest">
              {room.code}
            </span>
          </div>

          <button
            onClick={handleCopyCode}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Скопировать код"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-orbitron font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? (lang === 'ru' ? 'Ссылка скопирована!' : 'Link Copied!') : (lang === 'ru' ? 'Пригласить друга' : 'Invite Friend')}</span>
          </button>
        </div>

        {/* Top Right: Leave Lobby Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onLeaveRoom}
            className="px-4 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/50 text-rose-300 hover:text-white font-orbitron text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(244,63,94,0.25)]"
          >
            <LogOut className="w-4 h-4" />
            <span>{lang === 'ru' ? 'ВЫЙТИ ИЗ ЛОББИ' : 'LEAVE LOBBY'}</span>
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN DECK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2 Cols): Pilots Deck & Weapons Loadout */}
        <div className="lg:col-span-2 space-y-4">
          {/* Pilots Slot Deck */}
          <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 backdrop-blur-md shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h3 className="font-orbitron font-black text-sm sm:text-base text-white tracking-wide">
                  {lang === 'ru' ? 'ПИЛОТЫ В АНГАРЕ' : 'PILOTS IN HANGAR'} ({playersList.length}/8)
                </h3>
              </div>

              {isHost && playersList.length < 8 && (
                <button
                  onClick={handleAddBotClick}
                  className="px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-xs font-orbitron font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>+ {lang === 'ru' ? 'Добавить бота' : 'Add Bot'}</span>
                </button>
              )}
            </div>

            {/* Grid of Pilot Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {playersList.map((p) => {
                const isLocal = p.id === localPlayer.id;

                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isLocal
                        ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {/* Ship Avatar Pod */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm relative shrink-0"
                        style={{
                          backgroundColor: `${p.color}25`,
                          borderColor: p.color,
                        }}
                      >
                        <svg viewBox="0 0 40 40" className="w-7 h-7">
                          <polygon
                            points="20,4 34,32 20,26 6,32"
                            fill={p.color}
                            stroke="#ffffff"
                            strokeWidth="1.5"
                          />
                          <circle cx="20" cy="18" r="3" fill="#ffffff" />
                        </svg>
                        {p.cosmetics?.hat && p.cosmetics.hat !== 'none' && (
                          <span className="absolute -top-1.5 -right-1 text-xs">
                            {p.cosmetics.hat === 'crown' ? '👑' : p.cosmetics.hat === 'horns' ? '😈' : p.cosmetics.hat === 'halo' ? '😇' : p.cosmetics.hat === 'visor' ? '🕶️' : '🧢'}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-orbitron font-bold text-xs sm:text-sm text-white truncate">
                            {p.name}
                          </span>
                          {p.isHost && (
                            <span title="Хост комнаты">
                              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            </span>
                          )}
                          {isLocal && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-600 font-mono">
                              ВЫ
                            </span>
                          )}
                          {p.isBot && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-600 font-mono">
                              BOT
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {p.weapon ? WEAPONS[p.weapon]?.name || p.weapon : 'Plasma'}
                        </div>
                      </div>
                    </div>

                    {/* Readiness Badge & Kick Action */}
                    <div className="flex items-center space-x-2 shrink-0">
                      {p.isReady ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-orbitron font-bold text-[10px] flex items-center gap-1 shadow-sm">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>ГОТОВ</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 font-orbitron text-[10px]">
                          ЖДЁТ
                        </span>
                      )}

                      {isHost && !isLocal && (
                        <button
                          onClick={() => onKickPlayer(p.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Исключить"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weapon & Loadout Selector */}
          <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 backdrop-blur-md shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-orbitron font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>{lang === 'ru' ? 'ВЫБОР ОРУЖИЯ И МОДУЛЕЙ' : 'WEAPONS & COMBAT MODULES'}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {WEAPONS[selectedWeapon]?.name || 'Plasma Blaster'}
              </span>
            </div>

            {/* Weapon Choices */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {Object.values(WEAPONS).map((w) => {
                const isSelected = selectedWeapon === w.type;

                return (
                  <button
                    key={w.type}
                    onClick={() => handleSelectWeapon(w.type)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-orbitron font-bold text-xs text-white truncate">
                      {w.name}
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400 mt-0.5">
                      {w.damage} DMG • {w.fireRate} rps
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Weapon Modifiers */}
            <div>
              <div className="text-[10px] font-orbitron font-bold text-slate-400 uppercase tracking-wider mb-2">
                {lang === 'ru' ? 'БОЕВЫЕ МОДУЛИ (ДО 3-Х ШТУК):' : 'WEAPON MODIFIERS (UP TO 3):'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.values(MODIFIER_METAS).map((m) => {
                  const isEquipped = selectedModifiers.includes(m.type);

                  return (
                    <button
                      key={m.type}
                      onClick={() => handleToggleModifier(m.type)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-orbitron font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isEquipped
                          ? 'bg-pink-950/70 border-pink-500/70 text-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span>{lang === 'ru' ? m.nameRu : m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Arena Map & Match Configuration */}
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 backdrop-blur-md shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-orbitron font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>{lang === 'ru' ? 'АРЕНА БОЯ' : 'ARENA MAP'}</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {currentMap.name}
              </span>
            </div>

            {/* Current Selected Map Preview Card */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/40 mb-3 shadow-inner">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-orbitron font-bold text-sm text-white">
                  {lang === 'ru' ? (currentMap.nameRu || currentMap.name) : currentMap.name}
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-600 text-cyan-300">
                  {currentMap.width}x{currentMap.height}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans mt-1 line-clamp-2">
                {lang === 'ru' ? (currentMap.descriptionRu || currentMap.description) : currentMap.description}
              </p>
              {currentMap.gameplayFeatureRu && (
                <div className="text-[10px] font-mono text-cyan-300 mt-2 flex items-center gap-1">
                  <span>⚡</span>
                  <span>{currentMap.gameplayFeatureRu}</span>
                </div>
              )}
            </div>

            {/* Map Selector List (Only Host can change or pick) */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {Object.values(MAPS).map((m) => {
                const isSelected = m.id === room.mapId;

                return (
                  <button
                    key={m.id}
                    disabled={!isHost}
                    onClick={() => {
                      if (isHost) {
                        onChangeMap(m.id);
                        soundManager.playShoot('spread');
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-sm'
                        : isHost
                        ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 cursor-pointer'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-400 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="font-orbitron font-bold text-xs">
                        {lang === 'ru' ? (m.nameRu || m.name) : m.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {m.width}x{m.height} px
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {!isHost && (
              <p className="text-[10px] text-slate-500 font-mono mt-2 text-center">
                {lang === 'ru' ? 'Карту может менять только создатель комнаты' : 'Only room host can change arena map'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM ACTION FOOTER BAR */}
      <div className="fixed bottom-3 left-3 right-3 max-w-5xl mx-auto z-40 bg-slate-950/95 border border-cyan-500/50 rounded-2xl p-3 sm:p-4 backdrop-blur-md shadow-[0_0_35px_rgba(0,0,0,0.8)] flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Leave Lobby Button */}
        <button
          onClick={onLeaveRoom}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 font-orbitron text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{lang === 'ru' ? 'ВЫЙТИ ИЗ ЛОББИ' : 'LEAVE LOBBY'}</span>
        </button>

        {/* Ready / Start Combat Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isHost && (
            <button
              onClick={handleStartNowClick}
              className="flex-1 sm:flex-none px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-orbitron font-black text-xs sm:text-sm tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{lang === 'ru' ? 'СТАРТ СЕЙЧАС' : 'START NOW'}</span>
            </button>
          )}

          <button
            onClick={handleReadyClick}
            className={`flex-1 sm:flex-none px-8 py-3.5 rounded-xl font-orbitron font-extrabold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
              localPlayer.isReady
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
            }`}
          >
            {localPlayer.isReady ? (
              <>
                <Check className="w-4 h-4" />
                <span>{t.readyBtnReady}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{t.readyBtnNotReady}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
