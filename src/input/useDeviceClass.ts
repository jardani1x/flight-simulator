import { useEffect, useState } from 'react';
import type { DeviceClass } from '../core/types';
import { useStore } from '../state/store';

/** Classify the device by viewport size and pointer/touch capability. */
function detectDeviceClass(): DeviceClass {
  if (typeof window === 'undefined') return 'desktop';
  const coarse =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  const minSide = Math.min(window.innerWidth, window.innerHeight);
  const maxSide = Math.max(window.innerWidth, window.innerHeight);

  if (!coarse) return 'desktop';
  // Touch device: distinguish phone from tablet by its largest dimension.
  if (maxSide >= 900 || minSide >= 600) return 'tablet';
  return 'phone';
}

interface DeviceInfo {
  deviceClass: DeviceClass;
  isTouch: boolean;
  isPortrait: boolean;
}

/** Reactively track device class and orientation, syncing into the store. */
export function useDeviceClass(): DeviceInfo {
  const setDeviceClass = useStore((s) => s.setDeviceClass);
  const [info, setInfo] = useState<DeviceInfo>(() => {
    const deviceClass = detectDeviceClass();
    const isPortrait =
      typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false;
    return { deviceClass, isTouch: deviceClass !== 'desktop', isPortrait };
  });

  useEffect(() => {
    const update = () => {
      const deviceClass = detectDeviceClass();
      const isPortrait = window.innerHeight > window.innerWidth;
      setInfo({ deviceClass, isTouch: deviceClass !== 'desktop', isPortrait });
      setDeviceClass(deviceClass);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [setDeviceClass]);

  return info;
}
