import { useEffect } from 'react';
import { setAxis, setThrottle } from './inputState';
import { applyDeadzone } from '../physics/mathUtils';
import { useStore } from '../state/store';

const DEADZONE = 0.12;

/**
 * Optional gamepad support (standard mapping). Left stick = roll/pitch, right
 * stick X = yaw, right trigger = throttle. Polled per frame; absent gamepads are
 * a no-op so this is always safe to mount.
 */
export function useGamepad(): void {
  const sensitivity = useStore((s) => s.settings.sensitivity);
  const invertPitch = useStore((s) => s.settings.invertPitch);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;

    let rafId = 0;
    let active = false;

    const poll = () => {
      const pads = navigator.getGamepads();
      const pad = Array.from(pads).find((p): p is Gamepad => p != null && p.connected);

      if (pad) {
        active = true;
        const axes = pad.axes;
        const roll = applyDeadzone(axes[0] ?? 0, DEADZONE);
        let pitch = applyDeadzone(axes[1] ?? 0, DEADZONE); // stick up = -1 = nose up
        const yaw = applyDeadzone(axes[2] ?? 0, DEADZONE);
        if (invertPitch) pitch = -pitch;

        setAxis('gamepad', 'roll', roll * sensitivity);
        // Stick up (negative) should pitch nose up (positive command).
        setAxis('gamepad', 'pitch', -pitch * sensitivity);
        setAxis('gamepad', 'yaw', yaw * sensitivity);

        // Right trigger (button 7) as throttle if present.
        const trigger = pad.buttons[7];
        if (trigger && trigger.value > 0.01) {
          setThrottle(trigger.value);
        }
      } else if (active) {
        // Gamepad disconnected — release its channel once.
        active = false;
        setAxis('gamepad', 'roll', 0);
        setAxis('gamepad', 'pitch', 0);
        setAxis('gamepad', 'yaw', 0);
      }

      rafId = requestAnimationFrame(poll);
    };

    rafId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafId);
  }, [sensitivity, invertPitch]);
}
