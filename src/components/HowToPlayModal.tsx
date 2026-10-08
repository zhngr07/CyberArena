import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  Copy,
  Check,
  Send,
  Users,
  Play,
  Share2,
  Sparkles,
  Gamepad2,
  Smartphone,
  Shield,
  Bot,
  Swords,
  Crosshair,
  Zap,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../data/translations.ts';
import { soundManager } from '../services/audio.ts';
import { WEAPONS, MODIFIER_METAS } from '../data/weapons.ts';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  currentRoomCode?: string;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  onClose,
  lang,
  currentRoomCode,
}) => {
  const [activeTab, setActiveTab] = useState<'invite' | 'weapons' | 'modifiers'>('invite');
  const [copiedLink, setCopiedLink] = useState(false);
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const sampleUrl = currentRoomCode
    ? `${window.location.origin}${window.location.pathname}?room=${currentRoomCode}`
    : `${window.location.origin}${window.location.pathname}?room=DEMO7`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sampleUrl);
    setCopiedLink(true);
    soundManager.playPickup();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CyberArena: Neon Battle',
          text: lang === 'ru' ? 'Заходи ко мне в комнату в CyberArena!' : 'Join my CyberArena room!',
          url: sampleUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.3)] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-pink-950/80 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.5)]">
              {activeTab === 'invite' ? (
                <Gamepad2 className="w-5 h-5 text-cyan-300" />
              ) : activeTab === 'weapons' ? (
                <Swords className="w-5 h-5 text-pink-400" />
              ) : (
                <Sparkles className="w-5 h-5 text-purple-400" />
              )}
            </div>
            <div>
              <h3 className="font-orbitron font-black text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-pink-400">
                {activeTab === 'invite'
                  ? t.guideTitle
                  : activeTab === 'weapons'
                  ? (lang === 'ru' ? 'АРСЕНАЛ ОРУЖИЯ (BETA 0.6)' : 'WEAPONS & BALANCE GUIDE 0.6')
                  : (lang === 'ru' ? '14 МОДИФИКАТОРОВ БИЛДОВ' : '14 MODULAR WEAPON MODS')}
              </h3>
              <p className="text-[11px] font-mono text-cyan-400/80">
                {activeTab === 'invite'
                  ? t.guideSubtitle
                  : activeTab === 'weapons'
                  ? (lang === 'ru' ? 'Все пушки, контрпики и нерф Railgun + Homing' : 'Weapon mechanics & counterpicks')
                  : (lang === 'ru' ? 'Полный список модулей и синергий игры' : 'Full list of modules & build synergies')}
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-orbitron font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'invite'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{lang === 'ru' ? 'КАК СЫГРАТЬ С ДРУГОМ' : 'INVITE FRIENDS'}</span>
          </button>
          <button
            onClick={() => setActiveTab('weapons')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-orbitron font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'weapons'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-[0_0_10px_rgba(236,72,153,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{lang === 'ru' ? 'ОРУЖИЕ (11 ПУШЕК)' : 'WEAPONS (11)'}</span>
          </button>
          <button
            onClick={() => setActiveTab('modifiers')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-orbitron font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'modifiers'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'ru' ? 'МОДИФИКАТОРЫ (14)' : 'MODS (14)'}</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-200">
          {activeTab === 'invite' ? (
            <>
              {/* Quick Share Box */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                <div className="text-xs font-mono text-cyan-300 text-center sm:text-left">
                  <span className="font-bold block sm:inline">
                    {lang === 'ru' ? '🔗 Твоя ссылка для друга:' : '🔗 Your link for friend:'}
                  </span>{' '}
                  <span className="text-slate-300 break-all">{sampleUrl}</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-orbitron font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? (lang === 'ru' ? 'СКОПИРОВАНО!' : 'COPIED!') : (lang === 'ru' ? 'КОПИРОВАТЬ' : 'COPY')}</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-orbitron font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">{lang === 'ru' ? 'ПОДЕЛИТЬСЯ' : 'SHARE'}</span>
                  </button>
                </div>
              </div>

              {/* 5 Step Cards */}
              <div className="grid grid-cols-1 gap-2.5">
                {/* Step 1 */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-orbitron font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="font-orbitron font-bold text-sm text-cyan-300 flex items-center gap-1.5">
                      <PlusCircle className="w-4 h-4 text-cyan-400" />
                      {t.step1Title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 font-sans leading-relaxed">
                      {t.step1Desc}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-pink-500/40 transition-all flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-500/40 text-pink-300 font-orbitron font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="font-orbitron font-bold text-sm text-pink-300 flex items-center gap-1.5">
                      <Copy className="w-4 h-4 text-pink-400" />
                      {t.step2Title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 font-sans leading-relaxed">
                      {t.step2Desc}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 transition-all flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-orbitron font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-orbitron font-bold text-sm text-amber-300 flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-amber-400" />
                      {t.step3Title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 font-sans leading-relaxed">
                      {t.step3Desc}
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/40 transition-all flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 font-orbitron font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <h4 className="font-orbitron font-bold text-sm text-purple-300 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-400" />
                      {t.step4Title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 font-sans leading-relaxed">
                      {t.step4Desc}
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)] flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-orbitron font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    5
                  </div>
                  <div>
                    <h4 className="font-orbitron font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                      <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                      {t.step5Title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 font-sans leading-relaxed">
                      {t.step5Desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pro-Tip Box */}
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{t.proTip}</span>
              </div>

              {/* Controls section */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-mono text-cyan-300 flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>{t.controlsPC}</span>
                </div>
                <div className="text-xs font-mono text-pink-300 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span>{t.controlsMobile}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Railgun Nerf Notice */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/70 to-rose-950/70 border border-rose-500/50 shadow-md">
                <div className="flex items-center gap-2 text-rose-300 font-orbitron font-bold text-xs mb-1">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>{lang === 'ru' ? 'БАЛАНС 0.5: НЕРФ СВЯЗКИ RAILGUN + HOMING' : 'BALANCE 0.5: RAILGUN + HOMING NERF'}</span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {lang === 'ru'
                    ? 'Связка Railgun + Homing больше не является абсолютной имбой! Самонаведение на Railgun имеет эффект Diminishing Returns: поворот снаряда замедлен на 78%, скорость снижена на 20%, а урон уменьшен на 15%. Теперь от выстрела можно легко увернуться с помощью Dash!'
                    : 'The Railgun + Homing combination is no longer invincible! Homing on Railgun suffers massive diminishing returns: steering turn rate is nerfed by 78%, speed reduced by 20%, and damage decreased by 15%. Target pilots can reliably evade via Turbo Dash!'}
                </p>
              </div>

              {/* Weapons Grid */}
              <div className="space-y-3">
                <h4 className="font-orbitron font-bold text-xs uppercase text-cyan-400 tracking-wider">
                  {lang === 'ru' ? 'ОСНОВНОЙ АРСЕНАЛ (11 ОРУДИЙ):' : 'PRIMARY ARSENAL (11 WEAPONS):'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.values(WEAPONS).map((w) => (
                    <div
                      key={w.type}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-orbitron font-bold text-xs text-slate-100 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: w.color }} />
                            {w.name}
                          </span>
                          <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700">
                            DMG: {w.damage}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-sans mb-2">
                          {w.description}
                        </p>
                      </div>
                      <div className="text-[10px] font-mono text-amber-300/90 bg-amber-950/30 border border-amber-500/30 rounded p-1.5 flex items-start gap-1">
                        <span className="font-bold text-amber-400 shrink-0">TIP:</span>
                        <span>{w.counterTip}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mechanics: Shield vs Hull & Perfect Dash */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/30">
                  <div className="flex items-center gap-1.5 text-xs font-orbitron font-bold text-cyan-300 mb-1">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{lang === 'ru' ? 'ЩИТ И КОРПУС' : 'SHIELD & HULL'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    {lang === 'ru'
                      ? 'Всего 200 HP (100 Щит + 100 Корпус). Щит восстанавливается через 4.5с после боя. ЭМИ-оружие отключает регенерацию на 4с!'
                      : '200 HP total (100 Shield + 100 Hull). Energy shields regenerate after 4.5s out of combat. EMP blasts disable shield recharge for 4s!'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-pink-500/30">
                  <div className="flex items-center gap-1.5 text-xs font-orbitron font-bold text-pink-300 mb-1">
                    <Zap className="w-3.5 h-3.5 text-pink-400" />
                    <span>{lang === 'ru' ? 'PERFECT DASH (+35 ОЧКОВ)' : 'PERFECT DASH (+35 PTS)'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    {lang === 'ru'
                      ? 'Сделай Dash прямо в момент пролета вражеской пули рядом с кораблем, чтобы получить бонус +35 очков и мгновенный рывок скорости!'
                      : 'Dash right as enemy bullets whiz past your hull to trigger a Perfect Dash, earning +35 bonus points and an immediate speed impulse!'}
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'modifiers' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/40 text-xs">
                <p className="text-slate-300">
                  {lang === 'ru'
                    ? '14 модификаторов модулей оружия. Можно экипировать в лобби перед стартом игры или подбирать в виде бонусов прямо на арене!'
                    : '14 weapon modifiers. Equip up to 3 mods in the lobby before match start or collect them directly in combat!'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                {Object.values(MODIFIER_METAS).map((m) => (
                  <div
                    key={m.type}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-orbitron font-bold text-xs text-slate-100 flex items-center gap-1.5">
                          <span>{m.icon}</span>
                          <span>{lang === 'ru' ? m.nameRu : m.name}</span>
                        </span>
                        <span
                          className="text-[9px] font-mono px-1 py-0.2 rounded border font-semibold uppercase"
                          style={{ borderColor: `${m.color}60`, color: m.color, backgroundColor: `${m.color}15` }}
                        >
                          {m.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans">
                        {lang === 'ru' ? m.descriptionRu : m.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-cyan-500/20 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-orbitron font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
          >
            {t.gotItBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
