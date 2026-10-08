import React, { useState, useEffect } from 'react';
import { Server, Wifi, Check, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { networkManager } from '../services/network.ts';
import { ServerRegionInfo } from '../types/game.ts';
import { Language, TRANSLATIONS } from '../data/translations.ts';

interface RegionModalProps {
  lang: Language;
  onClose: () => void;
}

export const RegionModal: React.FC<RegionModalProps> = ({ lang, onClose }) => {
  const t = TRANSLATIONS[lang];
  const [regions, setRegions] = useState<ServerRegionInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string>('kz-central');
  const [isProbing, setIsProbing] = useState<boolean>(false);

  const probe = async () => {
    setIsProbing(true);
    try {
      const results = await networkManager.probeRegions();
      setRegions(results);
    } catch {
      // ignore
    } finally {
      setIsProbing(false);
    }
  };

  useEffect(() => {
    probe();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-cyan-500/40 p-5 sm:p-6 shadow-[0_0_40px_rgba(6,182,212,0.25)] select-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-base sm:text-lg text-white">
                {t.regionSelect}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'ru'
                  ? 'Реальное измерение сетевой задержки (RTT)'
                  : 'Real network Round-Trip Time measurement'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Region List */}
        <div className="space-y-2 mb-4">
          {regions.map((reg) => {
            const isSelected = selectedId === reg.id;
            const pingColor =
              reg.ping < 80
                ? 'text-emerald-400'
                : reg.ping < 150
                ? 'text-yellow-400'
                : reg.ping < 250
                ? 'text-amber-500'
                : 'text-rose-500';

            return (
              <div
                key={reg.id}
                onClick={() => setSelectedId(reg.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{reg.flag}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-orbitron font-bold text-xs sm:text-sm text-slate-200">
                        {reg.name}
                      </span>
                      {reg.isAutoRecommended && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                          {t.regionRecommended}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {reg.id === 'kz-central' ? 'KZ-Central (Almaty/Astana Edge)' : 'GCP Cloud Run Edge'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 font-mono text-xs font-bold">
                    <Wifi className={`w-3.5 h-3.5 ${pingColor}`} />
                    <span className={pingColor}>{reg.ping} {t.regionPing}</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-500 text-slate-950'
                        : 'border-slate-700 bg-transparent'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Technical Notice */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1 mb-4">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>
              {lang === 'ru' ? 'Архитектура низких задержек:' : 'Low-Latency Architecture:'}
            </span>
          </div>
          <p>
            {lang === 'ru'
              ? 'Контейнер бэкенда запущен на Google Cloud с настроенным буфером клиентского предсказания (Client-Side Prediction), что гарантирует реакцию на клавиши 0 мс вне зависимости от пинга.'
              : 'Backend is containerized with Client-Side Prediction, ensuring instant 0ms control feedback regardless of network ping.'}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={probe}
            disabled={isProbing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
            <span>{lang === 'ru' ? 'Проверить пинг' : 'Re-probe'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-orbitron font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
          >
            {lang === 'ru' ? 'СОХРАНИТЬ' : 'SAVE & APPLY'}
          </button>
        </div>
      </div>
    </div>
  );
};
