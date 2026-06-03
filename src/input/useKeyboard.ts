import { useEffect } from 'react';
import { KEYS } from './keymap';
import { nudgeThrottle, setAxis, setThrottle } from './inputState';
import { THROTTLE_RATE } from '../config/constants';
import { useStore } from '../state/store';

interface DiscreteHandlers {
  onReset: () => void;
}

// Sensitivity and pitch inversion are applied centrally in readControlInput, so
// this hook only emits raw, normalised axis values from the held-key set.

const isAny = (code: string, list: readonly string[]): boolean => list.includes(code);

/**
 * Subscribes to keyboard events and translates them into shared input-state
 * writes. Continuous axes are recomputed every animation frame from the held-key
 * set; discrete actions (pause/reset/help) fire on keydown.
 *
 * Crucially, this hook does NOT call setState on key changes, so holding a
 * control surface never triggers a React re-render.
 */
export function useKeyboard(handlers: DiscreteHandlers): void {
  useEffect(() => {
    const held = new Set<string>();
    let rafId = 0;
    let lastTime = performance.now();

    const updateAxes = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      let pitch = 0;
      let roll = 0;
      let yaw = 0;

      for (const code of held) {
        if (isAny(code, KEYS.pitchUp)) pitch += 1;
        if (isAny(code, KEYS.pitchDown)) pitch -= 1;
        if (isAny(code, KEYS.rollLeft)) roll -= 1;
        if (isAny(code, KEYS.rollRight)) roll += 1;
        if (isAny(code, KEYS.yawLeft)) yaw -= 1;
        if (isAny(code, KEYS.yawRight)) yaw += 1;
        if (isAny(code, KEYS.throttleUp)) nudgeThrottle(THROTTLE_RATE * dt);
        if (isAny(code, KEYS.throttleDown)) nudgeThrottle(-THROTTLE_RATE * dt);
      }

      setAxis('keyboard', 'pitch', pitch);
      setAxis('keyboard', 'roll', roll);
      setAxis('keyboard', 'yaw', yaw);

      rafId = requestAnimationFrame(updateAxes);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore typing into form fields (settings inputs).
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      const { code } = e;

      if (isAny(code, KEYS.pause)) {
        e.preventDefault();
        useStore.getState().togglePause();
        return;
      }
      if (isAny(code, KEYS.help)) {
        e.preventDefault();
        useStore.getState().toggleHelp();
        return;
      }
      if (isAny(code, KEYS.reset)) {
        e.preventDefault();
        handlers.onReset();
        return;
      }
      if (isAny(code, KEYS.throttleFull)) {
        setThrottle(1);
        return;
      }
      if (isAny(code, KEYS.throttleIdle)) {
        setThrottle(0);
        return;
      }

      // Prevent the page from scrolling on arrow / space.
      if (
        isAny(code, KEYS.pitchUp) ||
        isAny(code, KEYS.pitchDown) ||
        isAny(code, KEYS.rollLeft) ||
        isAny(code, KEYS.rollRight)
      ) {
        e.preventDefault();
      }
      held.add(code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      held.delete(e.code);
    };

    const onBlur = () => {
      held.clear();
      setAxis('keyboard', 'pitch', 0);
      setAxis('keyboard', 'roll', 0);
      setAxis('keyboard', 'yaw', 0);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    rafId = requestAnimationFrame(updateAxes);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      cancelAnimationFrame(rafId);
      onBlur();
    };
  }, [handlers]);
}
