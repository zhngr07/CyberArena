import React, { useState, useEffect, useRef } from 'react';
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
  Eye,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Lock,
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
import { PlayerCosmetics, ShipModelType, HatType, AccessoryType, TrailType, TitleType } from '../types/game.ts';
import { Language, TRANSLATIONS } from '../data/translations.ts';
import { soundManager } from '../services/audio.ts';
import {
  drawProceduralShipHull,
  drawShipHats,
  drawShipAccessories,
  getTrailParticleStyle,
} from './renderShipCosmetics.ts';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onEquipCosmetics: (cosmetics: PlayerCosmetics) => void;
  playerColor?: string;
}

type ShopCategory = 'ship' | 'hat' | 'accessory' | 'trail' | 'title';

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  lang,
  onEquipCosmetics,
  playerColor = '#06b6d4',
}) => {
  const [activeTab, setActiveTab] = useState<ShopCategory>('ship');
  const [coins, setCoins] = useState<number>(getSavedCoins());
  const [unlockedIds, setUnlockedIds] = useState<string[]>(getUnlockedItemIds());
  const [equipped, setEquipped] = useState<PlayerCosmetics>(getEquippedCosmetics());
  const [previewCosmetics, setPreviewCosmetics] = useState<PlayerCosmetics>(getEquippedCosmetics());
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const t = TRANSLATIONS[lang];

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      const savedEq = getEquippedCosmetics();
      setCoins(getSavedCoins());
      setUnlockedIds(getUnlockedItemIds());
      setEquipped(savedEq);
      setPreviewCosmetics(savedEq);

      // Select first item in category as default selected
      const firstInCat = SHOP_ITEMS.find((i) => i.category === activeTab);
      if (firstInCat) {
        setSelectedItem(firstInCat);
      }
    }
  }, [isOpen, activeTab]);

  // Live Canvas Hangar Renderer
  useEffect(() => {
    if (!isOpen) return;

    let startTime = performance.now();

    const renderHangar = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const elapsed = (now - startTime) / 1000;
      const width = canvas.width;
      const height = canvas.height;

      // Clear with dark hangar grid
      ctx.clearRect(0, 0, width, height);

      // Grid background
      ctx.save();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Hangar landing pad circle
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = 64;

      const padGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius);
      padGrad.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
      padGrad.addColorStop(0.8, 'rgba(6, 182, 212, 0.05)');
      padGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = padGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Outer ring
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Smooth floating animation
      const floatY = Math.sin(elapsed * 2) * 5;
      const shipAngle = -Math.PI / 2; // Pointing forward/up

      // Render Ship
      ctx.save();
      ctx.translate(centerX, centerY + floatY);
      ctx.rotate(shipAngle);
      ctx.scale(1.35, 1.35);

      // Engine Thruster Glow Particles (based on previewed trail)
      const trailStyle = getTrailParticleStyle(previewCosmetics.trail);
      const thrusterColor = trailStyle.color || playerColor;

      ctx.save();
      ctx.fillStyle = thrusterColor;
      ctx.shadowColor = thrusterColor;
      ctx.shadowBlur = 12;
      const flameLength = 12 + Math.sin(elapsed * 15) * 4;
      ctx.beginPath();
      ctx.moveTo(-16, -4);
      ctx.lineTo(-16 - flameLength, 0);
      ctx.lineTo(-16, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Accessories (Wings/Drones)
      drawShipAccessories(
        ctx,
        previewCosmetics.accessory as AccessoryType,
        playerColor,
        false,
        now,
        true
      );

      // Procedural Ship Hull
      drawProceduralShipHull(
        ctx,
        (previewCosmetics.shipModel || 'phantom') as ShipModelType,
        playerColor,
        true
      );

      // Hats / Helmets / Horns
      drawShipHats(ctx, (previewCosmetics.hat || 'none') as HatType, true);

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(renderHangar);
    };

    animFrameRef.current = requestAnimationFrame(renderHangar);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, previewCosmetics, playerColor]);

  if (!isOpen) return null;

  // Handle previewing item on click
  const handleSelectItem = (item: ShopItem) => {
    setSelectedItem(item);
    soundManager.playShoot('plasma');

    // Live preview on ship
    const updated: PlayerCosmetics = { ...previewCosmetics };
    if (item.category === 'ship') updated.shipModel = item.value as ShipModelType;
    if (item.category === 'hat') updated.hat = item.value as HatType;
    if (item.category === 'accessory') updated.accessory = item.value as AccessoryType;
    if (item.category === 'trail') updated.trail = item.value as TrailType;
    if (item.category === 'title') updated.title = item.value as TitleType;

    setPreviewCosmetics(updated);
  };

  // Reset preview back to currently equipped
  const handleResetPreview = () => {
    soundManager.playPickup();
    setPreviewCosmetics({ ...equipped });
  };

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
    const updatedUnlocked = [...unlockedIds, item.id];
    setUnlockedIds(updatedUnlocked);
    soundManager.playBuy();

    setSuccessNotice(lang === 'ru' ? `Успешно куплено: ${item.nameRu}!` : `Unlocked: ${item.nameEn}!`);
    setTimeout(() => setSuccessNotice(null), 3000);

    // Equip right after purchase
    handleEquip(item);
  };

  const handleEquip = (item: ShopItem) => {
    soundManager.playPickup();
    const nextEquipped: PlayerCosmetics = { ...equipped };
    if (item.category === 'ship') nextEquipped.shipModel = item.value as ShipModelType;
    if (item.category === 'hat') nextEquipped.hat = item.value as HatType;
    if (item.category === 'accessory') nextEquipped.accessory = item.value as AccessoryType;
    if (item.category === 'trail') nextEquipped.trail = item.value as TrailType;
    if (item.category === 'title') nextEquipped.title = item.value as TitleType;

    setEquipped(nextEquipped);
    setPreviewCosmetics(nextEquipped);
    saveEquippedCosmetics(nextEquipped);
    onEquipCosmetics(nextEquipped);
  };

  const handleUnequip = (category: 'hat' | 'accessory') => {
    soundManager.playPickup();
    const nextEquipped: PlayerCosmetics = { ...equipped };
    if (category === 'hat') nextEquipped.hat = 'none';
    if (category === 'accessory') nextEquipped.accessory = 'none';

    setEquipped(nextEquipped);
    setPreviewCosmetics(nextEquipped);
    saveEquippedCosmetics(nextEquipped);
    onEquipCosmetics(nextEquipped);
  };

  const filteredItems = SHOP_ITEMS.filter((i) => i.category === activeTab);
  const currentPreviewDifferent =
    previewCosmetics.shipModel !== equipped.shipModel ||
    previewCosmetics.hat !== equipped.hat ||
    previewCosmetics.accessory !== equipped.accessory ||
    previewCosmetics.trail !== equipped.trail;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-slate-900 border border-cyan-500/50 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.35)] flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-cyan-950 via-slate-900 to-amber-950 border-b border-cyan-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <ShoppingBag className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-orbitron font-black text-base sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-cyan-300">
                  {lang === 'ru' ? 'КИБЕР-АНГАР & МАГАЗИН' : 'CYBER HANGAR & SHOP'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/50">
                  0.9 REMAKE
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                {lang === 'ru'
                  ? 'Интерактивная примерка корпусов, шлемов, обвесов и следов на ваш корабль'
                  : 'Interactive real-time preview of hulls, helmets, wings and trails on your ship'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Coins Balance Chip */}
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-amber-950/90 border border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <Coins className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="font-orbitron font-black text-amber-300 text-sm sm:text-base">
                {coins}
              </span>
              <span className="text-xs font-mono text-amber-400">🪙</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Banners */}
        {errorNotice && (
          <div className="p-2.5 bg-rose-500/20 border-b border-rose-500/40 text-rose-300 text-xs font-mono text-center shrink-0">
            ⚠️ {errorNotice}
          </div>
        )}
        {successNotice && (
          <div className="p-2.5 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 text-xs font-mono text-center shrink-0">
            ✓ {successNotice}
          </div>
        )}

        {/* Main Body - Split Layout */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          {/* Left Column: Interactive Live Ship Hangar & Selected Item Inspector */}
          <div className="w-full lg:w-80 xl:w-96 p-3 sm:p-4 bg-slate-950/80 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between shrink-0 overflow-y-auto">
            {/* Live Hangar Canvas Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-orbitron font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{lang === 'ru' ? 'ЖИВОЙ ПРЕДПРОСМОТР' : 'LIVE SHIP HANGAR'}</span>
                </span>
                {currentPreviewDifferent && (
                  <button
                    onClick={handleResetPreview}
                    className="text-[10px] font-mono text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{lang === 'ru' ? 'Сбросить' : 'Reset'}</span>
                  </button>
                )}
              </div>

              {/* Canvas viewport */}
              <div className="relative rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/40 p-1 shadow-[0_0_20px_rgba(6,182,212,0.15)] flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={240}
                  height={190}
                  className="rounded-xl w-full h-[180px] object-contain"
                />

                {/* Status indicator on canvas */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded-lg bg-slate-950/85 backdrop-blur-sm border border-slate-800 text-slate-300">
                  <span className="truncate">
                    🚀 {previewCosmetics.shipModel.toUpperCase()}
                  </span>
                  {previewCosmetics.hat !== 'none' && (
                    <span className="truncate text-amber-300">
                      👑 {previewCosmetics.hat}
                    </span>
                  )}
                  {previewCosmetics.accessory && previewCosmetics.accessory !== 'none' && (
                    <span className="truncate text-teal-300">
                      🪽 {previewCosmetics.accessory}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Item Detail Inspector Card */}
            {selectedItem ? (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex flex-col justify-between shadow-inner">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xl">{selectedItem.icon}</span>
                    <span
                      className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded border font-bold ${
                        selectedItem.rarity === 'legendary'
                          ? 'text-amber-400 border-amber-500/50 bg-amber-950/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                          : selectedItem.rarity === 'epic'
                          ? 'text-purple-400 border-purple-500/50 bg-purple-950/60 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                          : selectedItem.rarity === 'rare'
                          ? 'text-cyan-400 border-cyan-500/50 bg-cyan-950/60 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                          : 'text-slate-400 border-slate-700 bg-slate-900'
                      }`}
                    >
                      {selectedItem.rarity}
                    </span>
                  </div>

                  <h4 className="font-orbitron font-black text-sm text-white">
                    {lang === 'ru' ? selectedItem.nameRu : selectedItem.nameEn}
                  </h4>
                  <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed">
                    {lang === 'ru' ? selectedItem.descRu : selectedItem.descEn}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{lang === 'ru' ? 'Категория:' : 'Type:'}</span>
                    <span className="text-cyan-300 font-bold uppercase">{selectedItem.category}</span>
                  </div>
                </div>

                {/* Inspect Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center gap-2">
                  {(() => {
                    const isUnlocked = unlockedIds.includes(selectedItem.id) || selectedItem.price === 0;
                    const isEquipped =
                      (selectedItem.category === 'ship' && equipped.shipModel === selectedItem.value) ||
                      (selectedItem.category === 'hat' && equipped.hat === selectedItem.value) ||
                      (selectedItem.category === 'accessory' && (equipped.accessory || 'none') === selectedItem.value) ||
                      (selectedItem.category === 'trail' && equipped.trail === selectedItem.value) ||
                      (selectedItem.category === 'title' && equipped.title === selectedItem.value);

                    if (isEquipped) {
                      return (
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex-1 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 font-orbitron font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm">
                            <Check className="w-4 h-4 text-cyan-400" />
                            <span>{lang === 'ru' ? 'НАДЕТО НА КОРАБЛЬ' : 'CURRENTLY EQUIPPED'}</span>
                          </div>
                          {(selectedItem.category === 'hat' || selectedItem.category === 'accessory') && (
                            <button
                              onClick={() => handleUnequip(selectedItem.category as 'hat' | 'accessory')}
                              className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-orbitron text-xs font-bold cursor-pointer transition-colors"
                              title={lang === 'ru' ? 'Снять предмет' : 'Unequip'}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    }

                    if (isUnlocked) {
                      return (
                        <button
                          onClick={() => handleEquip(selectedItem)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-orbitron font-black text-xs tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{lang === 'ru' ? 'НАДЕТЬ НА КОРАБЛЬ' : 'EQUIP ITEM'}</span>
                        </button>
                      );
                    }

                    const canAfford = coins >= selectedItem.price;

                    return (
                      <button
                        onClick={() => handleBuy(selectedItem)}
                        disabled={!canAfford}
                        className={`w-full py-2.5 rounded-xl font-orbitron font-black text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                        }`}
                      >
                        {canAfford ? (
                          <>
                            <Coins className="w-4 h-4 text-slate-950" />
                            <span>
                              {lang === 'ru' ? 'КУПИТЬ ЗА' : 'BUY FOR'} {selectedItem.price} 🪙
                            </span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>
                              {lang === 'ru' ? 'НУЖНО' : 'REQUIRES'} {selectedItem.price} 🪙 ({lang === 'ru' ? 'НЕ ХВАТАЕТ' : 'SHORT'} {selectedItem.price - coins})
                            </span>
                          </>
                        )}
                      </button>
                    );
                  })()}
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Column: Catalog Categories & Items Grid */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-900/50">
            {/* Category Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2.5 gap-2 overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveTab('ship')}
                className={`px-4 py-2.5 text-xs font-orbitron font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'ship'
                    ? 'bg-slate-900 border-t-2 border-x border-cyan-400 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🚀</span>
                <span>{t.tabShips} (25)</span>
              </button>
              <button
                onClick={() => setActiveTab('hat')}
                className={`px-4 py-2.5 text-xs font-orbitron font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'hat'
                    ? 'bg-slate-900 border-t-2 border-x border-amber-400 text-amber-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>👑</span>
                <span>{t.tabHats}</span>
              </button>
              <button
                onClick={() => setActiveTab('accessory')}
                className={`px-4 py-2.5 text-xs font-orbitron font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'accessory'
                    ? 'bg-slate-900 border-t-2 border-x border-teal-400 text-teal-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🪽</span>
                <span>{t.tabAccessories || 'ОБВЕСЫ'}</span>
              </button>
              <button
                onClick={() => setActiveTab('trail')}
                className={`px-4 py-2.5 text-xs font-orbitron font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'trail'
                    ? 'bg-slate-900 border-t-2 border-x border-pink-400 text-pink-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>✨</span>
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
                <span>🏷️</span>
                <span>{t.tabTitles}</span>
              </button>
            </div>

            {/* Catalog Items Grid */}
            <div className="p-3 sm:p-5 overflow-y-auto flex-1 touch-pan-y">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredItems.map((item) => {
                  const isUnlocked = unlockedIds.includes(item.id) || item.price === 0;
                  const isEquipped =
                    (item.category === 'ship' && equipped.shipModel === item.value) ||
                    (item.category === 'hat' && equipped.hat === item.value) ||
                    (item.category === 'accessory' && (equipped.accessory || 'none') === item.value) ||
                    (item.category === 'trail' && equipped.trail === item.value) ||
                    (item.category === 'title' && equipped.title === item.value);
                  const isSelected = selectedItem?.id === item.id;

                  const name = lang === 'ru' ? item.nameRu : item.nameEn;
                  const desc = lang === 'ru' ? item.descRu : item.descEn;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative ${
                        isSelected
                          ? 'ring-2 ring-cyan-400 bg-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                          : isEquipped
                          ? 'bg-cyan-950/40 border-cyan-500/50 hover:border-cyan-400'
                          : isUnlocked
                          ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/40 border-slate-800/80 hover:border-amber-500/40'
                      }`}
                    >
                      <div>
                        {/* Header: Icon, Name & Rarity Badge */}
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

                        <h4 className="font-orbitron font-bold text-xs sm:text-sm text-slate-100 flex items-center justify-between">
                          <span>{name}</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 font-sans mt-1 line-clamp-2">
                          {desc}
                        </p>
                      </div>

                      {/* Status / Price Footer */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                        <div>
                          {item.price > 0 && !isUnlocked ? (
                            <div className="flex items-center space-x-1 font-orbitron font-bold text-amber-300 text-xs">
                              <span>{item.price}</span>
                              <span>🪙</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono text-emerald-400">
                              {lang === 'ru' ? 'В ангаре' : 'Owned'}
                            </span>
                          )}
                        </div>

                        {isEquipped ? (
                          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-orbitron font-bold text-[11px] flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {t.btnEquipped}
                          </span>
                        ) : isUnlocked ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEquip(item);
                            }}
                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 border border-slate-700 text-slate-200 font-orbitron font-bold text-[11px] transition-all cursor-pointer"
                          >
                            {t.btnEquip}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuy(item);
                            }}
                            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-orbitron font-black text-[11px] transition-all shadow-[0_0_10px_rgba(245,158,11,0.3)] cursor-pointer"
                          >
                            {t.btnBuy}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer tip */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400 px-5 shrink-0">
          <div className="flex items-center gap-1.5 text-amber-300/90">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.earnedCoinsTip}</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-orbitron text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm"
          >
            {lang === 'ru' ? 'ЗАКРЫТЬ' : 'CLOSE'}
          </button>
        </div>
      </div>
    </div>
  );
};
