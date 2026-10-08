import React from 'react';
import { X, Trophy, Shield, Zap, Skull, Crosshair, Award, LogOut, ShoppingBag, BarChart3, Star } from 'lucide-react';
import { PilotProfile, authService } from '../services/auth.ts';
import { Language, TRANSLATIONS } from '../data/translations.ts';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  profile: PilotProfile | null;
  onOpenLeaderboard: () => void;
  onOpenShop: () => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  lang,
  profile,
  onOpenLeaderboard,
  onOpenShop,
  onLogout,
}) => {
  const t = TRANSLATIONS[lang];

  if (!isOpen || !profile) return null;

  // Rank thresholds
  let nextRankTitle = 'МАСТЕР (2000 RP)';
  let nextRankTarget = 2000;
  let prevRankTarget = 1500;

  if (profile.rating >= 2500) {
    nextRankTitle = 'МАКСИМАЛЬНЫЙ РАНГ (APEX)';
    nextRankTarget = 3000;
    prevRankTarget = 2500;
  } else if (profile.rating >= 2000) {
    nextRankTitle = 'АБСОЛЮТ (2500 RP)';
    nextRankTarget = 2500;
    prevRankTarget = 2000;
  } else if (profile.rating >= 1500) {
    nextRankTitle = 'МАСТЕР (2000 RP)';
    nextRankTarget = 2000;
    prevRankTarget = 1500;
  } else if (profile.rating >= 1000) {
    nextRankTitle = 'КИБЕР-АС (1500 RP)';
    nextRankTarget = 1500;
    prevRankTarget = 1000;
  } else if (profile.rating >= 500) {
    nextRankTitle = 'ВЕТЕРАН (1000 RP)';
    nextRankTarget = 1000;
    prevRankTarget = 500;
  } else {
    nextRankTitle = 'СТРАЖ (500 RP)';
    nextRankTarget = 500;
    prevRankTarget = 0;
  }

  const rankProgress = Math.min(
    100,
    Math.max(0, ((profile.rating - prevRankTarget) / (nextRankTarget - prevRankTarget)) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-2xl overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.3)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-cyan-500/20 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center space-x-2 text-cyan-400 font-orbitron font-bold text-base sm:text-lg">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>{t.profile}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 touch-pan-y">
          {/* Main Pilot Identity Card */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-cyan-500/30 flex items-center gap-4 relative overflow-hidden shadow-lg">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/60 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0">
              {profile.rankIcon || '💎'}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-orbitron font-black text-white truncate">
                  {profile.username}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-orbitron font-bold bg-amber-500/20 border border-amber-400 text-amber-300">
                  {profile.rankIcon} {profile.rankTitle}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1.5 text-xs font-mono text-slate-300">
                <span className="text-cyan-400 font-bold">
                  {profile.rating} RP (Rating)
                </span>
                <span>•</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  🪙 {profile.coins} Монет
                </span>
              </div>

              {/* Rank Progress Bar */}
              <div className="mt-2.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>Прогресс ранга</span>
                  <span>Цель: {nextRankTitle}</span>
                </div>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 transition-all duration-300"
                    style={{ width: `${rankProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lifetime Combat Statistics Grid */}
          <div>
            <h4 className="text-xs font-orbitron font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" />
              Боевая статистика пилота
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase">{t.statsMatches}</div>
                <div className="text-base font-orbitron font-bold text-white mt-0.5">
                  {profile.matchesPlayed}
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase">{t.statsWins}</div>
                <div className="text-base font-orbitron font-bold text-emerald-400 mt-0.5">
                  {profile.wins}
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase">{t.statsWinRate}</div>
                <div className="text-base font-orbitron font-bold text-cyan-400 mt-0.5">
                  {profile.winRate}
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase">{t.statsKd}</div>
                <div className="text-base font-orbitron font-bold text-pink-400 mt-0.5">
                  {profile.kd}
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase">{t.statsKills}</div>
                <div className="text-base font-orbitron font-bold text-rose-400 mt-0.5">
                  {profile.kills}
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase">{t.statsHighestScore}</div>
                <div className="text-base font-orbitron font-bold text-amber-300 mt-0.5">
                  {profile.highestScore}
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase">{t.statsBossRaids}</div>
                <div className="text-base font-orbitron font-bold text-purple-400 mt-0.5">
                  {profile.bossRaidsDefeated}
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase">{t.statsMvp}</div>
                <div className="text-base font-orbitron font-bold text-yellow-400 mt-0.5">
                  {profile.mvpCount}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                onClose();
                onOpenLeaderboard();
              }}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/50 hover:border-amber-400 text-amber-300 font-orbitron font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>{t.hallOfFame}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenShop();
              }}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/50 hover:border-cyan-400 text-cyan-300 font-orbitron font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
              <span>{t.openShopBtn}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-slate-500">
            ID: {profile.id.slice(0, 14)}...
          </span>

          <button
            onClick={() => {
              authService.logout();
              onLogout();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/60 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.logout}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
