import React from 'react';
import { Activity, Wifi, ArrowDown, ArrowUp, Server, Cpu, Layers, X } from 'lucide-react';
import { NetworkStats } from '../types/game.ts';
import { Language, TRANSLATIONS } from '../data/translations.ts';

interface NetworkDebugOverlayProps {
  stats: NetworkStats;
  lang: Language;
  fps?: number;
  playerCount?: number;
  projectileCount?: number;
  onClose: () => void;
}

export const NetworkDebugOverlay: React.FC<NetworkDebugOverlayProps> = ({
  stats,
  lang,
  fps = 60,
  playerCount = 1,
  projectileCount = 0,
  onClose,
}) => {
  const t = TRANSLATIONS[lang];

  const pingColor =
    stats.ping < 65 ? 'text-emerald-400' : stats.ping < 130 ? 'text-amber-400' : 'text-rose-400';
  const pingBg =
    stats.ping < 65 ? 'bg-emerald-500/10 border-emerald-500/30' : stats.ping < 130 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-rose-500/10 border-rose-500/30';

  const kbIn = (stats.bytesInPerSec / 1024).toFixed(1);
  const kbOut = (stats.bytesOutPerSec / 1024).toFixed(1);

  return (
    <div className="bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3 text-xs font-mono text-slate-300 shadow-[0_0_20px_rgba(6,182,212,0.25)] select-none pointer-events-auto w-64 sm:w-76">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
        <div className="flex items-center space-x-1.5 text-cyan-400 font-orbitron font-bold text-[11px]">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>{t.debugTitle}</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close Debug HUD (F3)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Grid */}
      <div className="space-y-1.5 text-[11px]">
        {/* FPS & Client Tick */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" />
            Client FPS / Tick:
          </span>
          <div className="px-1.5 py-0.2 rounded border border-cyan-500/30 bg-cyan-500/10 font-bold text-cyan-300">
            {fps} FPS <span className="text-[10px] text-slate-400 font-normal">({stats.serverTickRate || 60}Hz Svr)</span>
          </div>
        </div>

        {/* Ping row */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1">
            <Wifi className="w-3 h-3 text-cyan-400" />
            {t.statPing}:
          </span>
          <div className={`px-1.5 py-0.2 rounded border font-bold ${pingColor} ${pingBg}`}>
            {stats.ping} ms <span className="text-[10px] text-slate-400 font-normal">({t.statAvgPing}: {stats.avgPing}ms)</span>
          </div>
        </div>

        {/* Min / Max Ping */}
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-400">Min / Max Ping:</span>
          <span className="font-mono text-slate-300">
            <span className="text-emerald-400 font-bold">{stats.minPing > 0 ? `${stats.minPing}ms` : '--'}</span> / <span className="text-slate-400">{stats.maxPing > 0 ? `${stats.maxPing}ms` : '--'}</span>
          </span>
        </div>

        {/* Jitter & Packet Loss */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">{t.statJitter} / Loss:</span>
          <div className="flex items-center space-x-2">
            <span className={stats.jitter < 25 ? 'text-emerald-400' : 'text-amber-400'}>
              ±{stats.jitter} ms
            </span>
            <span>•</span>
            <span className={(stats.packetLoss || 0) === 0 ? 'text-emerald-400' : (stats.packetLoss || 0) < 5 ? 'text-amber-400' : 'text-rose-400'}>
              {stats.packetLoss || 0}% loss
            </span>
          </div>
        </div>

        {/* Entities */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            {t.statEntities}:
          </span>
          <span className="text-slate-200">
            {playerCount} pilots / {projectileCount} bullets
          </span>
        </div>

        {/* Packets Rate */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">{t.statPacketsIn}:</span>
          <div className="flex items-center space-x-2">
            <span className="text-cyan-300 flex items-center">
              <ArrowDown className="w-2.5 h-2.5 text-cyan-400 mr-0.5" />
              {stats.packetsInPerSec}/s
            </span>
            <span className="text-pink-300 flex items-center">
              <ArrowUp className="w-2.5 h-2.5 text-pink-400 mr-0.5" />
              {stats.packetsOutPerSec}/s
            </span>
          </div>
        </div>

        {/* Bandwidth */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">{t.statBandwidth}:</span>
          <div className="flex items-center space-x-2">
            <span className="text-cyan-300 flex items-center">
              <ArrowDown className="w-2.5 h-2.5 text-cyan-400 mr-0.5" />
              {kbIn} KB/s
            </span>
            <span className="text-pink-300 flex items-center">
              <ArrowUp className="w-2.5 h-2.5 text-pink-400 mr-0.5" />
              {kbOut} KB/s
            </span>
          </div>
        </div>

        {/* Reconnect Drops */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">{t.statReconnects}:</span>
          <span className={stats.reconnectCount > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
            {stats.reconnectCount} {stats.reconnectCount === 0 ? '✓' : '⚠️'}
          </span>
        </div>

        {/* Interpolation state */}
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-400">Input Lag / Pred:</span>
          <span className="text-emerald-400 font-bold font-mono">0 ms (HERMITE PREDICTION)</span>
        </div>

        {/* Transport Protocol */}
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-400">Transport:</span>
          <span className={`font-mono font-bold px-1.5 py-0.2 rounded ${stats.activeTransport === 'webtransport' ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'}`}>
            {stats.activeTransport === 'webtransport' ? '⚡ WebTransport (HTTP/3 UDP)' : '🌐 WebSocket (TCP NoDelay)'}
          </span>
        </div>

        {/* Server Region */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
          <span className="text-slate-500 flex items-center gap-1">
            <Server className="w-3 h-3 text-cyan-400" />
            {t.statRegion}:
          </span>
          <span className="text-cyan-300 font-bold uppercase flex items-center gap-1">
            <span>🇰🇿</span> {stats.region || 'MIDDLE-ASIA (KAZAKHSTAN)'}
          </span>
        </div>

        {/* Physical Cloud Host */}
        <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
          <span>Physical Host:</span>
          <span className="text-slate-400">{stats.physicalHost || 'GCP asia-east1 (Taiwan)'}</span>
        </div>
      </div>
    </div>
  );
};
