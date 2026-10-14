import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  Medal,
  Star,
  Flame,
  Crown,
  RefreshCw,
  Shield,
  AlertTriangle,
  Swords,
  Search,
  CheckCircle2,
  Users,
} from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState<string>('');

  const t = TRANSLATIONS[lang];

  const fetchPilots = async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const list = await authService.getTopPilots(search);
      // Filter out any legacy fake bots (e.g. legend_ ids) to ensure 100% real pilots
      const realPilots = list.filter((p) => !p.id.startsWith('legend_'));
      setPilots(realPilots);
    } catch (err: any) {
      setError(err?.message || 'Не удалось загрузить таблицу лидеров. Проверьте соединение.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPilots(searchQuery);
    }
  }, [isOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchPilots(val);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="leaderboard-modal-title"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150"
    >
      <div className="w-full max-w-3xl bg-slate-900 border border-amber-500/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.3)] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-amber-500/30 flex items-center justify-between bg-slate-950/90 shrink-0">
          <div className="flex items-center space-x-3 text-amber-400 font-orbitron font-bold text-base sm:text-lg">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="leaderboard-modal-title" className="font-orbitron font-black text-white text-base sm:text-lg">
                  {lang === 'ru' ? 'ЗАЛ СЛАВЫ ПИЛОТОВ' : 'PILOT HALL OF FAME'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{lang === 'ru' ? 'Только реальные игроки' : 'Real pilots only'}</span>
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-sans font-normal mt-0.5">
                {lang === 'ru'
                  ? 'Серверный MMR рейтинг за матчи PvP. Выдуманные боты убраны!'
                  : 'Authoritative MMR rating in competitive PvP matches. Zero bots!'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPilots(searchQuery)}
              disabled={loading}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              title="Обновить таблицу"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 px-5 flex items-center gap-3 shrink-0">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={lang === 'ru' ? 'Поиск по позывному пилота...' : 'Search pilot callsign...'}
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white font-orbitron outline-none placeholder:text-slate-500 placeholder:font-sans"
            />
          </div>
          <div className="text-xs font-mono text-slate-400 shrink-0">
            {pilots.length} {lang === 'ru' ? 'пилотов' : 'pilots'}
          </div>
        </div>

        {/* Content Table */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-2 flex-1 touch-pan-y">
          {/* Loading State */}
          {loading && (
            <div className="space-y-2 py-4">
              {[...Array(4)].map((_, i) => (
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
                onClick={() => fetchPilots(searchQuery)}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-orbitron font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Повторить загрузку</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && pilots.length === 0 && (
            <div className="py-14 text-center px-4 flex flex-col items-center justify-center space-y-2.5">
              <Users className="w-10 h-10 text-slate-600 mb-1" />
              <div className="text-sm font-orbitron text-slate-300 font-bold">
                {lang === 'ru' ? 'Пилоты не найдены' : 'No pilots found'}
              </div>
              <div className="text-xs text-slate-500 max-w-sm">
                {lang === 'ru'
                  ? 'Сыграйте хотя бы один рейтинговый бой в CyberArena, чтобы занять своё место в таблице лидеров!'
                  : 'Play a ranked match to claim your rightful place in the arena leaderboards!'}
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
                    className={`p-3 sm:p-3.5 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                      isCurrentUser
                        ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                        : isTop3
                        ? 'bg-slate-950/80 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Position & Pilot Identity */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl font-orbitron font-black text-sm flex items-center justify-center shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950 shadow-sm'
                            : idx === 2
                            ? 'bg-amber-700 text-amber-100 shadow-sm'
                            : 'bg-slate-900 border border-slate-800 text-slate-400'
                        }`}
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
                          <span className="text-emerald-400">{pilot.wins} {lang === 'ru' ? 'побед' : 'wins'}</span>
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
                        {pilot.matchesPlayed} {lang === 'ru' ? 'боёв' : 'matches'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
          <span className="text-[11px]">
            ⚡ {lang === 'ru' ? 'Рейтинговый матч:' : 'Ranked Match:'} <strong className="text-emerald-400">+25 RP</strong> / <strong className="text-rose-400">−15 RP</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-orbitron text-xs font-bold transition-colors cursor-pointer"
          >
            {lang === 'ru' ? 'ЗАКРЫТЬ' : 'CLOSE'}
          </button>
        </div>
      </div>
    </div>
  );
};
