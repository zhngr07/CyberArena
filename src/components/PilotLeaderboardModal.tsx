import React, { useState, useEffect } from 'react';
import { X, Trophy, Medal, Star, Flame, Crown, RefreshCw, Shield, AlertTriangle, Swords } from 'lucide-react';
import { PilotProfile, authService } from '../services/auth.ts';
import { Language, TRANSLATIONS } from '../data/translations.ts';

interface PilotLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  currentUserId?: string;
}

export const PilotLeaderboardModal: React.FC<PilotLeaderboardModalProps> = ({
  isOpen,
  onClose,
  lang,
  currentUserId,
}) => {
  const [pilots, setPilots] = useState<PilotProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const t = TRANSLATIONS[lang];

  const fetchPilots = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await authService.getTopPilots();
      setPilots(list);
    } catch (err: any) {
      setError(err?.message || 'Не удалось загрузить таблицу лидеров. Проверьте соединение.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPilots();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="leaderboard-modal-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150"
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-amber-500/40 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.25)] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-amber-500/30 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center space-x-2 text-amber-400 font-orbitron font-bold text-base sm:text-lg">
            <Trophy className="w-6 h-6 text-amber-400 animate-pulse" aria-hidden="true" />
            <div>
              <h2 id="leaderboard-modal-title">{t.hallOfFame}</h2>
              <div className="text-[10px] text-slate-400 font-sans font-normal">{t.hallOfFameSub}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchPilots}
              disabled={loading}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none transition-colors cursor-pointer disabled:opacity-50"
              title="Обновить таблицу"
              aria-label="Обновить таблицу лидеров"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              aria-label="Закрыть таблицу лидеров"
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-2 flex-1 touch-pan-y">
          {/* Loading State */}
          {loading && (
            <div className="space-y-2 py-2" aria-live="polite" aria-busy="true">
              {[...Array(5)].map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800" />
                    <div className="space-y-1.5">
                      <div className="w-28 sm:w-40 h-3.5 bg-slate-800 rounded" />
                      <div className="w-20 h-2.5 bg-slate-850 rounded" />
                    </div>
                  </div>
                  <div className="w-16 h-5 bg-slate-800 rounded" />
                </div>
              ))}
              <div className="py-4 text-center text-slate-500 font-orbitron text-xs animate-pulse">
                СИНХРОНИЗАЦИЯ СЕРВЕРНОГО РЕЙТИНГА...
              </div>
            </div>
          )}

          {/* Network Error State */}
          {!loading && error && (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-sm font-orbitron text-rose-300 font-bold max-w-sm">
                {error}
              </div>
              <button
                onClick={fetchPilots}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-orbitron font-bold text-xs flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Повторить загрузку</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && pilots.length === 0 && (
            <div className="py-14 text-center px-4 flex flex-col items-center justify-center space-y-2.5">
              <Swords className="w-10 h-10 text-slate-600 mb-1" />
              <div className="text-sm font-orbitron text-slate-300 font-bold">
                Таблица лидеров пуста
              </div>
              <div className="text-xs text-slate-500 max-w-sm">
                Сыграйте хотя бы один рейтинговый бой в CyberArena, чтобы занять почётное место в Зале Славы!
              </div>
            </div>
          )}

          {/* Loaded List */}
          {!loading && !error && pilots.length > 0 && (
            <div className="space-y-2">
              {pilots.map((pilot, idx) => {
                const isCurrentUser = currentUserId && pilot.id === currentUserId;
                const isTop3 = idx < 3;

                return (
                  <div
                    key={pilot.id || idx}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                      isCurrentUser
                        ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                        : isTop3
                        ? 'bg-slate-950/80 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Position & Pilot Identity */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg font-orbitron font-black text-sm flex items-center justify-center shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950 shadow-sm'
                            : idx === 2
                            ? 'bg-amber-700 text-amber-100 shadow-sm'
                            : 'bg-slate-900 border border-slate-800 text-slate-400'
                        }`}
                        aria-label={`Место #${idx + 1}`}
                      >
                        {idx === 0 ? '👑' : idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-orbitron font-bold text-white text-xs sm:text-sm truncate">
                            {pilot.username}
                          </span>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/50">
                              ВЫ
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5 flex-wrap">
                          <span className="text-amber-300 font-semibold">{pilot.rankIcon} {pilot.rankTitle}</span>
                          <span aria-hidden="true">•</span>
                          <span className="text-pink-400">K/D: {pilot.kd}</span>
                          <span aria-hidden="true">•</span>
                          <span className="text-emerald-400">{pilot.wins} побед</span>
                          <span aria-hidden="true">•</span>
                          <span>{pilot.winRate} WR</span>
                        </div>
                      </div>
                    </div>

                    {/* Rating Points badge */}
                    <div className="text-right shrink-0 pl-2">
                      <div className="font-orbitron font-black text-sm sm:text-base text-amber-400">
                        {pilot.rating} RP
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {pilot.matchesPlayed} боев
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
          <span className="text-[11px]">
            ⚡ Победа: <strong className="text-emerald-400">+25 RP</strong> · Поражение: <strong className="text-rose-400">−15 RP</strong>
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none text-white font-orbitron text-xs transition-colors cursor-pointer"
          >
            ЗАКРЫТЬ
          </button>
        </div>
      </div>
    </div>
  );
};
