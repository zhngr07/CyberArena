import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Coins,
  Check,
  Sparkles,
  Shield,
  Zap,
  Award,
  Crown,
} from 'lucide-react';
import {
  ShopItem,
  SHOP_ITEMS,
  getSavedCoins,
  getUnlockedItemIds,
  unlockItemId,
  saveCoins,
  getEquippedCosmetics,
  saveEquippedCosmetics,
} from '../data/shopItems.ts';
import { PlayerCosmetics } from '../types/game.ts';
import { Language, TRANSLATIONS } from '../data/translations.ts';
import { soundManager } from '../services/audio.ts';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onEquipCosmetics: (cosmetics: PlayerCosmetics) => void;
}

type ShopCategory = 'ship' | 'hat' | 'trail' | 'title';

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  lang,
  onEquipCosmetics,
}) => {
  const [activeTab, setActiveTab] = useState<ShopCategory>('ship');
  const [coins, setCoins] = useState<number>(getSavedCoins());
  const [unlockedIds, setUnlockedIds] = useState<string[]>(getUnlockedItemIds());
  const [equipped, setEquipped] = useState<PlayerCosmetics>(getEquippedCosmetics());
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const handleBuy = (item: ShopItem) => {
    if (coins < item.price) {
      soundManager.playHit();
      setErrorNotice(t.notEnoughCoins);
      setTimeout(() => setErrorNotice(null), 3000);
      return;
    }

    const nextCoins = coins - item.price;
    saveCoins(nextCoins);
    setCoins(nextCoins);
    unlockItemId(item.id);
    setUnlockedIds([...unlockedIds, item.id]);
    soundManager.playBuy();

    // Automatically equip after buy
    handleEquip(item);
  };

  const handleEquip = (item: ShopItem) => {
    soundManager.playPickup();
    const nextEquipped: PlayerCosmetics = { ...equipped };
    if (item.category === 'ship') nextEquipped.shipModel = item.value as any;
    if (item.category === 'hat') nextEquipped.hat = item.value as any;
    if (item.category === 'trail') nextEquipped.trail = item.value as any;
    if (item.category === 'title') nextEquipped.title = item.value as any;

    setEquipped(nextEquipped);
    saveEquippedCosmetics(nextEquipped);
    onEquipCosmetics(nextEquipped);
  };

  const filteredItems = SHOP_ITEMS.filter((i) => i.category === activeTab);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="w-full max-w-3xl bg-slate-900 border border-cyan-500/40 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.3)] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-cyan-950/90 via-slate-900 to-pink-950/90 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <ShoppingBag className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-orbitron font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-cyan-300">
                {t.shopTitle}
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                {t.shopSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Coins Balance Chip */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              <Coins className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="font-orbitron font-black text-amber-300 text-sm">
                {coins}
              </span>
              <span className="text-[10px] font-mono text-amber-400/80">🪙</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error notification */}
        {errorNotice && (
          <div className="p-2.5 bg-rose-500/20 border-b border-rose-500/40 text-rose-300 text-xs font-mono text-center">
            {errorNotice}
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ship')}
            className={`px-4 py-2.5 text-xs font-orbitron font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'ship'
                ? 'bg-slate-900 border-t-2 border-x border-cyan-400 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{t.tabShips}</span>
          </button>
          <button
            onClick={() => setActiveTab('hat')}
            className={`px-4 py-2.5 text-xs font-orbitron font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'hat'
                ? 'bg-slate-900 border-t-2 border-x border-amber-400 text-amber-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{t.tabHats}</span>
          </button>
          <button
            onClick={() => setActiveTab('trail')}
            className={`px-4 py-2.5 text-xs font-orbitron font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'trail'
                ? 'bg-slate-900 border-t-2 border-x border-pink-400 text-pink-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{t.tabTrails}</span>
          </button>
          <button
            onClick={() => setActiveTab('title')}
            className={`px-4 py-2.5 text-xs font-orbitron font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'title'
                ? 'bg-slate-900 border-t-2 border-x border-purple-400 text-purple-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{t.tabTitles}</span>
          </button>
        </div>

        {/* Items Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredItems.map((item) => {
              const isUnlocked = unlockedIds.includes(item.id) || item.price === 0;
              const isEquipped =
                (item.category === 'ship' && equipped.shipModel === item.value) ||
                (item.category === 'hat' && equipped.hat === item.value) ||
                (item.category === 'trail' && equipped.trail === item.value) ||
                (item.category === 'title' && equipped.title === item.value);

              const name = lang === 'ru' ? item.nameRu : item.nameEn;
              const desc = lang === 'ru' ? item.descRu : item.descEn;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isEquipped
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : isUnlocked
                      ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-amber-500/40'
                  }`}
                >
                  <div>
                    {/* Icon and Rarity */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{item.icon}</span>
                      <span
                        className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded border ${
                          item.rarity === 'legendary'
                            ? 'text-amber-400 border-amber-500/40 bg-amber-950/50'
                            : item.rarity === 'epic'
                            ? 'text-purple-400 border-purple-500/40 bg-purple-950/50'
                            : item.rarity === 'rare'
                            ? 'text-cyan-400 border-cyan-500/40 bg-cyan-950/50'
                            : 'text-slate-400 border-slate-700 bg-slate-900/50'
                        }`}
                      >
                        {item.rarity}
                      </span>
                    </div>

                    <h4 className="font-orbitron font-bold text-sm text-slate-100">
                      {name}
                    </h4>
                    <p className="text-xs text-slate-400 font-sans mt-1 line-clamp-2">
                      {desc}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      {item.price > 0 && !isUnlocked ? (
                        <div className="flex items-center space-x-1 font-orbitron font-bold text-amber-300 text-xs">
                          <span>{item.price}</span>
                          <span>🪙</span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-emerald-400">
                          {lang === 'ru' ? 'В коллекции' : 'Unlocked'}
                        </span>
                      )}
                    </div>

                    {isEquipped ? (
                      <span className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-orbitron font-bold text-xs flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        {t.btnEquipped}
                      </span>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => handleEquip(item)}
                        className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 border border-slate-700 text-slate-200 font-orbitron font-bold text-xs transition-all cursor-pointer"
                      >
                        {t.btnEquip}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuy(item)}
                        className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-orbitron font-black text-xs transition-all shadow-[0_0_10px_rgba(245,158,11,0.3)] cursor-pointer"
                      >
                        {t.btnBuy} {item.price} 🪙
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer tip */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400 px-5">
          <div className="flex items-center gap-1.5 text-amber-300/90">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.earnedCoinsTip}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-orbitron text-xs font-bold rounded-lg cursor-pointer"
          >
            {lang === 'ru' ? 'ЗАКРЫТЬ' : 'CLOSE'}
          </button>
        </div>
      </div>
    </div>
  );
};
