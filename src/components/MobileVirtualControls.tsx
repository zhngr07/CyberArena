import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Zap, Crosshair, Target, Shield, Layers } from 'lucide-react';
import { MobileControlSettings, triggerHaptic } from '../types/mobileControls.ts';
import { WeaponType } from '../types/game.ts';

interface MobileVirtualControlsProps {
  settings: MobileControlSettings;
  dashCooldown: number; // in milliseconds
  activeWeapon: WeaponType;
  uiScale?: number;
  onMoveInput: (vector: { x: number; y: number }) => void;
  onAimInput: (angle: number | null, isShooting: boolean) => void;
  onFireChange: (isShooting: boolean) => void;
  onDash: () => void;
  onSecondaryAbility?: () => void;
}

export const MobileVirtualControls: React.FC<MobileVirtualControlsProps> = ({
  settings,
  dashCooldown,
  activeWeapon,
  uiScale = 1.0,
  onMoveInput,
  onAimInput,
  onFireChange,
  onDash,
  onSecondaryAbility,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Joystick visual dimensions based on settings
  const joystickRadius = settings.joystickSize === 'small' ? 45 : settings.joystickSize === 'large' ? 75 : 60;
  const knobRadius = settings.joystickSize === 'small' ? 22 : settings.joystickSize === 'large' ? 36 : 28;

  const buttonDimension = settings.buttonSize === 'small' ? 'w-14 h-14' : settings.buttonSize === 'large' ? 'w-20 h-20' : 'w-16 h-16';
  const fireDimension = settings.buttonSize === 'small' ? 'w-16 h-16' : settings.buttonSize === 'large' ? 'w-24 h-24' : 'w-20 h-20';

  // Left (Movement) Joystick State
  const [moveActive, setMoveActive] = useState(false);
  const [moveBase, setMoveBase] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [moveKnob, setMoveKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const moveTouchId = useRef<number | null>(null);

  // Right (Aim) Joystick State
  const [aimActive, setAimActive] = useState(false);
  const [aimBase, setAimBase] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [aimKnob, setAimKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const aimTouchId = useRef<number | null>(null);

  // Direct Button States
  const [isFiringButton, setIsFiringButton] = useState(false);
  const fireTouchId = useRef<number | null>(null);

  const isLeftHanded = settings.layoutPreset === 'left_handed';

  // Dash cooldown ratio (0 when ready, 1 when full cooldown)
  const isDashReady = dashCooldown <= 0;
  const dashCooldownSec = (dashCooldown / 1000).toFixed(1);

  // Cleanup on unmount or blur
  useEffect(() => {
    const handleGlobalBlur = () => {
      moveTouchId.current = null;
      aimTouchId.current = null;
      fireTouchId.current = null;
      setMoveActive(false);
      setAimActive(false);
      setIsFiringButton(false);
      onMoveInput({ x: 0, y: 0 });
      onAimInput(null, false);
      onFireChange(false);
    };

    window.addEventListener('blur', handleGlobalBlur);
    return () => window.removeEventListener('blur', handleGlobalBlur);
  }, [onMoveInput, onAimInput, onFireChange]);

  // Touch event handlers for the left and right touch zones
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenMidX = rect.left + rect.width / 2;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const clientX = touch.clientX;
      const clientY = touch.clientY;

      const isTouchOnLeftHalf = clientX < screenMidX;
      // In left-handed mode: movement is on right half, aim/fire is on left half
      const isMoveZone = isLeftHanded ? !isTouchOnLeftHalf : isTouchOnLeftHalf;

      // Check if touch is on movement zone and not already tracking
      if (isMoveZone && moveTouchId.current === null) {
        moveTouchId.current = touch.identifier;
        setMoveBase({ x: clientX, y: clientY });
        setMoveKnob({ x: clientX, y: clientY });
        setMoveActive(true);
      }
      // Check if touch is on aim zone and not already tracking
      else if (!isMoveZone && aimTouchId.current === null) {
        // Only claim as aim joystick if not tapping directly into buttons area
        aimTouchId.current = touch.identifier;
        setAimBase({ x: clientX, y: clientY });
        setAimKnob({ x: clientX, y: clientY });
        setAimActive(true);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];

      // Handle Move Joystick
      if (touch.identifier === moveTouchId.current) {
        const dx = (touch.clientX - moveBase.x) * settings.moveSensitivity;
        const dy = (touch.clientY - moveBase.y) * settings.moveSensitivity;
        const dist = Math.hypot(dx, dy);

        let knobX = moveBase.x + dx;
        let knobY = moveBase.y + dy;

        if (dist > joystickRadius) {
          knobX = moveBase.x + (dx / dist) * joystickRadius;
          knobY = moveBase.y + (dy / dist) * joystickRadius;
        }

        setMoveKnob({ x: knobX, y: knobY });

        // Deadzone threshold (6px)
        if (dist > 6) {
          const clampedMag = Math.min(1, dist / joystickRadius);
          const normX = (dx / dist) * clampedMag;
          const normY = (dy / dist) * clampedMag;
          onMoveInput({ x: normX, y: normY });
        } else {
          onMoveInput({ x: 0, y: 0 });
        }
      }

      // Handle Aim Joystick
      if (touch.identifier === aimTouchId.current) {
        const dx = (touch.clientX - aimBase.x) * settings.aimSensitivity;
        const dy = (touch.clientY - aimBase.y) * settings.aimSensitivity;
        const dist = Math.hypot(dx, dy);

        let knobX = aimBase.x + dx;
        let knobY = aimBase.y + dy;

        if (dist > joystickRadius) {
          knobX = aimBase.x + (dx / dist) * joystickRadius;
          knobY = aimBase.y + (dy / dist) * joystickRadius;
        }

        setAimKnob({ x: knobX, y: knobY });

        if (dist > 8) {
          const angle = Math.atan2(dy, dx);
          // If autoFire is enabled: pulling joystick past 35% radius triggers auto-shooting!
          const isAutoShooting = settings.autoFire && dist >= joystickRadius * 0.35;
          onAimInput(angle, isAutoShooting || isFiringButton);
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];

      if (touch.identifier === moveTouchId.current) {
        moveTouchId.current = null;
        setMoveActive(false);
        onMoveInput({ x: 0, y: 0 });
      }

      if (touch.identifier === aimTouchId.current) {
        aimTouchId.current = null;
        setAimActive(false);
        onAimInput(null, isFiringButton);
      }

      if (touch.identifier === fireTouchId.current) {
        fireTouchId.current = null;
        setIsFiringButton(false);
        onFireChange(false);
      }
    }
  };

  // Direct Button Handlers with Haptic Feedback
  const handleFireTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.changedTouches[0];
    if (touch && fireTouchId.current === null) {
      fireTouchId.current = touch.identifier;
      setIsFiringButton(true);
      onFireChange(true);
      triggerHaptic('shoot', settings.vibration);
    }
  };

  const handleFireTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    fireTouchId.current = null;
    setIsFiringButton(false);
    onFireChange(false);
  };

  const handleDashTouch = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (!isDashReady) return;
    triggerHaptic('dash', settings.vibration);
    onDash();
  };

  const handleSecondaryTouch = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('button', settings.vibration);
    if (onSecondaryAbility) {
      onSecondaryAbility();
    }
  };

  // Layout preset positioning adjustments
  const isCompact = settings.layoutPreset === 'compact';
  const isSpaced = settings.layoutPreset === 'spaced';

  const bottomOffsetClass = isCompact ? 'bottom-2' : isSpaced ? 'bottom-8' : 'bottom-4';
  const sideOffsetClass = isCompact ? 'px-2' : isSpaced ? 'px-8' : 'px-4';

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-30 select-none gameplay-touch-area overflow-hidden pointer-events-auto"
      style={{ opacity: settings.opacity }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Floating or dynamic movement joystick indicator */}
      {moveActive && (
        <div
          className="absolute rounded-full border-2 border-cyan-400/50 bg-cyan-950/40 backdrop-blur-xs flex items-center justify-center pointer-events-none shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          style={{
            width: joystickRadius * 2,
            height: joystickRadius * 2,
            left: moveBase.x - joystickRadius,
            top: moveBase.y - joystickRadius,
          }}
        >
          {/* Inner deadzone ring */}
          <div className="w-6 h-6 rounded-full border border-cyan-500/20" />
          {/* Knob */}
          <div
            className="absolute rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 border-2 border-white shadow-[0_0_15px_rgba(6,182,212,0.8)] pointer-events-none transition-transform duration-75"
            style={{
              width: knobRadius * 2,
              height: knobRadius * 2,
              left: moveKnob.x - moveBase.x + joystickRadius - knobRadius,
              top: moveKnob.y - moveBase.y + joystickRadius - knobRadius,
            }}
          />
        </div>
      )}

      {/* Floating or dynamic aim joystick indicator */}
      {aimActive && (
        <div
          className="absolute rounded-full border-2 border-pink-400/50 bg-pink-950/40 backdrop-blur-xs flex items-center justify-center pointer-events-none shadow-[0_0_20px_rgba(236,72,153,0.3)]"
          style={{
            width: joystickRadius * 2,
            height: joystickRadius * 2,
            left: aimBase.x - joystickRadius,
            top: aimBase.y - joystickRadius,
          }}
        >
          {/* Target reticle inside aim ring */}
          <Crosshair className="w-8 h-8 text-pink-400/30" />
          {/* Knob */}
          <div
            className="absolute rounded-full bg-gradient-to-br from-pink-400 to-rose-600 border-2 border-white shadow-[0_0_15px_rgba(236,72,153,0.8)] pointer-events-none transition-transform duration-75"
            style={{
              width: knobRadius * 2,
              height: knobRadius * 2,
              left: aimKnob.x - aimBase.x + joystickRadius - knobRadius,
              top: aimKnob.y - aimBase.y + joystickRadius - knobRadius,
            }}
          />
        </div>
      )}

      {/* Static Default Joystick Guides (Visual cues for where to place thumbs when idle) */}
      {!moveActive && (
        <div
          className={`absolute ${bottomOffsetClass} ${isLeftHanded ? 'right-6' : 'left-6'} pointer-events-none flex flex-col items-center justify-center opacity-40`}
        >
          <div
            className="rounded-full border-2 border-dashed border-cyan-400/40 flex items-center justify-center bg-cyan-950/20"
            style={{ width: joystickRadius * 1.8, height: joystickRadius * 1.8 }}
          >
            <div className="w-8 h-8 rounded-full bg-cyan-400/30 border border-cyan-400/60" />
          </div>
          <span className="text-[9px] font-orbitron uppercase text-cyan-300 font-bold mt-1 tracking-wider">
            MOVE
          </span>
        </div>
      )}

      {/* Action Buttons Cluster (Fire, Dash, Ability) */}
      <div
        className={`absolute ${bottomOffsetClass} ${sideOffsetClass} ${
          isLeftHanded ? 'left-2' : 'right-2'
        } pointer-events-auto flex items-end gap-2.5 pb-safe pr-safe pl-safe`}
        style={{
          transform: `scale(${uiScale})`,
          transformOrigin: isLeftHanded ? 'bottom left' : 'bottom right',
        }}
      >
        {/* Secondary Ability / Switch Weapon Button */}
        {onSecondaryAbility && (
          <button
            onTouchStart={handleSecondaryTouch}
            onClick={handleSecondaryTouch}
            className={`${buttonDimension} rounded-full bg-slate-900/80 border-2 border-cyan-400/60 active:bg-cyan-500/40 active:scale-95 text-cyan-300 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer`}
            title="Cycle Weapon / Ability"
          >
            <Layers className="w-4 h-4" />
            <span className="text-[8px] font-orbitron font-bold uppercase mt-0.5">CYCLE</span>
          </button>
        )}

        {/* Turbo Dash Button */}
        <button
          onTouchStart={handleDashTouch}
          onClick={handleDashTouch}
          disabled={!isDashReady}
          className={`${buttonDimension} relative rounded-full flex flex-col items-center justify-center border-2 shadow-2xl transition-all active:scale-90 cursor-pointer overflow-hidden ${
            isDashReady
              ? 'bg-gradient-to-br from-pink-600 to-rose-700 border-pink-300 text-white shadow-[0_0_22px_rgba(236,72,153,0.7)] animate-pulse'
              : 'bg-slate-950/90 border-slate-700 text-slate-500'
          }`}
          title="Turbo Dash"
        >
          <Zap className="w-5 h-5" />
          <span className="text-[9px] font-orbitron font-black tracking-wider">
            {isDashReady ? 'DASH' : `${dashCooldownSec}s`}
          </span>
          {/* Radial progress / overlay for cooldown */}
          {!isDashReady && (
            <div
              className="absolute inset-0 bg-black/60 pointer-events-none"
              style={{
                clipPath: `inset(0 0 ${Math.min(100, (dashCooldown / 1200) * 100)}% 0)`,
              }}
            />
          )}
        </button>

        {/* Primary Fire Button (Hold or Tap to shoot) */}
        <button
          onTouchStart={handleFireTouchStart}
          onTouchEnd={handleFireTouchEnd}
          onTouchCancel={handleFireTouchEnd}
          className={`${fireDimension} rounded-full flex flex-col items-center justify-center border-3 transition-transform active:scale-95 cursor-pointer shadow-2xl select-none ${
            isFiringButton
              ? 'bg-gradient-to-br from-cyan-400 to-blue-600 border-white text-slate-950 scale-95 shadow-[0_0_30px_rgba(6,182,212,1)]'
              : 'bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.4)] backdrop-blur-sm'
          }`}
          title="Fire Weapon"
        >
          <Target className={`w-7 h-7 ${isFiringButton ? 'text-slate-950 animate-spin' : 'text-cyan-300'}`} />
          <span className={`text-[10px] font-orbitron font-black tracking-widest mt-0.5 ${isFiringButton ? 'text-slate-950' : 'text-cyan-300'}`}>
            FIRE
          </span>
        </button>
      </div>
    </div>
  );
};
