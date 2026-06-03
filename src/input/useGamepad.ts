import { useEffect } from 'react';
import { setAxis, setThrottle } from './inputState';
import { applyDeadzone } from '../physics/mathUtils';

const DEADZONE = 0.12;

/**
 * Optional gamepad support (standard mapping). Left stick = roll/pitch, right
 * stick X = yaw, right trigger = throttle. Polled per frame; absent gamepads are
 * a no-op so this is always safe to mount. Raw axes are emitted here; sensitivity
 * and pitch inversion are applied centrally in readControlInput.
 */
export function useGamepad(): void {
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
        const stickY = applyDeadzone(axes[1] ?? 0, DEADZONE); // stick up = -1
        const yaw = applyDeadzone(axes[2] ?? 0, DEADZONE);

        setAxis('gamepad', 'roll', roll);
        // Stick up (negative) should pitch nose up (positive command).
        setAxis('gamepad', 'pitch', -stickY);
        setAxis('gamepad', 'yaw', yaw);

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
  }, []);
}
