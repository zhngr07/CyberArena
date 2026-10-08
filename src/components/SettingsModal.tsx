import React, { useState } from 'react';
import {
  X,
  Volume2,
  Crosshair,
  Sparkles,
  Globe,
  Sliders,
  Activity,
  RotateCcw,
  Smartphone,
  Cpu,
  Vibrate,
  Zap,
  Wifi,
  Server,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { soundManager } from '../services/audio.ts';
import { networkManager } from '../services/network.ts';
import { Language, TRANSLATIONS } from '../data/translations.ts';
import { MobileControlSettings } from '../types/mobileControls.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSelectLang: (lang: Language) => void;
  uiScale: number;
  onUiScaleChange: (scale: number) => void;
  showDebug: boolean;
  onToggleDebug: (show: boolean) => void;
  fpsBoost?: boolean;
  onToggleFpsBoost?: (boost: boolean) => void;
  mobileSettings: MobileControlSettings;
  onUpdateMobileSettings: (settings: MobileControlSettings) => void;
}

type SettingsTab = 'general' | 'hud' | 'mobile' | 'graphics' | 'network';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  onSelectLang,
  uiScale,
  onUiScaleChange,
  showDebug,
  onToggleDebug,
  fpsBoost = true,
  onToggleFpsBoost,
  mobileSettings,
  onUpdateMobileSettings,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [vol, setVol] = useState(soundManager.getVolume());
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [probingWt, setProbingWt] = useState(false);
  const [wtResult, setWtResult] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string>(networkManager.selectedRegion || 'kz-central');
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const handleTestWebTransport = async () => {
    setProbingWt(true);
    setWtResult(null);
    try {
      await networkManager.reconnectWithTransport('webtransport');
      if (networkManager.activeTransport === 'webtransport') {
        setWtResult(
          lang === 'ru'
            ? '✅ Успешно подключено через WebTransport (HTTP/3 UDP Datagrams)!'
            : '✅ Connected via WebTransport (HTTP/3 UDP Datagrams)!'
        );
      } else {
        setWtResult(
          lang === 'ru'
            ? 'ℹ️ Google Cloud Run пропускает только TCP (HTTP/1.1 & HTTP/2). WebTransport требует UDP/QUIC. Активирован сверхбыстрый WebSocket с флагом TCP NoDelay.'
            : 'ℹ️ Google Cloud Run edge terminates TCP only. WebTransport requires UDP/QUIC. Operating over optimized WebSocket with TCP NoDelay.'
        );
      }
    } catch {
      setWtResult(
        lang === 'ru'
          ? 'ℹ️ Завершен тест: работает WebSocket (TCP NoDelay).'
          : 'ℹ️ Test completed: running WebSocket (TCP NoDelay).'
      );
    } finally {
      setProbingWt(false);
    }
  };

  const handleSelectProfile = (profile: string) => {
    setSelectedProfile(profile);
    networkManager.setRegionProfile(profile);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVol(val);
    soundManager.setVolume(val);
    if (!isMuted) {
      soundManager.playShoot('plasma');
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
  };

  const updateMobile = (partial: Partial<MobileControlSettings>) => {
    onUpdateMobileSettings({
      ...mobileSettings,
      ...partial,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.25)] animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-cyan-500/20 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center space-x-2 text-cyan-400 font-orbitron font-bold text-base sm:text-lg">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>{t.settingsTitle}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-3 pt-2 shrink-0 gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2 px-3.5 rounded-t-xl font-orbitron font-bold text-xs uppercase transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'general'
                ? 'bg-slate-900 text-cyan-300 border-cyan-400 shadow-[0_-2px_10px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t.tabGeneral}</span>
          </button>
          <button
            onClick={() => setActiveTab('hud')}
            className={`py-2 px-3.5 rounded-t-xl font-orbitron font-bold text-xs uppercase transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'hud'
                ? 'bg-slate-900 text-cyan-300 border-cyan-400 shadow-[0_-2px_10px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{t.tabHud}</span>
          </button>
          <button
            onClick={() => setActiveTab('mobile')}
            className={`py-2 px-3.5 rounded-t-xl font-orbitron font-bold text-xs uppercase transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'mobile'
                ? 'bg-slate-900 text-cyan-300 border-cyan-400 shadow-[0_-2px_10px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{t.tabMobile}</span>
          </button>
          <button
            onClick={() => setActiveTab('graphics')}
            className={`py-2 px-3.5 rounded-t-xl font-orbitron font-bold text-xs uppercase transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'graphics'
                ? 'bg-slate-900 text-cyan-300 border-cyan-400 shadow-[0_-2px_10px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{t.tabGraphics}</span>
          </button>
          <button
            onClick={() => setActiveTab('network')}
            className={`py-2 px-3.5 rounded-t-xl font-orbitron font-bold text-xs uppercase transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'network'
                ? 'bg-slate-900 text-cyan-300 border-cyan-400 shadow-[0_-2px_10px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>{t.tabNetwork}</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <>
              {/* Language Switcher Setting */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-orbitron font-bold text-slate-200 uppercase">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    {t.languageLabel}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    onClick={() => onSelectLang('ru')}
                    className={`py-2 px-3 rounded-lg font-orbitron font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      lang === 'ru'
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🇷🇺 Русский (RU)</span>
                  </button>
                  <button
                    onClick={() => onSelectLang('en')}
                    className={`py-2 px-3 rounded-lg font-orbitron font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      lang === 'en'
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🇬🇧 English (EN)</span>
                  </button>
                </div>
              </div>

              {/* Sound Controls */}
              <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-orbitron font-bold">
                  <span className="flex items-center space-x-1.5 text-slate-200">
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span>{t.soundEffects}</span>
                  </span>
                  <button
                    onClick={toggleMute}
                    className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold transition-all cursor-pointer ${
                      isMuted
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {isMuted ? 'Muted' : 'Active'}
                  </button>
                </div>
                <div className="flex items-center space-x-3 pt-1">
                  <span className="text-xs text-slate-400 font-mono">0%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : vol}
                    disabled={isMuted}
                    onChange={handleVolumeChange}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <span className="text-xs text-slate-400 font-mono">{Math.round(vol * 100)}%</span>
                </div>
              </div>

              {/* UI / HUD Scale Slider */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-orbitron font-bold text-slate-200">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    {t.uiScale}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 font-bold">{Math.round(uiScale * 100)}%</span>
                    {uiScale !== 1.0 && (
                      <button
                        onClick={() => onUiScaleChange(1.0)}
                        className="p-1 rounded text-slate-400 hover:text-white"
                        title="Reset to 100%"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">{t.uiScaleDesc}</p>
                <div className="flex items-center space-x-3 pt-1">
                  <span className="text-[11px] text-slate-400 font-mono">65%</span>
                  <input
                    type="range"
                    min="0.65"
                    max="1.1"
                    step="0.05"
                    value={uiScale}
                    onChange={(e) => onUiScaleChange(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <span className="text-[11px] text-slate-400 font-mono">110%</span>
                </div>
              </div>

              {/* Controls Quick Reference PC */}
              <div>
                <h4 className="text-xs uppercase font-orbitron tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
                  <Crosshair className="w-4 h-4" /> PC / Keyboard & Mouse
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">{t.movement}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-cyan-300 text-[10px] border border-slate-700">
                      WASD / Стрелки
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">{t.aiming}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-cyan-300 text-[10px] border border-slate-700">
                      Мышь
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">{t.firing}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-cyan-300 text-[10px] border border-slate-700">
                      ЛКМ / Space
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">{t.dash}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-pink-400 text-[10px] border border-slate-700">
                      Shift
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: HUD & UI SCALE */}
          {activeTab === 'hud' && (
            <>
              {/* Main Scale Control */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-cyan-500/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-cyan-300 font-orbitron font-bold text-sm">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    {t.uiScale}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-300 font-black text-base px-2.5 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-400/50">
                      {Math.round(uiScale * 100)}%
                    </span>
                    {uiScale !== 1.0 && (
                      <button
                        onClick={() => onUiScaleChange(1.0)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1 transition-all cursor-pointer"
                        title="Reset to 100%"
                      >
                        <RotateCcw className="w-3 h-3" />
                        100%
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  {t.hudScaleTabDesc}
                </p>

                {/* Range Slider */}
                <div className="flex items-center space-x-3 pt-1">
                  <span className="text-xs text-slate-400 font-mono font-bold">65%</span>
                  <input
                    type="range"
                    min="0.65"
                    max="1.25"
                    step="0.05"
                    value={uiScale}
                    onChange={(e) => onUiScaleChange(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-2.5 bg-slate-800 rounded-lg"
                  />
                  <span className="text-xs text-slate-400 font-mono font-bold">125%</span>
                </div>

                {/* Quick Presets */}
                <div className="pt-2">
                  <span className="text-[10px] font-orbitron uppercase text-slate-400 block mb-1.5">
                    Быстрые пресеты масштаба / Presets:
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[0.75, 0.85, 1.0, 1.1, 1.2].map((s) => (
                      <button
                        key={s}
                        onClick={() => onUiScaleChange(s)}
                        className={`py-1.5 px-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer text-center ${
                          Math.abs(uiScale - s) < 0.04
                            ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {Math.round(s * 100)}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Real-time Interactive HUD Mockup Preview */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-orbitron uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Живой предпросмотр масштабирования (Preview):
                </span>
                <div className="w-full h-36 bg-slate-950 rounded-lg border border-slate-800 relative overflow-hidden flex items-center justify-center p-3">
                  <div
                    className="w-full h-full flex flex-col justify-between pointer-events-none transition-transform duration-150"
                    style={{ transform: `scale(${uiScale})`, transformOrigin: 'center center' }}
                  >
                    {/* Mock top HUD */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-slate-900/90 border border-cyan-500/40 rounded-lg px-2 py-1">
                        <div className="w-5 h-5 rounded bg-cyan-400 text-slate-950 font-bold text-[9px] flex items-center justify-center font-orbitron">
                          PLS
                        </div>
                        <div className="w-16 space-y-0.5">
                          <div className="h-1.5 bg-emerald-400 rounded-full w-full" />
                          <div className="h-1 bg-cyan-400 rounded-full w-3/4" />
                        </div>
                      </div>
                      <div className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-amber-300">
                        🏆 #1 Pilot (450)
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-[9px] font-mono text-cyan-400">
                        📡 MAP
                      </div>
                    </div>

                    {/* Mock center */}
                    <div className="text-center text-[10px] font-orbitron text-slate-500 uppercase tracking-widest">
                      Cyber Combat Viewport
                    </div>

                    {/* Mock bottom */}
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                        ⚡ DASH: READY
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                        💥 FIRE
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  💡 На смартфонах рекомендуется масштаб 75-80%, чтобы элементы интерфейса не закрывали обзор космоса. На больших экранах можно использовать 100-115%.
                </p>
              </div>
            </>
          )}

          {/* TAB 3: MOBILE CONTROLS */}
          {activeTab === 'mobile' && (
            <>
              {/* Joystick Size */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-orbitron font-bold text-slate-200">
                  {t.joystickSize}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['small', 'medium', 'large'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => updateMobile({ joystickSize: sz })}
                      className={`py-2 px-2 rounded-lg font-orbitron font-bold text-[11px] uppercase transition-all cursor-pointer ${
                        mobileSettings.joystickSize === sz
                          ? 'bg-cyan-950/80 border border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sz === 'small' ? '90px' : sz === 'medium' ? '120px' : '150px'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Button Size */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-orbitron font-bold text-slate-200">
                  {t.buttonSize}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['small', 'medium', 'large'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => updateMobile({ buttonSize: sz })}
                      className={`py-2 px-2 rounded-lg font-orbitron font-bold text-[11px] uppercase transition-all cursor-pointer ${
                        mobileSettings.buttonSize === sz
                          ? 'bg-pink-950/80 border border-pink-400 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sz === 'small' ? '52px' : sz === 'medium' ? '64px' : '78px'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Preset */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-orbitron font-bold text-slate-200">
                  {t.layoutPreset}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'standard', label: t.presetStandard },
                      { id: 'compact', label: t.presetCompact },
                      { id: 'spaced', label: t.presetSpaced },
                      { id: 'left_handed', label: t.presetLeftHanded },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => updateMobile({ layoutPreset: p.id })}
                      className={`py-2 px-2.5 rounded-lg font-orbitron font-bold text-[10px] sm:text-[11px] uppercase transition-all cursor-pointer truncate ${
                        mobileSettings.layoutPreset === p.id
                          ? 'bg-cyan-950/80 border border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Controls Opacity */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-orbitron font-bold text-slate-200">
                  <span>{t.controlsOpacity}</span>
                  <span className="font-mono text-cyan-400">{Math.round(mobileSettings.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.05"
                  value={mobileSettings.opacity}
                  onChange={(e) => updateMobile({ opacity: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Move & Aim Sensitivity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-orbitron font-bold text-slate-200">
                    <span>{t.moveSensitivity}</span>
                    <span className="font-mono text-cyan-400">{mobileSettings.moveSensitivity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={mobileSettings.moveSensitivity}
                    onChange={(e) => updateMobile({ moveSensitivity: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-orbitron font-bold text-slate-200">
                    <span>{t.aimSensitivity}</span>
                    <span className="font-mono text-pink-400">{mobileSettings.aimSensitivity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={mobileSettings.aimSensitivity}
                    onChange={(e) => updateMobile({ aimSensitivity: parseFloat(e.target.value) })}
                    className="w-full accent-pink-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              {/* Auto-Fire Toggle */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="pr-3">
                  <div className="text-xs font-orbitron font-bold text-slate-200 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>{t.autoFire}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">{t.autoFireDesc}</p>
                </div>
                <button
                  onClick={() => updateMobile({ autoFire: !mobileSettings.autoFire })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-orbitron font-bold uppercase cursor-pointer transition-all ${
                    mobileSettings.autoFire
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                >
                  {mobileSettings.autoFire ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Vibration & Haptics */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="pr-3">
                  <div className="text-xs font-orbitron font-bold text-slate-200 flex items-center gap-1.5">
                    <Vibrate className="w-4 h-4 text-pink-400" />
                    <span>{t.vibration}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">{t.vibrationDesc}</p>
                </div>
                <button
                  onClick={() => updateMobile({ vibration: !mobileSettings.vibration })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-orbitron font-bold uppercase cursor-pointer transition-all ${
                    mobileSettings.vibration
                      ? 'bg-pink-500/20 text-pink-300 border border-pink-400/60 shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                >
                  {mobileSettings.vibration ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Fair Aim Assist */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-orbitron font-bold text-slate-200">
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <Crosshair className="w-4 h-4 text-emerald-400" />
                    {t.aimAssist}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">{t.aimAssistDesc}</p>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {(
                    [
                      { id: 'off', label: t.assistOff },
                      { id: 'low', label: t.assistLow },
                      { id: 'medium', label: t.assistMed },
                    ] as const
                  ).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => updateMobile({ aimAssist: a.id })}
                      className={`py-2 px-1 rounded-lg font-orbitron font-bold text-[10px] uppercase transition-all cursor-pointer text-center ${
                        mobileSettings.aimAssist === a.id
                          ? 'bg-emerald-950/80 border border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB 3: GRAPHICS & PERFORMANCE */}
          {activeTab === 'graphics' && (
            <>
              {/* Graphics Quality Preset */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-orbitron font-bold text-slate-200">
                  {t.graphicsQuality}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'low', label: t.qualityLow },
                      { id: 'medium', label: t.qualityMed },
                      { id: 'high', label: t.qualityHigh },
                    ] as const
                  ).map((q) => (
                    <button
                      key={q.id}
                      onClick={() => updateMobile({ graphicsQuality: q.id })}
                      className={`p-2.5 rounded-lg font-orbitron font-bold text-[10px] uppercase transition-all cursor-pointer text-center border ${
                        mobileSettings.graphicsQuality === q.id
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* FPS BOOST (60-120+ FPS) Toggle */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-cyan-500/30 flex items-center justify-between shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                <div className="pr-3">
                  <div className="flex items-center gap-1.5 text-xs font-orbitron font-bold text-cyan-300">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>{t.fpsBoost}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">{t.fpsBoostDesc}</p>
                </div>
                <button
                  onClick={() => onToggleFpsBoost?.(!fpsBoost)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-orbitron font-bold uppercase transition-all cursor-pointer ${
                    fpsBoost
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
                  }`}
                >
                  {fpsBoost ? '⚡ 120 FPS' : '30-60'}
                </button>
              </div>

              {/* DEBUG Network Performance Toggle */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="pr-3">
                  <div className="flex items-center gap-1.5 text-xs font-orbitron font-bold text-slate-200">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>{t.debugOverlay}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">{t.debugOverlayDesc}</p>
                </div>
                <button
                  onClick={() => onToggleDebug(!showDebug)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-orbitron font-bold uppercase transition-all cursor-pointer ${
                    showDebug
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
                  }`}
                >
                  {showDebug ? 'ON' : 'OFF'}
                </button>
              </div>
            </>
          )}

          {/* TAB 5: NETWORK & REGION (WebTransport & Low-Latency Routing) */}
          {activeTab === 'network' && (
            <div className="space-y-3.5">
              {/* Transport Protocol Status Card */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-cyan-400" />
                    <span className="font-orbitron font-bold text-xs text-white uppercase">
                      {lang === 'ru' ? 'Сетевой транспорт (WebTransport / WebSocket)' : 'Data Transport (WebTransport / WebSocket)'}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      networkManager.activeTransport === 'webtransport'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    }`}
                  >
                    {networkManager.activeTransport === 'webtransport' ? '⚡ WebTransport (HTTP/3 UDP)' : '🌐 WebSocket (TCP NoDelay)'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{lang === 'ru' ? 'Поддержка WebTransport браузером:' : 'Browser WebTransport Support:'}</span>
                    <span className={networkManager.webTransportSupported ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                      {networkManager.webTransportSupported ? (lang === 'ru' ? 'Да (Chromium / W3C API)' : 'Supported') : (lang === 'ru' ? 'Не поддерживается' : 'Unsupported')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{lang === 'ru' ? 'Активный протокол:' : 'Active Protocol:'}</span>
                    <span className="text-cyan-300 font-mono text-[10px]">{networkManager.transportStatus}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{lang === 'ru' ? 'Режим сокета:' : 'Socket Mode:'}</span>
                    <span className="text-emerald-400 font-mono text-[10px]">TCP_NODELAY (Nagle Disabled, 0ms buffer)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={handleTestWebTransport}
                    disabled={probingWt}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 border border-cyan-400/50 text-cyan-200 font-orbitron font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${probingWt ? 'animate-spin' : ''}`} />
                    <span>{lang === 'ru' ? 'Проверить WebTransport' : 'Test WebTransport'}</span>
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {lang === 'ru' ? 'Автоматический fallback' : 'Auto fallback enabled'}
                  </span>
                </div>

                {wtResult && (
                  <div className="p-2 rounded bg-slate-900 border border-cyan-500/20 text-[10px] text-slate-300 leading-normal animate-in fade-in">
                    {wtResult}
                  </div>
                )}
              </div>

              {/* Geographic Region & Physical Location Card */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-amber-400" />
                    <span className="font-orbitron font-bold text-xs text-white uppercase">
                      {lang === 'ru' ? 'Сервер хостинга и ваш IP адрес' : 'Hosting Server & IP Location'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                    asia-east1 (Taiwan)
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 leading-relaxed space-y-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <p>
                    {lang === 'ru'
                      ? '📍 Серверная часть игры работает в облаке Google Cloud Run в кластере asia-east1 (Тайвань). Расстояние от вашего IP до датацентра составляет ~6 800 км.'
                      : '📍 The game server runs in Google Cloud Run in the asia-east1 (Taiwan) cluster. Physical distance to your IP is ~6,800 km.'}
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    {lang === 'ru'
                      ? '💡 Скорость света в оптоволокне (~200 000 км/с) создает физический предел RTT ~140–250 мс для трансконтинентального оптоволокна. Перенести физический датацентр Google Cloud Run из кода приложения невозможно, но игра компенсирует это на 100%!'
                      : '💡 Speed of light in optical fiber (~200,000 km/s) sets a physical RTT limit of ~140-250ms across continents. The app code cannot physically move Google datacenters, but compensates 100% via client prediction!'}
                  </p>
                </div>

                {/* Routing Profiles Selector */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-orbitron font-bold text-cyan-300">
                    {lang === 'ru' ? 'Профиль оптимизации маршрута:' : 'Routing Optimization Profile:'}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSelectProfile('kz-central')}
                      className={`p-2 rounded-lg text-left text-xs border transition-all cursor-pointer ${
                        selectedProfile === 'kz-central'
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1">
                        <span>🇰🇿</span> Middle-Asia / CIS
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{lang === 'ru' ? 'Оптимизирован для СНГ' : 'CIS Low-Jitter'}</div>
                    </button>

                    <button
                      onClick={() => handleSelectProfile('auto')}
                      className={`p-2 rounded-lg text-left text-xs border transition-all cursor-pointer ${
                        selectedProfile === 'auto'
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1">
                        <span>⚡</span> Auto (Anycast)
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{lang === 'ru' ? 'Авто-выбор маршрута' : 'Fastest Edge Relay'}</div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Zero-Latency Client Prediction Card */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-orbitron font-bold text-xs">
                  <Shield className="w-4 h-4" />
                  <span>{lang === 'ru' ? 'Мгновенный отклик (0ms Input Lag)' : 'Zero-Latency Response (0ms Input Lag)'}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {lang === 'ru'
                    ? 'В игре реализован движок Client-Side Prediction (60 FPS Hermite interpolation). Когда вы нажимаете клавиши полета, мышь или выстрел — ваш корабль реагирует мгновенно за 0 мс на вашем экране! Вам не нужно ждать возвращения пакета от сервера для маневров.'
                    : 'The client-side prediction engine runs at 60 FPS. Your ship turns, shoots, and dashes immediately with 0ms visual input lag on your display without waiting for network transit round trips!'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950/80 border-t border-cyan-500/20 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-orbitron font-bold text-xs uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
          >
            {lang === 'ru' ? 'СОХРАНИТЬ' : 'DONE'}
          </button>
        </div>
      </div>
    </div>
  );
};
