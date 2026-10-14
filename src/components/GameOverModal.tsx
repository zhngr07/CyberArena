import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  RotateCcw,
  Home,
  Award,
  ShoppingBag,
  Coins,
  Shield,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Crosshair,
  Skull,
  Swords,
  Flame,
} from 'lucide-react';
import { PlayerScoreSummary, MatchResult } from '../types/game.ts';
import { soundManager } from '../services/audio.ts';
import { Language, TRANSLATIONS } from '../data/translations.ts';
import { addCoins } from '../data/shopItems.ts';
import { authService, PilotProfile } from '../services/auth.ts';

interface GameOverModalProps {
  scores: PlayerScoreSummary[];
  winner: PlayerScoreSummary;
  matchResult?: MatchResult;
  localPlayerId: string;
  lang: Language;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
  onOpenShop: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  scores,
  winner,
  matchResult,
  localPlayerId,
  lang,
  onPlayAgain,
  onReturnToMenu,
  onOpenShop,
}) => {
  const t = TRANSLATIONS[lang];
  const [earnedCoins, setEarnedCoins] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<PilotProfile | null>(authService.getCurrentUser());
  const [animatedRating, setAnimatedRating] = useState<number | null>(null);

  const localScoreSummary = scores.find((p) => p.id === localPlayerId);
  const localRank = scores.findIndex((p) => p.id === localPlayerId);

  // Authoritative match result parsing
  const isDraw = matchResult?.status === 'draw';
  const isAborted = matchResult?.status === 'aborted';
  const isWinner = !isDraw && !isAborted && winner && winner.id === localPlayerId;
  const isRankedMatch = matchResult ? matchResult.isRanked !== false && matchResult.mode === 'ffa' : true;

  // Rating delta: +25 for win, -15 for loss, 0 for draw/unranked
  const ratingDelta = !isRankedMatch || isAborted || isDraw ? 0 : isWinner ? 25 : -15;

  const localParticipant = matchResult?.participants.find((p) => p.id === localPlayerId);
  const damageDealt = localParticipant?.damageDealt ?? localScoreSummary?.damageDealt ?? 0;
  const accuracy = localParticipant?.accuracy ?? localScoreSummary?.accuracy ?? 0;

  useEffect(() => {
    // 1. Calculate coins reward
    let coinsReward = 30; // Base participation reward
    if (localRank === 0) coinsReward += 150; // #1 Winner bonus
    else if (localRank === 1) coinsReward += 80;
    else if (localRank === 2) coinsReward += 50;

    if (localScoreSummary) {
      coinsReward += (localScoreSummary.kills || 0) * 20; // 20 coins per frag
    }

    setEarnedCoins(coinsReward);
    addCoins(coinsReward);

    // 2. Refresh authoritative user profile from server
    authService.fetchMe().then((freshUser) => {
      if (freshUser) {
        setCurrentUser(freshUser);
        // Animate rating counter smoothly
        const startRating = isRankedMatch ? freshUser.rating - ratingDelta : freshUser.rating;
        const targetRating = freshUser.rating;
        setAnimatedRating(startRating);

        const startTime = performance.now();
        const duration = 800; // ms

        const step = (now: number) => {
          const progress = Math.min(1, (now - startTime) / duration);
          // Ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const currentVal = Math.round(startRating + (targetRating - startRating) * eased);
          setAnimatedRating(currentVal);
          if (progress < 1) {
            requestAnimationFrame(step);
          }
        };
        requestAnimationFrame(step);
      }
    }).catch(() => {});

    // 3. Audio & celebratory effects
    if (isWinner) {
      soundManager.playVictory();
      confetti({
        particleCount: 130,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#ec4899', '#f59e0b', '#10b981'],
      });
    } else {
      soundManager.playCoin();
    }
  }, [isWinner, localRank, localScoreSummary?.kills, ratingDelta, isRankedMatch]);

  // Status banner styling & text
  let bannerTitle = isWinner ? t.victoryAchieved : t.battleCompleted;
  let bannerSubtitle = `${t.championLabel} ${winner.name} ${t.withScore} ${winner.score} ${t.pts}`;
  let bannerBgClass = 'bg-gradient-to-b from-cyan-500/20 to-slate-900 border-cyan-500/30';
  let bannerTitleClass = 'text-cyan-300';

  if (isWinner) {
    bannerTitle = 'ПОБЕДА В БОЮ';
    bannerBgClass = 'bg-gradient-to-b from-amber-500/20 to-slate-900 border-amber-500/30';
    bannerTitleClass = 'text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]';
  } else if (isDraw) {
    bannerTitle = 'БОЕВАЯ НИЧЬЯ';
    bannerSubtitle = 'Пилоты набрали равное количество очков в секторе';
    bannerBgClass = 'bg-gradient-to-b from-slate-500/20 to-slate-900 border-slate-500/30';
    bannerTitleClass = 'text-slate-200';
  } else if (isAborted) {
    bannerTitle = 'МАТЧ ПРЕРВАН';
    bannerSubtitle = 'Пилоты покинули арену до истечения таймера';
    bannerBgClass = 'bg-gradient-to-b from-rose-500/20 to-slate-900 border-rose-500/30';
    bannerTitleClass = 'text-rose-300';
  } else {
    bannerTitle = 'ПОРАЖЕНИЕ';
    bannerBgClass = 'bg-gradient-to-b from-blue-900/30 to-slate-900 border-cyan-500/30';
    bannerTitleClass = 'text-cyan-300';
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[92vh]">
        {/* Banner Header */}
        <div className={`px-5 py-5 sm:py-6 text-center border-b ${bannerBgClass}`}>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-950/80 border border-cyan-500/30 text-xs font-mono uppercase tracking-widest text-cyan-300 mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>{isRankedMatch ? 'РЕЙТИНГОВЫЙ МАТЧ (RANKED FFA)' : 'КООПЕРАТИВНЫЙ БОЙ'}</span>
          </div>

          <h2 id="game-over-title" className={`text-2xl sm:text-4xl font-orbitron font-black tracking-wider ${bannerTitleClass}`}>
            {bannerTitle}
          </h2>

          <p className="mt-1 text-xs sm:text-sm text-slate-300 font-mono">
            {bannerSubtitle}
          </p>

          {/* Rating Delta & Coins Bar */}
          <div className="mt-3.5 flex items-center justify-center gap-2.5 flex-wrap">
            {/* Rating Delta Badge */}
            {isRankedMatch ? (
              <div
                className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border shadow-md ${
                  ratingDelta > 0
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : ratingDelta < 0
                    ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                    : 'bg-slate-950/80 border-slate-700 text-slate-300'
                }`}
                aria-live="polite"
              >
                {ratingDelta > 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : ratingDelta < 0 ? (
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                ) : (
                  <Minus className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-xs font-orbitron font-bold uppercase">
                  Рейтинг:{' '}
                  <strong className="text-sm font-black">
                    {ratingDelta > 0 ? `+${ratingDelta}` : ratingDelta < 0 ? `${ratingDelta}` : '0'} RP
                  </strong>
                </span>
                {animatedRating !== null && (
                  <span className="text-[11px] font-mono text-slate-400 ml-1">
                    ({animatedRating} RP)
                  </span>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-400 text-xs font-mono">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Нерейтинговый бой · 0 RP</span>
              </div>
            )}

            {/* Coins Earned */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-orbitron font-bold uppercase">
                {t.coinsEarned} <strong className="text-sm font-black text-amber-200">+{earnedCoins} 🪙</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Personal Combat Highlights Cards */}
        <div className="px-4 sm:px-6 pt-4 pb-2 bg-slate-950/40 border-b border-slate-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl text-center">
              <div className="text-[10px] font-orbitron text-slate-400 uppercase">Очки</div>
              <div className="text-base font-orbitron font-bold text-cyan-400 mt-0.5">
                {localScoreSummary?.score || 0}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl text-center">
              <div className="text-[10px] font-orbitron text-slate-400 uppercase">Фраги / Смерти</div>
              <div className="text-base font-orbitron font-bold text-white mt-0.5">
                <span className="text-emerald-400">{localScoreSummary?.kills || 0}</span>
                <span className="text-slate-500 mx-1">/</span>
                <span className="text-rose-400">{localScoreSummary?.deaths || 0}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl text-center">
              <div className="text-[10px] font-orbitron text-slate-400 uppercase">Урон</div>
              <div className="text-base font-orbitron font-bold text-amber-300 mt-0.5">
                {damageDealt}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl text-center">
              <div className="text-[10px] font-orbitron text-slate-400 uppercase">Точность</div>
              <div className="text-base font-orbitron font-bold text-pink-400 mt-0.5">
                {accuracy}%
              </div>
            </div>
          </div>
        </div>

        {/* Scoreboard Table */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 touch-pan-y">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] sm:text-[11px] font-orbitron text-slate-400 uppercase tracking-wider">
                  <th className="pb-2.5 pl-2">{t.rankHeader}</th>
                  <th className="pb-2.5">{t.pilotHeader}</th>
                  <th className="pb-2.5 text-right">{t.scoreHeader}</th>
                  <th className="pb-2.5 text-right">{t.killsHeader}</th>
                  <th className="pb-2.5 text-right">{t.deathsHeader}</th>
                  <th className="pb-2.5 text-right hidden xs:table-cell">Урон</th>
                  <th className="pb-2.5 text-right hidden xs:table-cell">{t.accuracyHeader}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {scores.map((p, idx) => {
                  const isSelf = p.id === localPlayerId;
                  const part = matchResult?.participants.find((m) => m.id === p.id);
                  const pDamage = part?.damageDealt ?? p.damageDealt ?? 0;
                  const pAccuracy = part?.accuracy ?? p.accuracy ?? 0;

                  return (
                    <tr
                      key={p.id ? `score-${p.id}` : `score-idx-${idx}`}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelf ? 'bg-cyan-950/40 text-cyan-200' : 'text-slate-300'
                      }`}
                    >
                      <td className="py-2.5 pl-2 font-orbitron font-bold">
                        {idx === 0 ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Award className="w-4 h-4" /> #1
                          </span>
                        ) : (
                          `#${idx + 1}`
                        )}
                      </td>
                      <td className="py-2.5 flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="font-orbitron font-bold truncate max-w-[90px] sm:max-w-[150px]">
                          {p.name}
                        </span>
                        {isSelf && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700">
                            ВЫ
                          </span>
                        )}
                        {p.isBot && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-700">
                            BOT
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-bold text-cyan-400">{p.score}</td>
                      <td className="py-2.5 text-right text-emerald-400">{p.kills}</td>
                      <td className="py-2.5 text-right text-rose-400">{p.deaths}</td>
                      <td className="py-2.5 text-right text-amber-300 hidden xs:table-cell">{pDamage}</td>
                      <td className="py-2.5 text-right text-slate-400 hidden xs:table-cell">{pAccuracy}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onReturnToMenu}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-orbitron text-xs font-bold flex items-center justify-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>{t.mainMenuBtn}</span>
            </button>
            <button
              onClick={onOpenShop}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-950/70 hover:bg-amber-900/70 border border-amber-500/40 text-amber-300 font-orbitron text-xs font-bold flex items-center justify-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>{t.visitShopBtn}</span>
            </button>
          </div>

          <button
            onClick={onPlayAgain}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-orbitron font-extrabold text-xs sm:text-sm tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-950" />
            <span>{t.playAgainBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
