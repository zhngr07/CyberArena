import React, { useEffect, useState } from 'react';
import {
  X,
  Trophy,
  Shield,
  Zap,
  Skull,
  Crosshair,
  Award,
  LogOut,
  ShoppingBag,
  BarChart3,
  RefreshCw,
  Flame,
  Swords,
  AlertTriangle,
} from 'lucide-react';
import { PilotProfile, authService, PlayerAggregatedStats } from '../services/auth.ts';
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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PlayerAggregatedStats | null>(null);
  const [currentProfile, setCurrentProfile] = useState<PilotProfile | null>(profile);

  const loadAuthoritativeData = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch latest authoritative profile
      const freshUser = await authService.fetchMe();
      if (freshUser) {
        setCurrentProfile(freshUser);
      }
      // 2. Fetch aggregated combat stats (losses, damageDealt, accuracy)
      const aggStats = await authService.getPlayerStats(freshUser?.username || profile.username);
      setStats(aggStats);
    } catch (err: any) {
      setError(err?.message || 'Не удалось обновить данные профиля');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && profile) {
      setCurrentProfile(profile);
      loadAuthoritativeData();
    }
  }, [isOpen, profile?.username]);

  if (!isOpen) return null;

  const activeUser = currentProfile || profile;
  if (!activeUser) return null;

  // Rank thresholds
  let nextRankTitle = 'МАСТЕР (2000 RP)';
  let nextRankTarget = 2000;
  let prevRankTarget = 1500;

  if (activeUser.rating >= 2500) {
    nextRankTitle = 'МАКСИМАЛЬНЫЙ РАНГ (APEX)';
    nextRankTarget = 3000;
    prevRankTarget = 2500;
  } else if (activeUser.rating >= 2000) {
    nextRankTitle = 'АБСОЛЮТ (2500 RP)';
    nextRankTarget = 2500;
    prevRankTarget = 2000;
  } else if (activeUser.rating >= 1500) {
    nextRankTitle = 'МАСТЕР (2000 RP)';
    nextRankTarget = 2000;
    prevRankTarget = 1500;
  } else if (activeUser.rating >= 1000) {
    nextRankTitle = 'КИБЕР-АС (1500 RP)';
    nextRankTarget = 1500;
    prevRankTarget = 1000;
  } else if (activeUser.rating >= 500) {
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
    Math.max(0, ((activeUser.rating - prevRankTarget) / (nextRankTarget - prevRankTarget)) * 100)
  );

  // Authoritative losses computation: prefer server stats, fallback to matchesPlayed - wins
  const lossesCount = stats !== null ? stats.losses : Math.max(0, activeUser.matchesPlayed - activeUser.wins);
  const totalDamageFormatted = stats ? stats.damageDealt.toLocaleString('ru-RU') : '—';
  const accuracyText = stats ? `${stats.accuracy}%` : '—';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-2xl overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.3)] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-cyan-500/20 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center space-x-2 text-cyan-400 font-orbitron font-bold text-base sm:text-lg">
            <Trophy className="w-5 h-5 text-amber-400" aria-hidden="true" />
            <h2 id="profile-modal-title">{t.profile}</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={loadAuthoritativeData}
              disabled={loading}
              title="Обновить профиль"
              aria-label="Обновить профиль"
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              aria-label="Закрыть окно"
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 touch-pan-y">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/50 flex items-center justify-between text-xs text-rose-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={loadAuthoritativeData}
                className="px-2 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-100 font-bold transition-colors cursor-pointer"
              >
                Повторить
              </button>
            </div>
          )}

          {/* Main Pilot Identity Card */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-cyan-500/30 flex items-center gap-4 relative overflow-hidden shadow-lg">
            <div
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/60 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0"
              aria-label={`Эмблема ранга ${activeUser.rankTitle}`}
            >
              {activeUser.rankIcon || '💎'}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-orbitron font-black text-white truncate">
                  {activeUser.username}
                </h3>
                <span className="text-[11px] font-orbitron font-bold text-amber-300">
                  {activeUser.rankIcon} {activeUser.rankTitle}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1.5 text-xs font-mono text-slate-300">
                <span className="text-cyan-400 font-bold">
                  {activeUser.rating} RP
                </span>
                <span aria-hidden="true">•</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  🪙 {activeUser.coins} Монет
                </span>
              </div>

              {/* Rank Progress Bar */}
              <div className="mt-2.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>Прогресс ранга</span>
                  <span>Цель: {nextRankTitle}</span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={Math.round(rankProgress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700"
                >
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
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-orbitron font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" />
                Боевая статистика пилота
              </h4>
              {loading && (
                <span className="text-[10px] font-mono text-cyan-400 animate-pulse">
                  Синхронизация...
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Победы */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase">{t.statsWins}</div>
                <div className="text-base font-orbitron font-bold text-emerald-400 mt-0.5">
                  {activeUser.wins}
                </div>
              </div>

              {/* Поражения */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase">Поражения</div>
                <div className="text-base font-orbitron font-bold text-rose-400 mt-0.5">
                  {lossesCount}
                </div>
              </div>

              {/* Процент побед */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase">{t.statsWinRate}</div>
                <div className="text-base font-orbitron font-bold text-cyan-400 mt-0.5">
                  {activeUser.winRate}
                </div>
              </div>

              {/* Всего матчей */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase">{t.statsMatches}</div>
                <div className="text-base font-orbitron font-bold text-white mt-0.5">
                  {activeUser.matchesPlayed}
                </div>
              </div>

              {/* Убийства */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase">{t.statsKills}</div>
                <div className="text-base font-orbitron font-bold text-rose-400 mt-0.5">
                  {activeUser.kills}
                </div>
              </div>

              {/* Смерти */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase">Смерти</div>
                <div className="text-base font-orbitron font-bold text-slate-300 mt-0.5">
                  {activeUser.deaths}
                </div>
              </div>

              {/* K/D */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase">{t.statsKd}</div>
                <div className="text-base font-orbitron font-bold text-pink-400 mt-0.5">
                  {activeUser.kd}
                </div>
              </div>

              {/* Общий нанесённый урон */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase">Общий урон</div>
                <div className="text-base font-orbitron font-bold text-amber-300 mt-0.5 truncate" title={totalDamageFormatted}>
                  {totalDamageFormatted}
                </div>
              </div>

              {/* Точность */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase">Точность</div>
                <div className="text-base font-orbitron font-bold text-cyan-300 mt-0.5">
                  {accuracyText}
                </div>
              </div>

              {/* Рекорд очков */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase">{t.statsHighestScore}</div>
                <div className="text-base font-orbitron font-bold text-amber-300 mt-0.5">
                  {activeUser.highestScore}
                </div>
              </div>

              {/* Boss Raids */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase">{t.statsBossRaids}</div>
                <div className="text-base font-orbitron font-bold text-purple-400 mt-0.5">
                  {activeUser.bossRaidsDefeated}
                </div>
              </div>

              {/* MVP */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] font-orbitron text-slate-400 uppercase">{t.statsMvp}</div>
                <div className="text-base font-orbitron font-bold text-yellow-400 mt-0.5">
                  {activeUser.mvpCount}
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
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/50 hover:border-amber-400 text-amber-300 font-orbitron font-bold text-xs flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none transition-all cursor-pointer shadow-md"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>{t.hallOfFame}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenShop();
              }}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/50 hover:border-cyan-400 text-cyan-300 font-orbitron font-bold text-xs flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none transition-all cursor-pointer shadow-md"
            >
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
              <span>{t.openShopBtn}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-slate-500">
            ID: {activeUser.id.slice(0, 14)}...
          </span>

          <button
            onClick={() => {
              authService.logout();
              onLogout();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/60 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.logout}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
