import React, { useState } from 'react';
import { Volume2, VolumeX, Wifi, HelpCircle, ShoppingBag, Globe, Coins, Settings, Trophy, User } from 'lucide-react';
import { soundManager } from '../services/audio.ts';
import { Language, TRANSLATIONS } from '../data/translations.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { PilotProfile } from '../services/auth.ts';

interface HeaderProps {
  latency: number;
  lang: Language;
  coins: number;
  currentUser?: PilotProfile | null;
  onToggleLang: () => void;
  onOpenHelp: () => void;
  onOpenShop: () => void;
  onOpenSettings?: () => void;
  onOpenRegionSelect?: () => void;
  onOpenWhatsNew?: () => void;
  onOpenProfile?: () => void;
  onOpenLeaderboard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  latency,
  lang,
  coins,
  currentUser,
  onToggleLang,
  onOpenHelp,
  onOpenShop,
  onOpenSettings,
  onOpenRegionSelect,
  onOpenWhatsNew,
  onOpenProfile,
  onOpenLeaderboard,
}) => {
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const t = TRANSLATIONS[lang];

  const netStatus =
    latency <= 45
      ? 'FAST'
      : latency <= 90
      ? 'GOOD'
      : latency <= 170
      ? 'FAIR'
      : 'HIGH';
  const netColor =
    latency <= 45
      ? 'text-emerald-400'
      : latency <= 90
      ? 'text-cyan-400'
      : latency <= 170
      ? 'text-yellow-400'
      : 'text-rose-400';

  const toggleSound = () => {
    const nextMute = !isMuted;
    soundManager.setMuted(nextMute);
    setIsMuted(nextMute);
    if (!nextMute) {
      soundManager.playShoot('plasma');
    }
  };

  return (
    <header className="w-full bg-slate-950/85 backdrop-blur-md border-b border-cyan-500/20 px-3 sm:px-4 py-2 sm:py-2.5 safe-pt flex items-center justify-between z-30 select-none">
      {/* Brand */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-500/10 border border-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.5)]">
          <span className="font-orbitron font-black text-cyan-400 text-xs sm:text-sm">C</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-sm sm:text-xl font-orbitron font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-pink-500 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
              CYBER<span className="text-pink-400">ARENA</span>
            </h1>
            <button
              onClick={onOpenWhatsNew}
              className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 font-bold hidden xs:inline cursor-pointer transition-all transform hover:scale-105"
              title={lang === 'ru' ? 'Что нового? (Beta 0.6: Пробуждение Титана)' : "What's new? (Beta 0.6: Titan Awakening)"}
            >
              v0.6
            </button>
          </div>
          <p className="text-[9px] uppercase font-mono tracking-widest text-cyan-400/70 hidden md:block">
            {t.tagline}
          </p>
        </div>
      </div>

      {/* Utilities */}
      <div className="flex items-center space-x-1 sm:space-x-2.5">
        {/* PWA Install Button */}
        <PWAInstallButton lang={lang} />

        {/* Pilot Hall of Fame / Leaderboard button */}
        {onOpenLeaderboard && (
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-amber-300 hover:text-amber-200 transition-all cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.15)]"
            title={lang === 'ru' ? 'Зал Славы Пилотов (Топ игроков)' : 'Pilot Hall of Fame (Leaderboard)'}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-orbitron font-bold text-xs hidden lg:inline">{t.hallOfFame || 'Топ'}</span>
          </button>
        )}

        {/* Pilot Profile / Account button */}
        {onOpenProfile && (
          <button
            onClick={onOpenProfile}
            className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)]"
            title={currentUser ? `${currentUser.username} (${currentUser.rating} RP)` : (lang === 'ru' ? 'Профиль пилота' : 'Pilot Profile')}
          >
            {currentUser ? (
              <>
                <span className="text-xs">{currentUser.rankIcon || '💎'}</span>
                <span className="font-orbitron font-bold text-xs max-w-[80px] sm:max-w-[110px] truncate hidden xs:inline text-cyan-200">
                  {currentUser.username}
                </span>
                <span className="text-[10px] font-mono text-amber-300 font-bold hidden sm:inline">
                  {currentUser.rating} RP
                </span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-orbitron font-bold text-xs hidden sm:inline">{t.profile || 'Профиль'}</span>
              </>
            )}
          </button>
        )}

        {/* Coins button to open shop */}
        <button
          onClick={onOpenShop}
          className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 hover:text-amber-200 transition-all cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.2)]"
          title={t.shop}
        >
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-orbitron font-bold text-xs">{coins}</span>
        </button>

        {/* How to Play Guide button */}
        <button
          onClick={onOpenHelp}
          className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)]"
          title={t.help}
        >
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-orbitron font-bold text-xs hidden md:inline">{t.help}</span>
        </button>

        {/* Language switcher */}
        <button
          onClick={onToggleLang}
          className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 text-xs font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer"
          title="Switch Language (RU / EN)"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>{lang.toUpperCase()}</span>
        </button>

        {/* Server Region badge */}
        <button
          onClick={onOpenRegionSelect}
          className="hidden lg:flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.15)] cursor-pointer transition-colors"
          title="Server Region & Latency Probe"
        >
          <span>🇰🇿</span>
          <span className="font-bold">KZ</span>
        </button>

        {/* Latency badge */}
        <div
          className="flex items-center space-x-1 px-1.5 sm:px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] sm:text-[11px] font-mono cursor-help"
          title={`WebSocket Ping: ${latency}ms (${netStatus})`}
        >
          <Wifi className={`w-3 h-3 ${netColor}`} />
          <span className="text-slate-400 font-bold hidden xs:inline">PING:</span>
          <span className={`font-bold ${netColor}`}>{latency > 0 ? `${latency}ms` : '0ms'}</span>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={toggleSound}
          className="p-1 sm:p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
          title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />}
        </button>

        {/* Settings button */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-1 sm:p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
            title={lang === 'ru' ? 'Настройки и мобильное управление' : 'Settings & Mobile Controls'}
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>
    </header>
  );
};

