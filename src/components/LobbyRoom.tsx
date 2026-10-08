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
} from 'lucide-react';
import { RoomState, Player, WeaponModifier, WeaponType, GameMode } from '../types/game.ts';
import { MAPS } from '../data/maps.ts';
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

  const t = TRANSLATIONS[lang];
  const playersList = Object.values(room.players);
  const isHost = localPlayer.isHost;
  const currentMap = MAPS[room.mapId] || MAPS['neon_grid'] || MAPS['asteroid_field'] || Object.values(MAPS)[0];

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
          text: lang === 'ru' ? `Заходи в мою комнату ${room.code}!` : `Join my room ${room.code}!`,
          url: directJoinUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
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
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-6 flex flex-col justify-start min-h-full relative select-none safe-pb safe-pl safe-pr pb-28 touch-pan-y">
      {/* Starting countdown overlay */}
      {room.status === 'starting' && room.countdown > 0 && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="text-cyan-400 font-orbitron text-xl sm:text-2xl font-bold mb-4 tracking-widest animate-pulse uppercase">
            {t.countdownText}
          </div>
          <div className="text-8xl sm:text-9xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 via-pink-400 to-purple-600 drop-shadow-[0_0_40px_rgba(6,182,212,0.8)] animate-bounce">
            {room.countdown}
          </div>
          <div className="mt-6 text-xs sm:text-sm font-mono text-slate-400 uppercase">
            ALL SYSTEMS ARMED • COMBAT STATIONS READY
          </div>
        </div>
      )}

      {/* Prominent Invite Friend Banner */}
      <div className="bg-gradient-to-r from-cyan-950/80 via-blue-950/80 to-purple-950/80 border border-cyan-400/50 rounded-2xl p-4 sm:p-5 mb-5 backdrop-blur-md shadow-[0_0_25px_rgba(6,182,212,0.2)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 w-full md:w-auto">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] flex-shrink-0">
            <Users className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-cyan-300 font-bold">
              {t.inviteFriendBanner}
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-orbitron font-black tracking-widest text-cyan-300">
                {room.code}
              </span>
              <button
                onClick={onOpenHelp}
                className="text-xs font-mono text-pink-400 hover:text-pink-300 underline flex items-center gap-1 cursor-pointer ml-2"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{lang === 'ru' ? 'Как позвать друга?' : 'How to invite?'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Copy & Share Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleCopyCode}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-cyan-500/50 text-slate-200 font-mono text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copiedCode ? t.copiedCode : t.copyCode}</span>
          </button>
          <button
            onClick={handleCopyLink}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-orbitron font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-950" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? t.copiedLink : t.copyLink}</span>
          </button>
          <button
            onClick={handleShare}
            className="px-3 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs flex items-center justify-center transition-all cursor-pointer"
            title="Share with friends"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Players List + Arena Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Players Section (2 Columns on Desktop) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="font-orbitron font-bold text-slate-200 text-sm tracking-wider">
                {t.squadPilots}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 font-mono text-xs border border-cyan-800">
                {playersList.length} / 8
              </span>
            </div>

            {/* Host Add Bot Button */}
            {isHost && playersList.length < 8 && (
              <button
                onClick={handleAddBotClick}
                className="px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 font-orbitron text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>{t.addBotBtn}</span>
              </button>
            )}
          </div>

          {/* Player Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {playersList.map((p, pIdx) => {
              const isLocal = p.id === localPlayer.id;
              const cosmetics = p.cosmetics;

              return (
                <div
                  key={p.id ? `lobby-p-${p.id}` : `lobby-idx-${pIdx}`}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    p.isReady
                      ? 'bg-slate-950/70 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                      : 'bg-slate-950/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Ship Color Avatar & Accessory */}
                    <div
                      className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center border border-white/20 shadow-md relative"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.isBot ? (
                        <Bot className="w-5 h-5 text-slate-950" />
                      ) : p.isHost ? (
                        <Crown className="w-5 h-5 text-amber-300" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-white/90" />
                      )}
                      {cosmetics?.hat && cosmetics.hat !== 'none' && (
                        <span className="absolute -top-2 -right-1 text-xs">
                          {cosmetics.hat === 'crown' ? '👑' : cosmetics.hat === 'visor' ? '🕶️' : cosmetics.hat === 'horns' ? '😈' : cosmetics.hat === 'halo' ? '😇' : cosmetics.hat === 'samurai' ? '⚔️' : '🎧'}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="font-orbitron font-bold text-sm text-slate-100 truncate">
                          {p.name}
                        </span>
                        {isLocal && (
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800">
                            {t.youBadge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-2">
                        {p.isBot ? (
                          <span className="text-purple-400">{t.botBadge}</span>
                        ) : (
                          <span>PING: {p.ping}ms</span>
                        )}
                        {cosmetics?.shipModel && (
                          <span className="text-slate-500 uppercase text-[10px]">
                            • {cosmetics.shipModel}
                          </span>
                        )}
                      </div>
                      {/* Weapon & Modifiers Badges */}
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                          {WEAPONS[p.weapon]?.name || p.weapon}
                        </span>
                        {p.activeModifiers && p.activeModifiers.map((mod, modIdx) => (
                          <span
                            key={`mod-${mod}-${modIdx}`}
                            className="text-[9px] font-mono px-1 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-800/80 flex items-center gap-0.5"
                            title={lang === 'ru' ? MODIFIER_METAS[mod]?.descriptionRu : MODIFIER_METAS[mod]?.description}
                          >
                            <span>{MODIFIER_METAS[mod]?.icon}</span>
                            <span className="hidden sm:inline">
                              {lang === 'ru' ? MODIFIER_METAS[mod]?.nameRu?.split(' ')[0] : MODIFIER_METAS[mod]?.name?.split(' ')[0]}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Ready Status & Kick Action */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-orbitron font-bold uppercase tracking-wider ${
                        p.isReady
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {p.isReady ? t.readyStatus : t.waitingStatus}
                    </span>

                    {/* Kick Button for Host */}
                    {isHost && !isLocal && (
                      <button
                        onClick={() => onKickPlayer(p.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Kick player"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Local Player Customizer: Weapon & 14 Modifiers Selector */}
          <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-purple-500/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-base">⚙️</span>
                <span className="font-orbitron font-bold text-xs sm:text-sm text-purple-300">
                  {lang === 'ru' ? 'Твой Боевой Билд: Оружие и Модули' : 'Your Combat Build: Weapon & Modifiers'}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950 border border-purple-600/50 text-purple-300">
                {lang === 'ru' ? `Модули: ${selectedModifiers.length} / 3` : `Mods: ${selectedModifiers.length} / 3`}
              </span>
            </div>

            {/* Weapon Selector */}
            <div className="mb-3">
              <div className="text-[11px] font-mono text-cyan-400 font-bold mb-1.5 uppercase">
                {lang === 'ru' ? 'Стартовое Оружие:' : 'Starting Weapon:'}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                {Object.values(WEAPONS).map((w) => {
                  const isSel = selectedWeapon === w.type;
                  return (
                    <button
                      key={w.type}
                      onClick={() => handleSelectWeapon(w.type)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSel
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: w.color }} />
                        <span className="font-orbitron font-bold text-[10px] sm:text-[11px] truncate">{w.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 14 Modifiers Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono text-purple-400 font-bold uppercase">
                  {lang === 'ru' ? 'Выбери до 3 модификаторов (все 14 модулей):' : 'Select up to 3 modifiers (all 14 mods):'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {lang === 'ru' ? 'Нажми, чтобы включить/выключить' : 'Click to toggle'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1.5">
                {Object.values(MODIFIER_METAS).map((m) => {
                  const isEquipped = selectedModifiers.includes(m.type);
                  return (
                    <button
                      key={m.type}
                      onClick={() => handleToggleModifier(m.type)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isEquipped
                          ? 'bg-purple-950/80 border-purple-400 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.35)]'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                      title={lang === 'ru' ? m.descriptionRu : m.description}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm">{m.icon}</span>
                        {isEquipped && <span className="text-[9px] text-purple-400 font-bold">✓</span>}
                      </div>
                      <span className="font-orbitron font-bold text-[10px] mt-1 truncate">
                        {lang === 'ru' ? m.nameRu : m.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Auto start tip */}
          <div className="mt-4 p-3 rounded-xl bg-cyan-950/30 border border-cyan-900/40 text-xs text-cyan-300/80 font-mono flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>{t.autoStartNotice}</span>
          </div>
        </div>

        {/* Map & Arena & Mode Selector */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between">
          <div>
            {/* Game Mode Selector */}
            <div className="mb-4">
              <div className="flex items-center justify-between font-orbitron font-bold text-slate-200 text-sm tracking-wider mb-2">
                <span className="flex items-center space-x-1.5 text-cyan-300">
                  <span>⚔️</span>
                  <span>{lang === 'ru' ? 'Режим Игры' : 'Game Mode'}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 uppercase">
                  {room.gameMode === 'boss_raid' ? 'РЕЙД НА БОССА' : room.gameMode.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'ffa' as GameMode, nameRu: 'Каждый за себя', nameEn: 'Free For All', icon: '⚡' },
                  { id: 'tdm' as GameMode, nameRu: 'Командный бой', nameEn: 'Team Deathmatch', icon: '🛡️' },
                  { id: 'koth' as GameMode, nameRu: 'Царь Горы', nameEn: 'King of the Hill', icon: '👑' },
                  { id: 'boss_raid' as GameMode, nameRu: 'Рейд на Босса (PvE)', nameEn: 'Boss Raid (PvE)', icon: '🔥' },
                ].map((modeItem) => {
                  const isModeActive = (room.gameMode || 'ffa') === modeItem.id;
                  return (
                    <button
                      key={modeItem.id}
                      disabled={!isHost}
                      onClick={() => {
                        soundManager.playShoot('plasma');
                        if (onChangeMode) onChangeMode(modeItem.id);
                        if (modeItem.id === 'boss_raid') {
                          onChangeMap('boss_arena');
                        }
                      }}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        isModeActive
                          ? 'bg-gradient-to-r from-pink-950/70 to-purple-950/70 border-pink-400 text-pink-200 shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      } ${isHost ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{modeItem.icon}</span>
                        <span className="font-orbitron font-bold text-[11px] truncate text-white">
                          {lang === 'ru' ? modeItem.nameRu : modeItem.nameEn}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-2 font-orbitron font-bold text-slate-200 text-sm tracking-wider mb-3">
              <MapIcon className="w-4 h-4 text-cyan-400" />
              <span>{t.arenaEnv}</span>
            </div>

            {/* Map options list */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 mb-3">
              {Object.values(MAPS).map((m) => {
                const isSelected = room.mapId === m.id;
                return (
                  <button
                    key={m.id}
                    disabled={!isHost}
                    onClick={() => onChangeMap(m.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    } ${isHost ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-orbitron font-bold text-xs sm:text-sm text-slate-100">
                        {m.name}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] font-mono font-bold text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-900/40 border border-cyan-700">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {m.width}x{m.height} px • {m.obstacles.length} obstacles
                    </div>
                  </button>
                );
              })}
            </div>

            {!isHost && (
              <p className="text-[10px] text-slate-500 font-mono">
                {t.onlyHostCanChangeMap}
              </p>
            )}
          </div>

          {/* Quick Rules */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-0.5 mt-3">
            <div className="text-cyan-400 font-bold uppercase">{t.matchBriefing}</div>
            <div>{t.matchDurationDesc}</div>
            <div>{t.respawnDesc}</div>
            <div>{t.winConditionDesc}</div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
        <button
          onClick={onLeaveRoom}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-rose-950/50 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 font-orbitron text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{t.leaveRoomBtn}</span>
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Ready Button */}
          <button
            onClick={handleReadyClick}
            className={`flex-1 sm:flex-none px-8 py-3.5 rounded-xl font-orbitron font-extrabold text-sm tracking-wider uppercase transition-all shadow-lg cursor-pointer ${
              localPlayer.isReady
                ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
            }`}
          >
            {localPlayer.isReady ? t.readyBtnReady : t.readyBtnNotReady}
          </button>

          {/* Host Start Now Button */}
          {isHost && (
            <button
              onClick={handleStartNowClick}
              className="flex-1 sm:flex-none px-6 py-3.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-orbitron font-extrabold text-sm tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{t.startNowBtn}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
