import React from 'react';
import { Smartphone, RotateCw, Play } from 'lucide-react';
import { Language } from '../data/translations.ts';

interface OrientationWarningProps {
  lang: Language;
  onDismiss: () => void;
}

export const OrientationWarning: React.FC<OrientationWarningProps> = ({ lang, onDismiss }) => {
  const isRu = lang === 'ru';

  const handleRequestLandscape = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      // Attempt screen orientation lock if supported
      if ('screen' in window && 'orientation' in window.screen && 'lock' in (window.screen.orientation as unknown as { lock: (mode: string) => Promise<void> })) {
        await (window.screen.orientation as unknown as { lock: (mode: string) => Promise<void> }).lock('landscape');
      }
    } catch {
      // not all browsers allow lock without native app
    }
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 text-center select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 shadow-[0_0_40px_rgba(6,182,212,0.3)] animate-in fade-in zoom-in-95 duration-200">
        {/* Animated Rotate Phone Graphic */}
        <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-cyan-500/10 border border-cyan-400/30 animate-ping" />
          <div className="w-16 h-16 rounded-full bg-slate-950 border border-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)]">
            <Smartphone className="w-8 h-8 text-cyan-400 animate-pulse transition-transform duration-700" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-pink-500 text-slate-950">
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
          </div>
        </div>

        <h3 className="text-lg font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-pink-400 tracking-wider mb-2">
          {isRu ? 'ПОВЕРНИТЕ УСТРОЙСТВО' : 'ROTATE YOUR DEVICE'}
        </h3>

        <p className="text-xs text-slate-300 font-sans leading-relaxed mb-5">
          {isRu
            ? 'Для наилучшего обзора арены и удобства виртуальных джойстиков рекомендуется играть в горизонтальном (альбомном) режиме.'
            : 'For optimal arena visibility and responsive dual-stick controls, landscape orientation is strongly recommended.'}
        </p>

        <div className="space-y-2.5">
          <button
            onClick={handleRequestLandscape}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            <span>{isRu ? 'ПОВЕРНУТЬ И ИГРАТЬ' : 'ROTATE & PLAY'}</span>
          </button>

          <button
            onClick={onDismiss}
            className="w-full py-2 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-orbitron text-[11px] uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Play className="w-3 h-3" />
            <span>{isRu ? 'ПРОДОЛЖИТЬ В ВЕРТИКАЛЬНОМ' : 'CONTINUE IN PORTRAIT'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
