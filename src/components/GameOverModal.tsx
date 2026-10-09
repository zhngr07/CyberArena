import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Award, ShoppingBag, Coins, Shield, Zap } from 'lucide-react';
import { PlayerScoreSummary } from '../types/game.ts';
import { soundManager } from '../services/audio.ts';
import { Language, TRANSLATIONS } from '../data/translations.ts';
import { addCoins } from '../data/shopItems.ts';
import { authService } from '../services/auth.ts';

interface GameOverModalProps {
  scores: PlayerScoreSummary[];
  winner: PlayerScoreSummary;
  localPlayerId: string;
  lang: Language;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
  onOpenShop: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  scores,
  winner,
  localPlayerId,
  lang,
  onPlayAgain,
  onReturnToMenu,
  onOpenShop,
}) => {
  const isWinner = winner && winner.id === localPlayerId;
  const t = TRANSLATIONS[lang];
  const [earnedCoins, setEarnedCoins] = useState<number>(0);
  const [earnedRp, setEarnedRp] = useState<number>(0);

  const localScoreSummary = scores.find((p) => p.id === localPlayerId);
  const localRank = scores.findIndex((p) => p.id === localPlayerId);

  useEffect(() => {
    // Calculate coin reward
    let coinsReward = 30; // Base participation reward
    if (localRank === 0) coinsReward += 150; // #1 Winner bonus
    else if (localRank === 1) coinsReward += 80;
    else if (localRank === 2) coinsReward += 50;

    if (localScoreSummary) {
      coinsReward += (localScoreSummary.kills || 0) * 20; // 20 coins per frag
    }

    const rpReward = isWinner ? 35 : localRank === 1 ? 20 : localRank === 2 ? 12 : 6;
    setEarnedRp(rpReward);

    setEarnedCoins(coinsReward);
    addCoins(coinsReward);

    // Sync with persistent account system
    authService.syncProgress({
      coinsAdded: coinsReward,
      matchWon: isWinner,
      kills: localScoreSummary?.kills || 0,
      deaths: localScoreSummary?.deaths || 0,
      score: localScoreSummary?.score || 0,
      isMvp: isWinner,
    }).catch(() => {});

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
  }, [isWinner, localRank, localScoreSummary]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.25)] animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Banner Header */}
        <div
          className={`px-5 py-5 sm:py-6 text-center border-b ${
            isWinner
              ? 'bg-gradient-to-b from-amber-500/20 to-slate-900 border-amber-500/30'
              : 'bg-gradient-to-b from-cyan-500/20 to-slate-900 border-cyan-500/30'
          }`}
        >
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-950/80 border border-cyan-500/30 text-xs font-mono uppercase tracking-widest text-cyan-300 mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.matchConcluded}</span>
          </div>

          <h2
            className={`text-2xl sm:text-4xl font-orbitron font-black tracking-wider ${
              isWinner ? 'text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]' : 'text-cyan-300'
            }`}
          >
            {isWinner ? t.victoryAchieved : t.battleCompleted}
          </h2>

          <p className="mt-1 text-xs sm:text-sm text-slate-300 font-mono">
            {t.championLabel} <span className="text-pink-400 font-bold font-orbitron">{winner.name}</span> {t.withScore}{' '}
            <span className="text-cyan-400 font-bold">{winner.score} {t.pts}</span>
          </p>

          {/* Rewards Row: Earned Coins & Rating RP */}
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-amber-950/70 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-orbitron font-bold text-amber-300 uppercase">
                {t.coinsEarned} <strong className="text-amber-200 text-sm font-black">+{earnedCoins} 🪙</strong>
              </span>
            </div>

            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-cyan-950/70 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-orbitron font-bold text-cyan-300 uppercase">
                {lang === 'ru' ? 'Рейтинг' : 'Rating'} <strong className="text-cyan-200 text-sm font-black">+{earnedRp} RP</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Scoreboard Table */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] sm:text-[11px] font-orbitron text-slate-400 uppercase tracking-wider">
                  <th className="pb-2.5 pl-2">{t.rankHeader}</th>
                  <th className="pb-2.5">{t.pilotHeader}</th>
                  <th className="pb-2.5 text-right">{t.scoreHeader}</th>
                  <th className="pb-2.5 text-right">{t.killsHeader}</th>
                  <th className="pb-2.5 text-right">{t.deathsHeader}</th>
                  <th className="pb-2.5 text-right hidden xs:table-cell">{t.accuracyHeader}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {scores.map((p, idx) => {
                  const isSelf = p.id === localPlayerId;
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
                        <span className="font-orbitron font-bold truncate max-w-[100px] sm:max-w-[160px]">
                          {p.name}
                        </span>
                        {isSelf && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700">
                            YOU
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
                      <td className="py-2.5 text-right text-slate-400 hidden xs:table-cell">{p.accuracy}%</td>
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
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-orbitron text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>{t.mainMenuBtn}</span>
            </button>
            <button
              onClick={onOpenShop}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-950/70 hover:bg-amber-900/70 border border-amber-500/40 text-amber-300 font-orbitron text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>{t.visitShopBtn}</span>
            </button>
          </div>

          <button
            onClick={onPlayAgain}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-orbitron font-extrabold text-xs sm:text-sm tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-950" />
            <span>{t.playAgainBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
