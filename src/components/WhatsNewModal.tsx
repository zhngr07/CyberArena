import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Zap,
  Shield,
  Crosshair,
  Wifi,
  Layers,
  Flame,
  Compass,
  Award,
  Globe,
  Sliders,
  CheckCircle2,
  Trophy,
  User,
  Swords,
  Smartphone,
  ShoppingBag,
  Bot,
  Crown,
  Clock,
  Skull,
  Rocket,
  Palette,
  Star,
  Activity,
  ChevronRight,
  ShieldAlert,
  FlameKindling,
  History,
} from 'lucide-react';
import { Language } from '../data/translations.ts';
import { MODIFIER_METAS } from '../data/weapons.ts';

interface WhatsNewModalProps {
  lang: Language;
  onClose: () => void;
  onToggleLang?: () => void;
}

type TabType =
  | 'overview_07'
  | 'cyber_shop'
  | 'boss_overhaul'
  | 'mobile_edition'
  | 'leaderboard_rp'
  | 'animations'
  | 'weapons'
  | 'modifiers'
  | 'archive_06';

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ lang, onClose, onToggleLang }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview_07');
  const [currentLang, setCurrentLang] = useState<Language>(lang);

  const isRu = currentLang === 'ru';

  const toggleLanguage = () => {
    const next = currentLang === 'ru' ? 'en' : 'ru';
    setCurrentLang(next);
    if (onToggleLang) {
      onToggleLang();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.3)] select-none overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-cyan-500/20 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-orbitron font-black text-sm sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-pink-400">
                  {isRu ? 'ЧТО НОВОГО? • BETA 0.7: «ТИТАНЫ КИБЕРПАНКА»' : "WHAT'S NEW? • BETA 0.7: TITANS OF CYBERPUNK"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40 animate-pulse">
                  {isRu ? 'ОБНОВЛЕНИЕ 0.7' : 'UPDATE 0.7'}
                </span>
              </div>
              <p className="text-[11px] font-mono text-cyan-400/80">
                {isRu
                  ? '25+ Кораблей • Шляпы & Обвесы • Мобильная Версия • Усиленный Босс (6 мин) & Мини-НПС • Зал Славы'
                  : '25+ Ships • Hats & Accessories • Dedicated Mobile Edition • 6-Min Boss & Mini-NPCs • Leaderboard RP'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold cursor-pointer transition-colors"
              title={isRu ? 'Переключить на английский' : 'Switch to Russian'}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentLang.toUpperCase()}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 px-3 sm:px-6 py-2 border-b border-slate-800 bg-slate-950/40 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview_07')}
            className={`px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs tracking-wide whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'overview_07'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isRu ? '🚀 Обзор 0.7' : '🚀 Overview 0.7'}</span>
          </button>

          <button
            onClick={() => setActiveTab('cyber_shop')}
            className={`px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs tracking-wide whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'cyber_shop'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>{isRu ? '🛒 Кибер-Магазин (25+)' : '🛒 Cyber Shop (25+)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('boss_overhaul')}
            className={`px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs tracking-wide whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'boss_overhaul'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Swords className="w-3.5 h-3.5 text-rose-400" />
            <span>{isRu ? '👾 Босс (6 мин) & НПС' : '👾 Boss (6m) & NPCs'}</span>
          </button>

          <button
            onClick={() => setActiveTab('mobile_edition')}
            className={`px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs tracking-wide whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'mobile_edition'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isRu ? '📱 Мобильная Версия' : '📱 Mobile Edition'}</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard_rp')}
            className={`px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs tracking-wide whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'leaderboard_rp'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-purple-400" />
            <span>{isRu ? '🏆 Зал Славы & RP' : '🏆 Hall of Fame & RP'}</span>
          </button>

          <button
            onClick={() => setActiveTab('animations')}
            className={`px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs tracking-wide whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'animations'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>{isRu ? '✨ Плавные Анимации' : '✨ Fluid Animations'}</span>
          </button>

          <button
            onClick={() => setActiveTab('weapons')}
            className={`px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs tracking-wide whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'weapons'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isRu ? '9 Пушек' : '9 Weapons'}</span>
          </button>

          <button
            onClick={() => setActiveTab('modifiers')}
            className={`px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs tracking-wide whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'modifiers'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isRu ? '14 Модов' : '14 Modifiers'}</span>
          </button>

          <button
            onClick={() => setActiveTab('archive_06')}
            className={`px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs tracking-wide whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'archive_06'
                ? 'bg-slate-700/40 text-slate-200 border border-slate-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{isRu ? 'Архив (0.6)' : 'Archive (0.6)'}</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-200">
          {/* TAB 1: OVERVIEW 0.7 */}
          {activeTab === 'overview_07' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/50 via-purple-950/40 to-pink-950/40 border border-cyan-500/40 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <h3 className="text-base sm:text-lg font-orbitron font-bold text-cyan-300">
                    {isRu
                      ? 'Добро пожаловать в Beta 0.7: «Титаны Киберпанка»!'
                      : 'Welcome to Beta 0.7: Titans of Cyberpunk!'}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isRu
                    ? 'Обновление Beta 0.7 — крупнейший контентный апдейт в истории CyberArena! Вас ждет колоссально расширенный Кибер-Магазин (25+ кораблей, 18+ шляп, 12+ аксессуаров, 16+ шлейфов), выделенная Мобильная Версия CyberArena с продуманным сенсорным управлением, глубокая переработка режима «Битва с Боссом» с 6-минутным таймером, мини-НПС дронами и умным ИИ союзников, плавные кинематические анимации и обновленный Зал Славы с RP-рейтингом.'
                    : 'Beta 0.7 is the biggest content leap in CyberArena history! Enjoy a massively expanded Cyber Store (25+ ships, 18+ hats, 12+ accessories, 16+ trails), dedicated Mobile Edition with ergonomic touch virtual controls, Boss Raid overhaul featuring 6-minute timer, defensive mini-NPC drones, intelligent friendly AI bot targeting, fluid kinematic animations, and the competitive Hall of Fame.'}
                </p>
              </div>

              {/* 6 Key Pillars of 0.7 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/30 hover:border-amber-400/60 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 mb-2.5">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <h4 className="font-orbitron font-bold text-xs text-amber-300 mb-1">
                    {isRu ? '1. Кибер-Магазин 2.0 (25+ Кораблей)' : '1. Expanded Cyber Store (25+ Ships)'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? '25 уникальных корпусов кораблей, 18 шляп, 12 аксессуаров, 16 неоновых шлейфов и 11 титулов с интерактивным предпросмотром!'
                      : '25 custom vessel hulls, 18 hats, 12 accessories, 16 glowing trails, and 11 pilot titles with interactive 3D preview!'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-500/30 hover:border-rose-400/60 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 mb-2.5">
                    <Swords className="w-4 h-4" />
                  </div>
                  <h4 className="font-orbitron font-bold text-xs text-rose-300 mb-1">
                    {isRu ? '2. Босс 6 Минут & Мини-НПС' : '2. 6-Min Boss & Mini-NPCs'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Таймер рейда увеличен до 6 минут (360 сек). Босс призывает защитных мини-НПС («Стражи Пустоты»). ИИ союзников стреляет строго по боссу!'
                      : 'Match timer increased to 6 minutes (360s). Boss summons escort mini-NPC drones. Friendly bots shoot exclusively at Boss & minions!'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/30 hover:border-emerald-400/60 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2.5">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h4 className="font-orbitron font-bold text-xs text-emerald-300 mb-1">
                    {isRu ? '3. Выделенная Мобильная Версия' : '3. Dedicated Mobile Edition'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Авто-определение мобильных устройств! Сенсорный стик перемещения слева, триггер прицела справа, Turbo Dash и компактный мобильный HUD.'
                      : 'Auto-detected mobile mode! Floating move joystick on left, fire stick on right, one-touch Dash, and ergonomic clean HUD.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-pink-500/30 hover:border-pink-400/60 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 mb-2.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="font-orbitron font-bold text-xs text-pink-300 mb-1">
                    {isRu ? '4. Плавные Анимации Пилотов' : '4. Fluid Ship Animations'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Кинематическое сглаживание поворота корпуса, пульсирующие энергощиты, частицы сопел при ускорении и прорисовка скинов в бою.'
                      : 'Angular kinematic turning damping, pulsating kinetic energy shields, dynamic thruster flame particles, and live skin rendering.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-purple-500/30 hover:border-purple-400/60 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-2.5">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <h4 className="font-orbitron font-bold text-xs text-purple-300 mb-1">
                    {isRu ? '5. Зал Славы, RP & Профили' : '5. Leaderboard, RP & Profiles'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? '6 ранговых лиг (от Рекрута до Apex Dominator), начисление RP за матчи и босса, детальные карточки профилей с титулами и скинами.'
                      : '6 rank tiers from Recruit to Apex Dominator, RP earned in PvP and boss matches, detailed profile cards with equipped items.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-sky-500/30 hover:border-sky-400/60 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 mb-2.5">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <h4 className="font-orbitron font-bold text-xs text-sky-300 mb-1">
                    {isRu ? '6. Улучшения Меню & Лобби' : '6. Menu & Lobby Polish'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Быстрое переключение режима комнаты хостом, плавный мобильный скролл всех панелей, ускоренный опрос пинга и стабильный FPS.'
                      : 'Host mode switcher, smooth mobile vertical scrolling, fast 800ms ping telemetry, and locked 60 FPS performance.'}
                  </p>
                </div>
              </div>

              {/* Summary checklist */}
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                <h4 className="font-orbitron font-bold text-xs text-cyan-300 uppercase tracking-wider">
                  {isRu ? 'Чеклист главных новинок Beta 0.7:' : 'Beta 0.7 Highlights Checklist:'}
                </h4>
                <ul className="text-xs text-slate-300 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>{isRu ? '25+ Кораблей в Кибер-Магазине' : '25+ Ships in Cyber Store'}</strong>{' '}
                      — {isRu ? 'От тяжелых дредноутов до юрких перехватчиков и футуристических кораблей предтеч.' : 'From heavy dreadnoughts and nimble interceptors to futuristic precursor vessels.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>{isRu ? 'Категория «Аксессуары» (12 шт) и «Шляпы» (18 шт)' : 'Accessories & Hats Categories'}</strong>{' '}
                      — {isRu ? 'Кибер-крылья, орбитальные дроны, плечевые турели, короны, визоры и шлемы.' : 'Cyber wings, orbiting drones, shoulder turrets, crowns, visors, and battle helms.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>{isRu ? 'Таймер Босса увеличен до 6 минут (360 сек)' : 'Boss Timer Increased to 6 Minutes (360s)'}</strong>{' '}
                      — {isRu ? 'Теперь у пилотов достаточно времени, чтобы пробить щиты Титана и зачистить волны миньонов!' : 'Gives squads enough tactical runway to melt Titan shields and clear minion escorts!'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>{isRu ? 'Мини-НПС «Стражи Пустоты»' : 'Mini-NPC "Void Sentinels"'}</strong>{' '}
                      — {isRu ? 'Босс призывает автономных защитных дронов, которые отвлекают огонь игроков и атакуют плазмой.' : 'Boss summons defensive drones that swarm players and fire plasma rounds.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>{isRu ? 'Умный ИИ Ботов-Союзников' : 'Smart Friendly AI Bot Targeting'}</strong>{' '}
                      — {isRu ? 'Боты в рейде больше не стреляют по союзным пилотам, а фокусят огонь исключительно на Боссе и мини-НПС!' : 'Bots never friendly-fire in raid mode, coordinating fire strictly at Boss & minions!'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>{isRu ? 'Мобильная Версия CyberArena' : 'Dedicated CyberArena Mobile Edition'}</strong>{' '}
                      — {isRu ? 'Полная адаптация под телефоны: стики управления, триггеры огня и рывка, масштабирование под тач-экраны.' : 'Tailored mobile gameplay with dual virtual joysticks, responsive dash, and touch-optimized UI.'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: CYBER SHOP 2.0 */}
          {activeTab === 'cyber_shop' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-slate-900 border border-amber-500/40 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <h3 className="font-orbitron font-bold text-sm sm:text-base text-amber-300">
                    {isRu
                      ? 'КИБЕР-МАГАЗИН 2.0: 25+ КОРАБЛЕЙ, ШЛЯПЫ, ОБВЕСЫ И ШЛЕЙФЫ'
                      : 'CYBER STORE 2.0: 25+ SHIPS, HATS, ACCESSORIES & TRAILS'}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isRu
                    ? 'Кибер-Магазин преобразился! Теперь в вашем распоряжении 25 уникальных корпусов кораблей со светящимися элементами, отдельная категория «Аксессуары» (12 штук), 18 классных головных уборов, 16 завораживающих неоновых шлейфов и 11 боевых титулов. Все предметы имеют интерактивный предпросмотр перед покупкой.'
                    : 'The Cyber Store has been massively upgraded! Choose from 25 distinctive starship hulls with neon energy trims, dedicated "Accessories" category (12 items), 18 stylish hats, 16 mesmerizing thruster trails, and 11 pilot titles with interactive previews.'}
                </p>
              </div>

              {/* Category Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 25 Ships */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-orbitron font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                      <Rocket className="w-4 h-4 text-cyan-400" />
                      {isRu ? '25 Корпусов Кораблей' : '25 Ship Hulls'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                      25 MODELS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                    {isRu
                      ? 'Каждый корабль отрисовывается в бою с уникальной геометрией, неоновыми соплами и световыми контурами:'
                      : 'Every vessel is rendered in live combat with custom vector geometry, thruster nozzles, and neon highlights:'}
                  </p>
                  <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                    {[
                      'Phantom',
                      'Dragon',
                      'Raven',
                      'Dreadnought',
                      'UFO',
                      'Phoenix',
                      'Viper',
                      'Specter',
                      'Titan',
                      'Valkyrie',
                      'Interceptor',
                      'Nebula',
                      'Hyperion',
                      'Chronos',
                      'Eclipse',
                      'Aurora',
                      'Tempest',
                      'Nemesis',
                      'Apex',
                      'Void Walker',
                      'Pulsar',
                      'Cyber Core',
                      'Zenith',
                      'Infinity',
                      'Solaris',
                    ].map((ship) => (
                      <span
                        key={ship}
                        className="px-1.5 py-0.5 rounded bg-slate-900 border border-cyan-500/20 text-slate-300"
                      >
                        {ship}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 18 Hats & Headgear */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-orbitron font-bold text-xs text-amber-300 flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" />
                      {isRu ? '18+ Шляп & Головных Уборов' : '18+ Hats & Helmets'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40">
                      18 HATS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                    {isRu
                      ? 'Отображаются поверх корпуса вашего корабля во время матча:'
                      : 'Rendered directly on top of your starship cockpit in live matches:'}
                  </p>
                  <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                    {[
                      '👑 Корона',
                      '🥽 Кибер-Визор',
                      '😈 Рога Демона',
                      '😇 Нимб',
                      '⚔️ Шлем Самурая',
                      '🎧 Наушники',
                      '🎩 Цилиндр',
                      '🪖 Берет',
                      '🛡️ Викинг',
                      '🏴‍☠️ Пират',
                      '🎸 Ирокез',
                      '👹 Маска Они',
                      '🤠 Ковбой',
                      '👨‍🚀 Астронавт',
                      '🧙 Маг',
                      '🏯 Сёгун',
                      '💎 Диадема',
                      '🏆 Золотой Шлем',
                    ].map((hat) => (
                      <span
                        key={hat}
                        className="px-1.5 py-0.5 rounded bg-slate-900 border border-amber-500/20 text-slate-300"
                      >
                        {hat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 12 Accessories */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-orbitron font-bold text-xs text-purple-300 flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-purple-400" />
                      {isRu ? '12+ Красивых Аксессуаров' : '12+ Vessel Accessories'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/40">
                      12 ACCS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                    {isRu
                      ? 'Экипируются на борта и крылья, добавляя визуальный статус:'
                      : 'Equipped onto vessel wings & hull flanks, adding prestige aura:'}
                  </p>
                  <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                    {[
                      '🪽 Кибер-Крылья',
                      '🔫 Плечевые Турели',
                      '🛡️ Генератор Щита',
                      '✨ Плазменная Аура',
                      '🐉 Хвост Дракона',
                      '⚡ Трастерные Плавники',
                      '🛰️ Орбитальный Дрон',
                      '🧣 Квантовый Плащ',
                      '💠 Голо-Эмблема',
                      '🐙 Щупальца Пустоты',
                      '⭐ Звездное Ядро',
                      '📦 Матричный Куб',
                    ].map((acc) => (
                      <span
                        key={acc}
                        className="px-1.5 py-0.5 rounded bg-slate-900 border border-purple-500/20 text-slate-300"
                      >
                        {acc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 16 Trails */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-pink-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-orbitron font-bold text-xs text-pink-300 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-pink-400" />
                      {isRu ? '16+ Неоновых Шлейфов' : '16+ Glowing Trails'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-400/40">
                      16 TRAILS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                    {isRu
                      ? 'Оставляют завораживающий след позади сопел при полете и форсаже (Dash):'
                      : 'Leaves mesmerizing particle contrail behind your thrusters during flight & Dash:'}
                  </p>
                  <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                    {[
                      '🔥 Огонь',
                      '⚡ Молния',
                      '🌈 Радуга',
                      '🟢 Матрица',
                      '🟣 Плазма',
                      '☀️ Солнечный',
                      '🌌 Пустота',
                      '✨ Золотой',
                      '🫧 Пузыри',
                      '☣️ Токсичный',
                      '💠 Кибер-Искры',
                      '⭐ Космо-Пыль',
                      '🌸 Неон-Пинк',
                      '❄️ Мороз',
                      '👾 Глитч',
                      '🌌 Сев. Сияние',
                    ].map((tr) => (
                      <span
                        key={tr}
                        className="px-1.5 py-0.5 rounded bg-slate-900 border border-pink-500/20 text-slate-300"
                      >
                        {tr}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BOSS OVERHAUL */}
          {activeTab === 'boss_overhaul' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-purple-950/40 to-slate-900 border border-rose-500/40 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Swords className="w-5 h-5 text-rose-400" />
                  <h3 className="font-orbitron font-bold text-sm sm:text-base text-rose-300">
                    {isRu
                      ? 'ПРОРАБОТКА РЕЖИМА «БИТВА С БОССОМ» (BETA 0.7 OVERHAUL)'
                      : 'BOSS RAID OVERHAUL (BETA 0.7)'}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isRu
                    ? 'Режим «Рейд на Босса» получил масштабное обновление по вашим пожеланиям! Время битвы увеличено до 6 минут (360 сек), Босс стал значительно сильнее и обзавелся эскортом маневренных мини-НПС дронов, а искусственный интеллект союзных ботов переработан — они больше никогда не стреляют по игрокам, а координированно фокусят Босса и дронов!'
                    : 'Boss Raid received a monumental overhaul! Match timer extended to 6 full minutes (360s), Boss is reinforced with more resilience and summons escort mini-NPC drones, and friendly AI bot programming has been updated to never fire at teammates, focusing exclusively on the Boss and minions!'}
                </p>
              </div>

              {/* 4 Pillars of Boss Overhaul */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/40">
                  <div className="flex items-center gap-2 mb-1.5 text-rose-300 font-orbitron font-bold text-xs">
                    <Clock className="w-4 h-4 text-rose-400" />
                    <span>{isRu ? 'Таймер 6 Минут (360 секунд)' : '6-Minute Match Timer (360s)'}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {isRu
                      ? 'Вместо 5 минут (300 сек) таймер продлен до 6 минут. Это дает пилотам достаточно времени для позиционной координации, поэтапного снятия щитов и уничтожения волн свиты босса.'
                      : 'Extended from 5 minutes (300s) to 6 full minutes. Provides squads ample tactical runway to break shield stages, kite torpedoes, and eliminate minion waves.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/40">
                  <div className="flex items-center gap-2 mb-1.5 text-purple-300 font-orbitron font-bold text-xs">
                    <Bot className="w-4 h-4 text-purple-400" />
                    <span>{isRu ? 'Мини-НПС: Стражи Пустоты' : 'Mini-NPC: Void Sentinel Drones'}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {isRu
                      ? 'Босс регулярно выпускает эскорт из маневренных дронов («Стражи Пустоты»). Дроны окружают игроков, отвлекают огонь и ведут плазменный обстрел. Уничтожайте их, чтобы спасти товарищей!'
                      : 'Boss periodically deploys agile escort drones ("Void Sentinels"). Drones circle pilots, intercept rockets, and fire plasma bursts. Cleanse them quickly to protect squadmates!'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/40">
                  <div className="flex items-center gap-2 mb-1.5 text-emerald-300 font-orbitron font-bold text-xs">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>{isRu ? 'Умный ИИ Ботов-Союзников' : 'Intelligent Friendly AI Bots'}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {isRu
                      ? 'В режиме Boss Raid боты-союзники полностью исключили огонь по игрокам! Их алгоритмы наведения заблокированы на Боссе и мини-НПС. Они активно снимают щиты и прикрывают вас.'
                      : 'In Boss Raid mode, friendly AI bots never fire towards player teammates. Their target acquisition locks onto the Boss and mini-NPC drones, acting as genuine battle partners.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/40">
                  <div className="flex items-center gap-2 mb-1.5 text-amber-300 font-orbitron font-bold text-xs">
                    <Skull className="w-4 h-4 text-amber-400" />
                    <span>{isRu ? 'Усиленный Титан Пустоты' : 'Reinforced Void Titan'}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {isRu
                      ? 'Запас прочности и фазовых щитов Босса увеличен. Во 2-й фазе выпускаются 4 самонаводящиеся ракеты, а в 3-й фазе — 360° гипер-нова из 16 снарядов в режиме перегрузки ярости!'
                      : 'Boss hull and shield capacity reinforced. Phase 2 fires 4 homing torpedoes, while Phase 3 triggers the 360-degree 16-bullet hyper-nova reactor discharge!'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MOBILE EDITION */}
          {activeTab === 'mobile_edition' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/40 to-slate-900 border border-emerald-500/40 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-orbitron font-bold text-sm sm:text-base text-emerald-300">
                    {isRu
                      ? 'МОБИЛЬНАЯ ВЕРСИЯ CYBERARENA: УДОБСТВО ДЛЯ СМАРТФОНОВ'
                      : 'CYBERARENA MOBILE EDITION: BUILT FOR TOUCH'}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isRu
                    ? 'Если вы играете с телефона или планшета, игра автоматически активирует специализированную Мобильную Версию! Она коренным образом отличается от ПК-версии: все элементы оптимизированы под сенсорный ввод, пальцы не закрывают обзор, а виртуальные контролы дают точность профессионального геймпада.'
                    : 'When you play from a phone or tablet, the game automatically boots into dedicated Mobile Edition! Distinct from the desktop version, all UI components are tailored for touch interaction, thumb occlusions are avoided, and virtual controls offer controller-grade precision.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                  <h4 className="font-orbitron font-bold text-xs text-emerald-300 mb-1 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    {isRu ? 'Плавающий Аналоговый Стик' : 'Floating Move Joystick'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Левая половина экрана отведена под перемещение. Стик динамически центрируется в точке первого касания пальца для комфорта кисти.'
                      : 'Left screen area controls ship thrust. The joystick dynamically anchors where your thumb touches for fatigue-free control.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/30">
                  <h4 className="font-orbitron font-bold text-xs text-cyan-300 mb-1 flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5" />
                    {isRu ? 'Сенсорный Прицел & Огонь' : 'Touch Aim & Auto-Fire'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Правая зона экрана управляет направлением стрельбы. Отклоняйте стик в сторону врага — огонь открывается мгновенно!'
                      : 'Right screen controls aim direction. Pointing the aim stick automatically triggers high-cadence cannon fire towards targets!'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30">
                  <h4 className="font-orbitron font-bold text-xs text-amber-300 mb-1 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    {isRu ? 'Быстрый Dash & Оружие' : 'Quick Dash & Weapon Swap'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Крупная кнопка DASH прямо под большим пальцем для идеального рывка (Perfect Dash), плюс удобный селектор смены пушек.'
                      : 'Large prominent DASH button right under your thumb for reactive dodging, accompanied by a quick weapon switcher.'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <span className="font-orbitron font-bold text-emerald-400 block">
                  {isRu ? '💡 Мобильные фичи интерфейса:' : '💡 Mobile Interface Features:'}
                </span>
                <p className="text-slate-400">
                  {isRu
                    ? '• Сенсорный скролл всех списков и модалок без залипаний. • Авто-скрытие некритичных оверлеев во время ожесточенной перестрелки. • Увеличенные индикаторы щита и боезапаса. • Поддержка вертикальной и горизонтальной ориентации.'
                    : '• Frictionless touch swipe scrolling across all modals & shop items. • Auto-hidden auxiliary overlays during intensive firefights. • Enlarged shield & ammo telemetry bars. • Seamless landscape & portrait support.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: LEADERBOARD & RP */}
          {activeTab === 'leaderboard_rp' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-amber-950/30 to-slate-900 border border-purple-500/40 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-purple-400" />
                  <h3 className="font-orbitron font-bold text-sm sm:text-base text-purple-300">
                    {isRu
                      ? 'ТАБЛИЦА ЛИДЕРОВ, RP И ПРОФИЛИ ПИЛОТОВ'
                      : 'LEADERBOARD, RP RATING & PILOT PROFILES'}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isRu
                    ? 'В Beta 0.7 система рейтинга (RP) и профилей получила финальную полировку. Зарабатывайте RP за победы в PvP, уничтожение врагов и поверженных боссов в рейдах. Поднимайтесь по 6 ранговым ступеням и открывайте престижные титулы!'
                    : 'Beta 0.7 refines the competitive RP ranking ladder and pilot profiles. Earn RP from PvP victories, frags, and raid boss triumphs. Climb through 6 competitive divisions and unlock prestigious prestige titles!'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <h4 className="font-orbitron font-bold text-xs text-amber-400 mb-2 flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    {isRu ? 'Ранговая шкала боевого рейтинга (RP)' : 'RP Rating & Rank Tiers'}
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
                    <li className="flex items-center justify-between">
                      <span>🎖️ РЕКРУТ (Recruit):</span>
                      <span className="text-slate-400">0 - 499 RP</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>🛡️ СТРАЖ (Guardian):</span>
                      <span className="text-cyan-400 font-bold">500 - 999 RP</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>🥇 ВЕТЕРАН (Veteran):</span>
                      <span className="text-emerald-400 font-bold">1000 - 1499 RP</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>💎 КИБЕР-АС (Cyber Ace):</span>
                      <span className="text-purple-400 font-bold">1500 - 1999 RP</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>👑 МАСТЕР (Master):</span>
                      <span className="text-amber-400 font-bold">2000 - 2499 RP</span>
                    </li>
                    <li className="flex items-center justify-between border-t border-slate-800 pt-1">
                      <span className="text-pink-400 font-bold">⚡ АБСОЛЮТ (Apex Dominator):</span>
                      <span className="text-pink-400 font-black">2500+ RP</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <h4 className="font-orbitron font-bold text-xs text-cyan-400 mb-2 flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    {isRu ? 'Карточка карьеры & Зал Славы' : 'Career Profile & Hall of Fame'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-2">
                    {isRu
                      ? 'В профиле отображаются экипированные скины корабля, шляпы, аксессуары и позывной с титулом. Отслеживайте Win Rate, соотношение фрагов к смертям (K/D), наивысший счёт и количество поверженных боссов.'
                      : 'Your pilot profile showcases equipped starship hulls, hats, accessories, and pilot title. Tracks Win Rate, K/D ratio, highest match score, and defeated raid bosses.'}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isRu
                      ? 'Кнопка «Зал Славы» (Кубок) в верхней панели открывает глобальную таблицу лидеров с лучшими пилотами сервера.'
                      : 'The "Hall of Fame" trophy button in the header opens the live server leaderboard displaying top aces.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ANIMATIONS */}
          {activeTab === 'animations' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-slate-900 border border-pink-500/40 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-pink-400" />
                  <h3 className="font-orbitron font-bold text-sm sm:text-base text-pink-300">
                    {isRu
                      ? 'ОБНОВЛЕННЫЕ И ПЛАВНЫЕ АНИМАЦИИ ИГРОКОВ'
                      : 'UPGRADED & FLUID PLAYER ANIMATIONS'}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isRu
                    ? 'Визуальный отклик кораблей и кастомизаций был полностью переписан на холсте (Canvas): плавная кинематика поворота, физика ускорения, динамические частицы сопел и эффекты поглощения урона щитами.'
                    : 'Starship visual response and cosmetic rendering have been overhauled on Canvas: smooth rotational damping, acceleration physics, dynamic thruster jet particles, and kinetic shield ripple absorb effects.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <h4 className="font-orbitron font-bold text-xs text-pink-300 mb-1 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-pink-400" />
                    {isRu ? 'Кинематическое сглаживание поворота' : 'Kinematic Angular Damping'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Корпус корабля больше не дёргается при резкой смене направления прицела. Плавная интерполяция угла поворота создает реалистичное ощущение инерции в невесомости.'
                      : 'Vessels no longer snap jarringly when sweeping aim angles. Smooth angular interpolation mimics genuine space zero-g inertia.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <h4 className="font-orbitron font-bold text-xs text-cyan-300 mb-1 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    {isRu ? 'Пульсация и реакция щитов' : 'Pulsating Reactive Shield Waves'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Энергощит визуализируется мягким неоновым ореолом. При попадании снаряда по щиту пробегает круговая ударная волна, сигнализирующая о поглощении урона.'
                      : 'Energy shields project a subtle neon halo. Projectile impacts send kinetic circular ripples through the barrier, indicating shield absorption.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <h4 className="font-orbitron font-bold text-xs text-amber-300 mb-1 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    {isRu ? 'Интерактивные сопла и трастеры' : 'Interactive Thruster Plumes'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Сопла двигателей реагируют на нажатие клавиш: в покое — тлеющий свет, при движении — плазменный факел, при Turbo Dash — ослепительный импульс.'
                      : 'Engine exhausts react to flight inputs: idle glow when stationary, elongated plasma plume during throttle, explosive burst on Turbo Dash.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <h4 className="font-orbitron font-bold text-xs text-purple-300 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    {isRu ? 'Отрисовка всех кастомизаций в бою' : 'Live Rendering of All Cosmetics'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Все 25 типов корпусов, надетые шляпы, аксессуары и шлейфы корректно прорисовываются прямо в игре на холсте с сохранением высокой кадровой частоты.'
                      : 'All 25 unique hull archetypes, equipped hats, flank accessories, and trails are rendered in real time while maintaining smooth 60 FPS.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: WEAPONS */}
          {activeTab === 'weapons' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                {isRu
                  ? 'Каждое оружие обладает уникальной баллистикой, дальностью, сильными сторонами и контрпиками:'
                  : 'Every weapon features distinct ballistics, range profile, strengths, and counterplay:'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Plasma Cannon */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-orbitron font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-cyan-400" />
                      {isRu ? 'Plasma Cannon (Плазма)' : 'Plasma Cannon'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      DPS / BURN
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-1.5">
                    {isRu
                      ? 'Высокий sustained урон на средней дистанции. Накладывает остаточное горение (Burn), наносящее периодический урон корпусу.'
                      : 'High sustained mid-range DPS. Applies continuous burn DoT to enemy hull.'}
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-1">
                    <span>{isRu ? 'Сила: Урон по корпусу' : 'Pro: High Hull Burn'}</span>
                    <span>{isRu ? 'Слабость: Щиты' : 'Con: Weaker on Shield'}</span>
                  </div>
                </div>

                {/* 2. Burst Cannon */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-blue-500/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-orbitron font-bold text-xs text-blue-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-400" />
                      {isRu ? 'Burst Cannon (Очередная)' : 'Burst Cannon'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
                      BURST / PRECISION
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-1.5">
                    {isRu
                      ? 'Стреляет смертоносными залпами по 3 снаряда. Огромный мгновенный урон при точной наводке.'
                      : 'Fires high-speed 3-round bursts. Massive burst spike for accurate pilots.'}
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-1">
                    <span>{isRu ? 'Сила: Залповый урон' : 'Pro: Alpha Burst'}</span>
                    <span>{isRu ? 'Слабость: Пауза между очередями' : 'Con: Burst delay'}</span>
                  </div>
                </div>

                {/* 3. Missile Launcher */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-red-500/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-orbitron font-bold text-xs text-red-300 flex items-center gap-1.5">
                      <Rocket className="w-3.5 h-3.5 text-red-400" />
                      {isRu ? 'Missile Launcher (Ракетница)' : 'Missile Launcher'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-500/10 text-red-300 border border-red-500/30">
                      SPLASH / HOMING
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-1.5">
                    {isRu
                      ? 'Тяжелые ракеты с радиусом взрывного сплеша 60px. Идеально против скоплений врагов и босса.'
                      : 'Heavy explosive missiles with 60px splash radius. Devastating vs clustered enemies & bosses.'}
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-1">
                    <span>{isRu ? 'Сила: АоЕ урон' : 'Pro: AoE Blast'}</span>
                    <span>{isRu ? 'Слабость: Медленный полет' : 'Con: Slow projectile'}</span>
                  </div>
                </div>

                {/* 4. Railgun */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-orbitron font-bold text-xs text-purple-300 flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5 text-purple-400" />
                      {isRu ? 'Railgun (Рельсотрон)' : 'Railgun'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-400/40">
                      SNIPER / PIERCE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-1.5">
                    {isRu
                      ? 'Сверхдальний гиперзвуковой луч. Прошивает корабли насквозь и мгновенно сносит энергощиты.'
                      : 'Ultra long-range hypersonic beam. Pierces multiple vessels and shreds energy shields.'}
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-1">
                    <span>{isRu ? 'Сила: Снайперская точность' : 'Pro: Infinite Piercing'}</span>
                    <span>{isRu ? 'Слабость: Долгая перезарядка' : 'Con: Long cooldown'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: MODIFIERS */}
          {activeTab === 'modifiers' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-500/30">
                <div className="text-[11px] font-orbitron font-bold text-purple-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>{isRu ? '14 МОДИФИКАТОРОВ ОРУЖИЯ' : '14 WEAPON MODIFIERS'}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isRu
                    ? 'Собирайте уникальные билды оружия, комбинируя элементальные модификаторы с пушками:'
                    : 'Craft unique custom builds by fusing elemental modifiers onto your selected cannons:'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {Object.values(MODIFIER_METAS).map((mod) => (
                  <div
                    key={mod.type}
                    className="p-2.5 rounded-xl bg-slate-950/80 border transition-all hover:scale-[1.01]"
                    style={{ borderColor: `${mod.color}40` }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{mod.icon}</span>
                        <span className="font-orbitron font-bold text-slate-100 text-[11px] sm:text-xs">
                          {isRu ? mod.nameRu : mod.name}
                        </span>
                      </div>
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold uppercase"
                        style={{ borderColor: `${mod.color}60`, color: mod.color, backgroundColor: `${mod.color}15` }}
                      >
                        {mod.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                      {isRu ? mod.descriptionRu : mod.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: ARCHIVE (0.6) */}
          {activeTab === 'archive_06' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-700 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <History className="w-5 h-5 text-slate-400" />
                  <h3 className="font-orbitron font-bold text-sm sm:text-base text-slate-300">
                    {isRu ? 'АРХИВ ПАТЧЕЙ: BETA 0.6 («ПРОБУЖДЕНИЕ ТИТАНА»)' : "PATCH ARCHIVE: BETA 0.6 (TITAN'S AWAKENING)"}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {isRu
                    ? 'В версии 0.6 был заложен фундамент современной CyberArena: внедрен первый PvE-рейд на Титана Пустоты на арене 4800x4800, серверная база данных аккаунтов с логином и паролем, соревновательный рейтинг (RP), настройка масштаба HUD и оптимизация сетевого пинга.'
                    : 'Version 0.6 established the modern foundation of CyberArena: introduced the original Void Titan PvE co-op raid on a 4800x4800 map, server database for login & password accounts, competitive RP matchmaking ladder, HUD Scale slider, and network ping optimization.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="font-orbitron font-bold text-cyan-400 block mb-1">
                    {isRu ? '• Введение системы аккаунтов' : '• Account System Introduction'}
                  </span>
                  <p className="text-slate-400 text-[11px]">
                    {isRu
                      ? 'Сохранение монет, купленных скинов и статистики пилота на сервере.'
                      : 'Persistent coins, purchased cosmetics, and pilot records synced to server.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="font-orbitron font-bold text-emerald-400 block mb-1">
                    {isRu ? '• Разделение HP и Щита' : '• Separate Hull & Shield Dynamics'}
                  </span>
                  <p className="text-slate-400 text-[11px]">
                    {isRu
                      ? '100 HP корпуса + 100 HP энергощита с авто-восстановлением через 3 секунды без урона.'
                      : '100 Hull HP + 100 Shield HP with auto-recharge after 3s out of combat.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="text-[11px] font-mono text-cyan-400">
            <span>CYBERARENA • BETA 0.7: «ТИТАНЫ КИБЕРПАНКА» (TITANS OF CYBERPUNK)</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-orbitron font-black text-xs tracking-wider cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-0.5"
          >
            {isRu ? 'В БОЙ!' : 'PLAY NOW'}
          </button>
        </div>
      </div>
    </div>
  );
};
