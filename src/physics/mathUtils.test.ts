import { describe, expect, it } from 'vitest';
import { applyDeadzone, clamp, damp, lerp, mapRange, wrapHeading } from './mathUtils';

describe('clamp', () => {
  it('bounds values to the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('lerp', () => {
  it('interpolates linearly', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, 1)).toBe(10);
  });
});

describe('damp', () => {
  it('moves toward the target and converges', () => {
    let v = 0;
    for (let i = 0; i < 200; i++) v = damp(v, 100, 6, 1 / 60);
    expect(v).toBeGreaterThan(99);
    expect(v).toBeLessThanOrEqual(100);
  });

  it('is frame-rate independent within tolerance', () => {
    let a = 0;
    let b = 0;
    // 1 second of simulated time, different step sizes.
    for (let i = 0; i < 60; i++) a = damp(a, 1, 5, 1 / 60);
    for (let i = 0; i < 240; i++) b = damp(b, 1, 5, 1 / 240);
    expect(Math.abs(a - b)).toBeLessThan(0.01);
  });
});

describe('wrapHeading', () => {
  it('wraps into [0, 360)', () => {
    expect(wrapHeading(0)).toBe(0);
    expect(wrapHeading(370)).toBe(10);
    expect(wrapHeading(-10)).toBe(350);
    expect(wrapHeading(720)).toBe(0);
  });
});

describe('mapRange', () => {
  it('remaps between ranges', () => {
    expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
    expect(mapRange(0, -1, 1, 0, 200)).toBe(100);
  });
  it('returns outMin when the input range is degenerate', () => {
    expect(mapRange(5, 2, 2, 7, 9)).toBe(7);
  });
});

describe('applyDeadzone', () => {
  it('zeroes small magnitudes', () => {
    expect(applyDeadzone(0.05, 0.1)).toBe(0);
    expect(applyDeadzone(-0.09, 0.1)).toBe(0);
  });
  it('rescales remaining range to reach the extremes', () => {
    expect(applyDeadzone(1, 0.1)).toBeCloseTo(1);
    expect(applyDeadzone(-1, 0.1)).toBeCloseTo(-1);
    expect(applyDeadzone(0.55, 0.1)).toBeCloseTo(0.5, 5);
  });
});
