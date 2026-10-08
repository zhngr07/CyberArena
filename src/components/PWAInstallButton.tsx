import React, { useState } from 'react';
import { Download, Smartphone, X, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { Language } from '../data/translations.ts';

interface PWAInstallButtonProps {
  lang: Language;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang, className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const isRu = lang === 'ru';

  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/50 hover:border-cyan-300 text-cyan-300 font-orbitron font-bold text-[11px] shadow-[0_0_10px_rgba(6,182,212,0.25)] transition-all cursor-pointer ${className}`}
        title={isRu ? 'Установить приложение CyberArena' : 'Install CyberArena App'}
      >
        <Download className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
        <span>{isRu ? 'СКАЧАТЬ APP' : 'INSTALL APP'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-cyan-500/30 text-cyan-300 font-orbitron font-bold text-[10px] hover:border-cyan-400 transition-colors cursor-pointer ${className}`}
          title={isRu ? 'Установка на iPhone / iPad' : 'Install on iOS'}
        >
          <Smartphone className="w-3 h-3 text-cyan-400" />
          <span>{isRu ? 'APP НА iOS' : 'INSTALL iOS'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-cyan-500/40 p-5 shadow-[0_0_30px_rgba(6,182,212,0.3)] animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400 font-orbitron font-bold text-sm">
                  <Smartphone className="w-4 h-4" />
                  <span>{isRu ? 'Установка на iPhone / iPad' : 'Install on iPhone / iPad'}</span>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs text-slate-300 font-sans">
                <div className="flex items-start gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-orbitron font-bold text-xs">
                    1
                  </span>
                  <div>
                    {isRu ? (
                      <>
                        Нажмите кнопку <strong>«Поделиться»</strong> <Share className="w-3.5 h-3.5 inline mx-1 text-cyan-400" /> в нижней панели Safari.
                      </>
                    ) : (
                      <>
                        Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline mx-1 text-cyan-400" /> in Safari’s toolbar.
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-500/20 text-pink-300 flex items-center justify-center font-orbitron font-bold text-xs">
                    2
                  </span>
                  <div>
                    {isRu ? (
                      <>
                        Пролистайте вниз и выберите <strong>«На экран "Домой"»</strong> (Add to Home Screen).
                      </>
                    ) : (
                      <>
                        Scroll down and tap <strong>«Add to Home Screen»</strong>.
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-orbitron font-bold text-xs">
                    3
                  </span>
                  <div>
                    {isRu ? (
                      <>
                        Запускайте игру прямо с домашнего экрана без адресной строки на весь экран!
                      </>
                    ) : (
                      <>
                        Launch CyberArena directly from your home screen in full-screen immersion!
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
              >
                {isRu ? 'ПОНЯТНО' : 'GOT IT'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
