import { useState, useEffect, useCallback } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type OrientationType = 'portrait' | 'landscape';

export interface DeviceInfo {
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  orientation: OrientationType;
  isPortrait: boolean;
  isLandscape: boolean;
  width: number;
  height: number;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export function useDeviceOrientation() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => evaluateDevice());
  const [portraitDismissed, setPortraitDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('cyber_portrait_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  function evaluateDevice(): DeviceInfo {
    if (typeof window === 'undefined') {
      return {
        deviceType: 'desktop',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        orientation: 'landscape',
        isPortrait: false,
        isLandscape: true,
        width: 1920,
        height: 1080,
        safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = height > width;
    const orientation: OrientationType = isPortrait ? 'portrait' : 'landscape';

    const maxTouchPoints = navigator.maxTouchPoints || 0;
    const hasTouch = 'ontouchstart' in window || maxTouchPoints > 0;

    // Detect tablets (iPad, Galaxy Tab, Surface, etc.)
    // Tablets typically have touch and a shorter side >= 600px and longest side <= 1400px
    const minSide = Math.min(width, height);
    const maxSide = Math.max(width, height);
    const userAgent = navigator.userAgent.toLowerCase();
    const isTabletUA = /ipad|tablet|(android(?!.*mobile))/.test(userAgent);

    let deviceType: DeviceType = 'desktop';
    if (hasTouch) {
      if (isTabletUA || (minSide >= 600 && maxSide <= 1400 && maxTouchPoints > 1)) {
        deviceType = 'tablet';
      } else {
        deviceType = 'mobile';
      }
    } else {
      if (width < 768) {
        deviceType = 'mobile';
      } else if (width <= 1180) {
        deviceType = 'tablet';
      } else {
        deviceType = 'desktop';
      }
    }

    return {
      deviceType,
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop',
      isTouch: hasTouch,
      orientation,
      isPortrait,
      isLandscape: !isPortrait,
      width,
      height,
      safeAreaInsets: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    };
  }

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(evaluateDevice());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const dismissPortraitWarning = useCallback(() => {
    setPortraitDismissed(true);
    try {
      sessionStorage.setItem('cyber_portrait_dismissed', 'true');
    } catch {
      // ignore
    }
  }, []);

  return {
    ...deviceInfo,
    portraitDismissed,
    dismissPortraitWarning,
  };
}
