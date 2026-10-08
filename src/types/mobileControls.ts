export interface MobileControlSettings {
  joystickSize: 'small' | 'medium' | 'large';
  buttonSize: 'small' | 'medium' | 'large';
  layoutPreset: 'standard' | 'compact' | 'spaced' | 'left_handed';
  opacity: number; // 0.3 - 1.0
  moveSensitivity: number; // 0.5 - 2.0
  aimSensitivity: number; // 0.5 - 2.0
  autoFire: boolean;
  vibration: boolean;
  aimAssist: 'off' | 'low' | 'medium';
  graphicsQuality: 'low' | 'medium' | 'high';
}

export const DEFAULT_MOBILE_SETTINGS: MobileControlSettings = {
  joystickSize: 'medium',
  buttonSize: 'medium',
  layoutPreset: 'standard',
  opacity: 0.75,
  moveSensitivity: 1.0,
  aimSensitivity: 1.0,
  autoFire: true,
  vibration: true,
  aimAssist: 'low',
  graphicsQuality: 'medium',
};

const STORAGE_KEY = 'cyber_mobile_control_settings';

export function loadMobileSettings(): MobileControlSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_MOBILE_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_MOBILE_SETTINGS,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_MOBILE_SETTINGS };
  }
}

export function saveMobileSettings(settings: MobileControlSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

// Mobile Haptic Feedback helper
export function triggerHaptic(type: 'shoot' | 'hit' | 'dash' | 'kill' | 'button', enabled = true): void {
  if (!enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    switch (type) {
      case 'shoot':
        navigator.vibrate(8);
        break;
      case 'button':
        navigator.vibrate(12);
        break;
      case 'dash':
        navigator.vibrate([15, 20, 25]);
        break;
      case 'hit':
        navigator.vibrate([25, 30, 20]);
        break;
      case 'kill':
        navigator.vibrate([40, 30, 40, 30, 60]);
        break;
    }
  } catch {
    // ignore if vibration is restricted
  }
}
