import { afterEach, describe, expect, it } from 'vitest';
import { useStore } from '../state/store';
import {
  getThrottle,
  nudgeThrottle,
  readControlInput,
  resetInput,
  setAxis,
  setThrottle,
} from './inputState';

afterEach(() => {
  resetInput();
  setThrottle(0);
  useStore.getState().updateSettings({ sensitivity: 1, invertPitch: false });
});

describe('inputState', () => {
  it('merges channels and clamps to [-1, 1]', () => {
    setAxis('keyboard', 'roll', 0.7);
    setAxis('touch', 'roll', 0.7);
    expect(readControlInput().roll).toBe(1); // 1.4 clamped
  });

  it('applies sensitivity centrally', () => {
    useStore.getState().updateSettings({ sensitivity: 0.5 });
    setAxis('keyboard', 'pitch', 1);
    expect(readControlInput().pitch).toBeCloseTo(0.5, 5);
  });

  it('applies pitch inversion centrally', () => {
    useStore.getState().updateSettings({ invertPitch: true });
    setAxis('keyboard', 'pitch', 1);
    expect(readControlInput().pitch).toBeCloseTo(-1, 5);
  });

  it('tracks absolute throttle and nudges within [0, 1]', () => {
    setThrottle(0.5);
    expect(getThrottle()).toBe(0.5);
    nudgeThrottle(0.7);
    expect(getThrottle()).toBe(1);
    nudgeThrottle(-2);
    expect(getThrottle()).toBe(0);
  });

  it('resetInput zeroes all axes', () => {
    setAxis('gamepad', 'yaw', 1);
    resetInput();
    expect(readControlInput().yaw).toBe(0);
  });
});
