import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Zap,
  Shield,
  Crosshair,
  Wifi,
  Layers,
  ChevronRight,
  Flame,
  Radio,
  Bomb,
  Repeat,
  Compass,
  Award,
  Globe,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  User,
  Swords,
  Smartphone,
  Lock,
} from 'lucide-react';
import { Language } from '../data/translations.ts';
import { MODIFIER_METAS } from '../data/weapons.ts';

interface WhatsNewModalProps {
  lang: Language;
  onClose: () => void;
  onToggleLang?: () => void;
}

type TabType = 'overview' | 'boss_raid' | 'accounts' | 'hud_scale' | 'weapons' | 'modifiers' | 'combat';

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ lang, onClose, onToggleLang }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
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
                  {isRu ? 'ЧТО НОВОГО? • BETA 0.6: «ПРОБУЖДЕНИЕ ТИТАНА»' : "WHAT'S NEW? • BETA 0.6: TITAN'S AWAKENING"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40 animate-pulse">
                  {isRu ? 'ОБНОВЛЕНИЕ 0.6' : 'UPDATE 0.6'}
                </span>
              </div>
              <p className="text-[11px] font-mono text-cyan-400/80">
                {isRu ? 'Рейд на Босса • Аккаунты Пилотов & Зал Славы • Настройка HUD Scale • Сетевой код и Мобильный скролл' : 'Titan Boss Raid • Pilot Accounts & Hall of Fame • HUD Scale Settings • Fast Netcode & Mobile Scroll'}
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
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs tracking-wide whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'overview'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isRu ? 'Обзор 0.6' : 'Overview 0.6'}</span>
          </button>

          <button
            onClick={() => setActiveTab('boss_raid')}
            className={`px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs tracking-wide whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'boss_raid'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Swords className="w-3.5 h-3.5 text-rose-400" />
            <span>{isRu ? 'Рейд на Босса' : 'Titan Boss Raid'}</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs tracking-wide whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'accounts'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{isRu ? 'Аккаунты & Зал Славы' : 'Accounts & Hall of Fame'}</span>
          </button>

          <button
            onClick={() => setActiveTab('hud_scale')}
            className={`px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs tracking-wide whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'hud_scale'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span>{isRu ? 'Масштаб HUD & Пинг' : 'HUD Scale & Ping'}</span>
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
            <span>{isRu ? '9 Новых Пушек' : '9 New Weapons'}</span>
          </button>

          <button
            onClick={() => setActiveTab('modifiers')}
            className={`px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs tracking-wide whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'modifiers'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>{isRu ? '14 Модификаторов' : '14 Modifiers'}</span>
          </button>

          <button
            onClick={() => setActiveTab('combat')}
            className={`px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs tracking-wide whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'combat'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isRu ? 'Щиты и Механики' : 'Shields & Mechanics'}</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-200">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-pink-950/40 border border-cyan-500/40 shadow-lg">
                <h3 className="text-base sm:text-lg font-orbitron font-bold text-cyan-300 mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  {isRu ? 'Добро пожаловать в Beta 0.6: Пробуждение Титана!' : "Welcome to Beta 0.6: Titan's Awakening!"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isRu
                    ? 'Обновление 0.6 выводит CyberArena на принципиально новый уровень: добавлен эпический PvE-рейд на гигантского босса, полноценная серверная система аккаунтов с сохранением всего инвентаря и монет, глобальный Зал Славы с боевым рейтингом (RP), точная настройка масштаба интерфейса (HUD Scale) и полная ликвидация сетевого джиттера!'
                    : 'Update 0.6 elevates CyberArena to a new tier: an epic co-op PvE Titan boss raid, server-authoritative account system syncing all coins and inventory, global Hall of Fame with MMR rating (RP), adjustable in-game HUD Scale, and zero-jitter netcode!'}
                </p>
              </div>

              {/* 4 Core Pillars of 0.6 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-500/30">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 mb-2.5">
                    <Swords className="w-4 h-4" />
                  </div>
                  <h4 className="font-orbitron font-bold text-xs text-rose-300 mb-1">
                    {isRu ? '1. Рейд на Босса' : '1. Titan Boss Raid'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Все пилоты объединяются против гигантского дредноута «Титан Пустоты» на арене 4800x4800 с 3 смертоносными фазами!'
                      : 'All pilots co-op vs a giant "Void Titan" dreadnought on a massive 4800x4800 arena with 3 deadly combat phases!'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/30">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 mb-2.5">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <h4 className="font-orbitron font-bold text-xs text-amber-300 mb-1">
                    {isRu ? '2. Аккаунты & Зал Славы' : '2. Accounts & Ladder'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Система Login/Password: вечное сохранение монет, скинов, статистики K/D и соревновательный рейтинг (RP) от Рекрута до Apex!'
                      : 'Login & Password accounts: persistent coins, cosmetics, K/D record and competitive RP ranking from Recruit to Apex!'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-sky-500/30">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 mb-2.5">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <h4 className="font-orbitron font-bold text-xs text-sky-300 mb-1">
                    {isRu ? '3. HUD Scale & Настройки' : '3. HUD Scale Slider'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Вкладка масштабирования от 65% до 125%, пресеты и доступ к настройкам прямо во время боя без выхода из игры!'
                      : 'Smooth UI scale from 65% to 125%, presets and in-match settings button without leaving combat!'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/30">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2.5">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <h4 className="font-orbitron font-bold text-xs text-emerald-300 mb-1">
                    {isRu ? '4. Низкий Пинг & Скролл' : '4. Fast Ping & Mobile'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Ускоренный опрос пинга (800мс), TCP NoDelay без буферных задержек и плавный мобильный скролл меню и лобби.'
                      : '800ms fast ping probe, zero-buffer TCP NoDelay sockets, and responsive vertical mobile touch scroll in all menus.'}
                  </p>
                </div>
              </div>

              {/* Summary of What's in 0.6 */}
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                <h4 className="font-orbitron font-bold text-xs text-cyan-300 uppercase tracking-wider">
                  {isRu ? 'Главные нововведения версии Beta 0.6:' : 'Key Additions in Beta 0.6:'}
                </h4>
                <ul className="text-xs text-slate-300 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>{isRu ? 'PvE Режим «Рейд на Босса»' : 'PvE Co-Op "Boss Raid" Mode'}</strong>{' '}
                      — {isRu ? 'Гигантский флагман Титан Пустоты со щитами, фазами и самонаводящимися торпедами. Огонь по союзникам отключен!' : 'Giant Void Titan dreadnought with 3 phases, shields and torpedo barrages. Friendly fire disabled!'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>{isRu ? 'Личный кабинет и сохранение прогресса' : 'Pilot Accounts & Progress Persistence'}</strong>{' '}
                      — {isRu ? 'Создай аккаунт с логином и паролем. Все монеты, экипированные скины кораблей, шляпы и цвета надежно сохраняются.' : 'Register/login with credentials. Coins, ship models, hats, and trail effects are saved permanently.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>{isRu ? 'Зал Славы и Боевой Рейтинг (RP)' : 'Hall of Fame & RP Rating Ladder'}</strong>{' '}
                      — {isRu ? 'Зарабатывай RP в победах и поднимайся в рангах от Рекрута до Абсолюта (Apex Dominator)!' : 'Earn RP in PvP victories and rank up from Recruit to Apex Dominator!'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>{isRu ? 'Исправленная вкладка масштаба HUD' : 'Fixed & Polished HUD Scale Tab'}</strong>{' '}
                      — {isRu ? 'Масштабируй радар, полоски здоровья и контролы под любой экран. Доступна кнопка настроек в правом верхнем углу в бою.' : 'Scale radar, health bars and touch controls for any screen. In-game settings button now active in top-right!'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>{isRu ? 'Адаптивный мобильный скролл' : 'Smooth Mobile Menu Scroll'}</strong>{' '}
                      — {isRu ? 'Меню и лобби легко прокручиваются пальцем, давая доступ ко всем 14 модификаторам, билдам и картам на любом смартфоне.' : 'Menus and lobby rooms scroll vertically, giving effortless access to all 14 modifiers and maps on phones.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>{isRu ? 'Селектор режимов игры в лобби' : 'Lobby Game Mode Switcher'}</strong>{' '}
                      — {isRu ? 'Хост может мгновенно менять режим комнаты: Каждый сам за себя (FFA), Командный бой (TDM), Царь Горы (KOTH) или Рейд на Босса (Boss Raid)!' : 'Room host can instantly toggle game modes: Free For All, Team Deathmatch, King of the Hill, or Titan Boss Raid!'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: BOSS RAID */}
          {activeTab === 'boss_raid' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-purple-950/40 to-slate-900 border border-rose-500/40 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Swords className="w-5 h-5 text-rose-400" />
                  <h3 className="font-orbitron font-bold text-sm sm:text-base text-rose-300">
                    {isRu ? 'РЕЙД НА БОССА: ТИТАН ПУСТОТЫ (PvE КООПЕРАТИВ)' : 'BOSS RAID: VOID TITAN (PvE CO-OP)'}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isRu
                    ? 'В режиме «Рейд на Босса» игроки больше не сражаются друг против друга — огонь по союзникам отключен! Ваша общая задача — скоординировать действия и уничтожить колоссальный флагманский корабль «Титан Пустоты» на масштабной карте «Арена Титана» (4800x4800 px).'
                    : 'In Boss Raid mode, friendly fire between players is disabled! Your squad must coordinate fire to eliminate the colossal "Void Titan" flagship on the massive "Titan Arena" map (4800x4800 px).'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-amber-400 font-orbitron font-bold text-xs mb-1">
                    {isRu ? '💥 Фаза 1 (100% - 66% HP)' : '💥 Phase 1 (100% - 66% HP)'}
                  </div>
                  <h5 className="font-orbitron text-xs text-white mb-1.5">
                    {isRu ? 'Плазменный Залп' : 'Plasma Salvo'}
                  </h5>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Босс ведет огонь сдвоенными тяжелыми плазменными турелями. Держите дистанцию и сбивайте энергощит!'
                      : 'Boss fires dual heavy plasma turrets towards closest pilots. Keep distance and melt shields!'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-purple-400 font-orbitron font-bold text-xs mb-1">
                    {isRu ? '🛡️ Фаза 2 (66% - 33% HP)' : '🛡️ Phase 2 (66% - 33% HP)'}
                  </div>
                  <h5 className="font-orbitron text-xs text-white mb-1.5">
                    {isRu ? 'Самонаводящиеся Торпеды' : 'Homing Torpedoes'}
                  </h5>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Выпуск 4 тяжелых торпед, преследующих игроков. Используйте Perfect Dash или препятствия, чтобы срезать ракеты!'
                      : 'Fires 4 explosive homing missiles. Use obstacles or Turbo Dash timing to evade lock-on!'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/30">
                  <div className="text-rose-400 font-orbitron font-bold text-xs mb-1">
                    {isRu ? '⚡ Фаза 3 (33% - 0% HP)' : '⚡ Phase 3 (33% - 0% HP)'}
                  </div>
                  <h5 className="font-orbitron text-xs text-white mb-1.5">
                    {isRu ? 'Ярость: Гипер-Нова' : 'Enrage: Hyper Nova'}
                  </h5>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Босс перегружает ядро и выпускает круговой шквал из 16 снарядов на 360 градусов! Требуется максимальная реакция.'
                      : 'Reactor overcharges into a rotating 360-degree 16-bullet barrage! Demands peak evasive maneuvering.'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <h4 className="font-orbitron font-bold text-xs text-cyan-300">
                  {isRu ? 'Награды и интерфейс рейда:' : 'Raid Rewards & Combat HUD:'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isRu
                    ? 'Во время боя на экране отображается гигантская шкала HP и щитов Титана, метка босса на радаре в виде красного черепа, а также звание «👑 MVP УРОНА» для игрока, нанесшего наибольший урон. За победу над боссом начисляются повышенные монеты и бонусный боевой рейтинг RP в профиль!'
                    : 'The HUD features a dedicated Titan boss health bar, pulsing radar skull tracker, and live "👑 DAMAGE MVP" badge. Defeating the boss grants boosted coins and RP rank progression!'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNTS & LADDER */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-slate-900 border border-amber-500/40 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h3 className="font-orbitron font-bold text-sm sm:text-base text-amber-300">
                    {isRu ? 'АККАУНТЫ, КАРЬЕРА ПИЛОТА & ЗАЛ СЛАВЫ' : 'ACCOUNTS, PILOT CAREER & HALL OF FAME'}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isRu
                    ? 'По вашим просьбам добавлена полноценная система учетных записей (Логин и Пароль)! Теперь вы не потеряете заработанные монеты, купленные скины кораблей, шляпы, следы и титулы при перезагрузке или смене устройства.'
                    : 'As requested, a complete account system (Login & Password) is now live! Your hard-earned coins, unlocked ship hulls, cosmetics, hats, and battle titles are permanently saved on the server.'}
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
                      ? 'В профиле пилота отслеживается процент побед (Win Rate), соотношение фрагов к смертям (K/D), наивысший счёт и количество поверженных боссов.'
                      : 'Your pilot profile tracks career Win Rate, K/D ratio, highest match score, and defeated raid bosses.'}
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

          {/* TAB 4: HUD SCALE & PING */}
          {activeTab === 'hud_scale' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/40 via-blue-950/40 to-slate-900 border border-sky-500/40 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sliders className="w-5 h-5 text-sky-400" />
                  <h3 className="font-orbitron font-bold text-sm sm:text-base text-sky-300">
                    {isRu ? 'МАСШТАБ HUD, ОПТИМИЗАЦИЯ PING И МОБИЛЬНЫЙ СКРОЛЛ' : 'HUD SCALE, PING LATENCY & MOBILE SCROLL'}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isRu
                    ? 'Мы полностью починили работу вкладки «Масштаб интерфейса (HUD Scale)», убрали сетевой джиттер и сделали мобильный интерфейс удобным для любых экранов.'
                    : 'We resolved HUD scale responsiveness, eliminated network jitter buffering, and introduced silky-smooth vertical touch scrolling on mobile.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <h4 className="font-orbitron font-bold text-xs text-sky-300 mb-1 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    {isRu ? 'Плавный HUD Scale' : 'Smooth HUD Scale'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Регулируйте масштаб от 65% до 125%. Все виджеты, радар, полоски HP и джойстики плавно подстраиваются под размер экрана без сдвигов.'
                      : 'Scale from 65% to 125%. All health bars, radar mini-map and virtual controls scale smoothly.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <h4 className="font-orbitron font-bold text-xs text-cyan-300 mb-1 flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5" />
                    {isRu ? 'Стабилизация Ping' : 'Ping Optimization'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Интервал пинга ускорен до 800мс, включен TCP Socket NoDelay на сервере, устранены задержки очередей пакетов.'
                      : 'Ping probe optimized to 800ms, TCP socket NoDelay active on server, eliminating packet queue bottlenecks.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <h4 className="font-orbitron font-bold text-xs text-emerald-300 mb-1 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    {isRu ? 'Тач-скролл на телефонах' : 'Mobile Touch Scroll'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRu
                      ? 'Главное меню и лобби получили вертикальный скролл. Все кнопки, карты, 14 модулей и кастомизация корабля легко доступны!'
                      : 'Main menu and lobby feature vertical touch scroll, giving instant access to all weapons, 14 modules, and maps on mobile.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-slate-400">
                  {isRu
                    ? 'Настройка во время боя: Нажмите иконку шестеренки возле радара в правом верхнем углу, чтобы изменить масштаб HUD прямо в игре! Для сетевой телеметрии нажмите F3.'
                    : 'In-combat tweak: Click the Settings gear next to the radar in the top-right corner to tweak HUD scale mid-match! For live net graph, press F3.'}
                </span>
                <span className="font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-[10px] sm:text-xs self-start sm:self-auto shrink-0">
                  F3 NET GRAPH
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: 9 NEW WEAPONS */}
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
                <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-500/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-orbitron font-bold text-xs text-rose-300 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-rose-400" />
                      {isRu ? 'Missile Launcher (Ракетница)' : 'Missile Launcher'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
                      HOMING / SPLASH
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-1.5">
                    {isRu
                      ? 'Запускает тяжелые самонаводящиеся ракеты с взрывным радиусом поражения (Splash Damage).'
                      : 'Launches lock-on guided missiles with area-of-effect splash radius.'}
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-1">
                    <span>{isRu ? 'Сила: Зональный урон' : 'Pro: Splash area'}</span>
                    <span>{isRu ? 'Слабость: Медленная скорость' : 'Con: Dodgeable by Dash'}</span>
                  </div>
                </div>

                {/* 4. Laser Beam */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-orbitron font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                      {isRu ? 'Laser Beam (Лазерный луч)' : 'Laser Beam'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      HITSCAN / INSTANT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-1.5">
                    {isRu
                      ? 'Мгновенное попадание (Hitscan) без времени полета снаряда. Ограниченная дистанция, блокируется стенами.'
                      : 'Instantaneous hitscan beam with 0 flight time. Medium range, stopped by obstacles.'}
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-1">
                    <span>{isRu ? 'Сила: Нельзя увернуться' : 'Pro: Instant hit'}</span>
                    <span>{isRu ? 'Слабость: Блокируется стенами' : 'Con: Wall blocked'}</span>
                  </div>
                </div>

                {/* 5. EMP Cannon */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-orbitron font-bold text-xs text-purple-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-400" />
                      {isRu ? 'EMP Cannon (ЭМИ пушка)' : 'EMP Cannon'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                      TACTICAL / DISRUPT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-1.5">
                    {isRu
                      ? 'Отключает вражескую регенерацию щита на 4 секунды, увеличивает кулдаун Dash и сбивает наведение.'
                      : 'Disables enemy shield regen for 4s, doubles Dash recharge time, disrupts guidance.'}
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-1">
                    <span>{isRu ? 'Сила: Отключение щита' : 'Pro: Debuff enemy'}</span>
                    <span>{isRu ? 'Слабость: Низкий урон' : 'Con: Lower damage'}</span>
                  </div>
                </div>

                {/* 6. Mine Launcher */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-yellow-500/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-orbitron font-bold text-xs text-yellow-300 flex items-center gap-1.5">
                      <Bomb className="w-3.5 h-3.5 text-yellow-400" />
                      {isRu ? 'Mine Launcher (Миноукладчик)' : 'Mine Launcher'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-yellow-500/10 text-yellow-300 border border-yellow-500/30">
                      TRAPS / CONTROL
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-1.5">
                    {isRu
                      ? 'Оставляет парящие мины с датчиками движения. Идеально для контроля узких проходов и защиты спавна.'
                      : 'Deploys hovering proximity mines. Exceptional for zone denial and choke point traps.'}
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-1">
                    <span>{isRu ? 'Сила: Контроль территории' : 'Pro: Area denial'}</span>
                    <span>{isRu ? 'Слабость: Не для дуэли в открытом поле' : 'Con: Static weapon'}</span>
                  </div>
                </div>

                {/* 7. Ricochet Cannon */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-pink-500/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-orbitron font-bold text-xs text-pink-300 flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-pink-400" />
                      {isRu ? 'Ricochet Cannon (Рикошет)' : 'Ricochet Cannon'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-pink-500/10 text-pink-300 border border-pink-500/30">
                      BOUNCE / ANGLES
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-1.5">
                    {isRu
                      ? 'Снаряды отскакивают от стен до 3 раз. Смертоносно в лабиринтах и комнатах с препятствиями!'
                      : 'Kinetic disks reflect off walls up to 3 times. Lethal in labyrinth corridors and CQB.'}
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-1">
                    <span>{isRu ? 'Сила: Стрельба из-за угла' : 'Pro: Bank shots'}</span>
                    <span>{isRu ? 'Слабость: Открытые пространства' : 'Con: Open arenas'}</span>
                  </div>
                </div>

                {/* 8. Charge Beam */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-orbitron font-bold text-xs text-amber-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      {isRu ? 'Charge Beam (Зарядный луч)' : 'Charge Beam'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      CHARGE / HEAVY LANCE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-1.5">
                    {isRu
                      ? 'Удерживайте ЛКМ для зарядки мега-луча. Чем дольше зарядка — тем дальше дальность и колоссальнее урон (до 140 HP).'
                      : 'Hold fire to charge a devastating particle lance. Longer charge = extreme range & 140+ damage.'}
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-1">
                    <span>{isRu ? 'Сила: Разрушительный урон' : 'Pro: Devastating poke'}</span>
                    <span>{isRu ? 'Слабость: Замедление при зарядке' : 'Con: Slow while charging'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MODIFIERS */}
          {activeTab === 'modifiers' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/40">
                <h3 className="font-orbitron font-bold text-xs sm:text-sm text-purple-300 mb-1 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  {isRu ? 'Все 14 Модификаторов Оружия (Билдостроение)' : 'All 14 Modular Weapon Modifiers (Builds)'}
                </h3>
                <p className="text-xs text-slate-300">
                  {isRu
                    ? 'Все модификаторы доступны прямо в лобби перед матчем и выпадают на арене в виде светящихся модулей. Совмещайте до 3 модулей для создания своего уникального билда!'
                    : 'All 14 modifiers are selectable directly in the Lobby room before the match and spawn as luminous pickups in the arena. Combine up to 3 mods!'}
                </p>
              </div>

              {/* 14 Modifiers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs max-h-[50vh] overflow-y-auto pr-1">
                {Object.values(MODIFIER_METAS).map((mod) => (
                  <div
                    key={mod.type}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1.5">
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
                  </div>
                ))}
              </div>

              {/* Recommended Build Synergies */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-cyan-500/30">
                <div className="text-[11px] font-orbitron font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isRu ? 'ТОПОВЫЕ СИНЕРГИИ МОДИФИКАТОРОВ' : 'TOP MODIFIER SYNERGIES'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-300 font-mono">
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-pink-400 font-bold">1. Shield Breaker + Armor Piercer:</span>
                    <span className="text-slate-400 block mt-0.5">
                      {isRu ? 'Мгновенно сносит щиты и сразу пробивает 40% урона в корпус.' : 'Shreds shields instantly and bypasses 40% direct to hull.'}
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-purple-400 font-bold">2. Gravity + Explosive:</span>
                    <span className="text-slate-400 block mt-0.5">
                      {isRu ? 'Затягивает корабли в точку взрыва для максимального сплеша.' : 'Draws enemies into the detonation epicenter for max blast.'}
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-cyan-400 font-bold">3. Rapid Fire + Freeze:</span>
                    <span className="text-slate-400 block mt-0.5">
                      {isRu ? 'Бесконечный стан-лок врагов постоянными замедляющими импульсами.' : 'Infinite movement lock with high-cadence cryogenic pulses.'}
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-amber-400 font-bold">4. Split + Chain:</span>
                    <span className="text-slate-400 block mt-0.5">
                      {isRu ? 'Осколки вызывают цепные молнии по всем вокруг.' : 'Split fragments trigger cascading chain electric arcs.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: COMBAT & MECHANICS */}
          {activeTab === 'combat' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                  <div className="flex items-center gap-2 mb-2 text-emerald-400 font-orbitron font-bold text-xs">
                    <Shield className="w-4 h-4" />
                    <span>{isRu ? 'Разделение: Корпус (Hull) и Щит (Shield)' : 'Hull vs Shield Dynamics'}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-2">
                    {isRu
                      ? 'У каждого корабля теперь 100 HP Корпуса + 100 HP Энергощита (всего 200 HP). Щит поглощает урон первым.'
                      : 'Every starship now boasts 100 Hull HP + 100 Energy Shield HP (200 HP total). Shields absorb damage first.'}
                  </p>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>• {isRu ? 'Задержка перезарядки: 3 секунды без получения урона' : 'Shield Regen Delay: 3s without receiving damage'}</li>
                    <li>• {isRu ? 'Скорость восстановления: +12 Shield/сек' : 'Regen Rate: +12 Shield/sec'}</li>
                    <li>• {isRu ? 'Корпус сам не регенерирует — собирайте аптечки!' : 'Hull never auto-repairs — grab Green Health orbs!'}</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30">
                  <div className="flex items-center gap-2 mb-2 text-amber-400 font-orbitron font-bold text-xs">
                    <Award className="w-4 h-4" />
                    <span>{isRu ? 'Механика Perfect Dash (Идеальный рывок)' : 'Perfect Dash Counter-Mechanic'}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-2">
                    {isRu
                      ? 'Нажмите рывок (Shift / Space) ровно в момент, когда снаряд врага подлетел в упор (< 46 px)!'
                      : 'Execute Turbo Dash (Shift / Space) right as a projectile reaches point-blank (< 46 px)!'}
                  </p>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>• {isRu ? 'Мгновенная золотая волна и неуязвимость' : 'Luminous golden shockwave & invulnerability'}</li>
                    <li>• {isRu ? '+30 бонусных очков на табло' : '+30 bonus leaderboard score points'}</li>
                    <li>• {isRu ? 'Мгновенный сброс кулдауна рывка для серии маневров' : 'Instantly refreshes Dash cooldown for combo chaining'}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="text-[11px] font-mono text-slate-400">
            <span>CYBERARENA • BETA 0.6: «ПРОБУЖДЕНИЕ ТИТАНА» (TITAN'S AWAKENING)</span>
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
