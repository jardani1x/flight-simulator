import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import type { ControlInput } from '../core/types';
import { GEAR_HEIGHT, STALL_ANGLE } from '../config/constants';
import {
  computeAngleOfAttack,
  createInitialAircraftState,
  createTelemetry,
  deriveTelemetry,
  dynamicPressure,
  isStalled,
  liftCoefficient,
  stepAircraft,
} from './flightModel';

const NEUTRAL: ControlInput = { pitch: 0, roll: 0, yaw: 0, throttle: 0 };
const ctrl = (p: Partial<ControlInput>): ControlInput => ({ ...NEUTRAL, ...p });

describe('createInitialAircraftState', () => {
  it('starts on the runway, level and idle', () => {
    const s = createInitialAircraftState();
    expect(s.onGround).toBe(true);
    expect(s.crashed).toBe(false);
    expect(s.throttle).toBe(0);
    expect(s.position.y).toBeCloseTo(GEAR_HEIGHT, 5);
    expect(s.velocity.length()).toBe(0);
  });
});

describe('computeAngleOfAttack', () => {
  const identity = createInitialAircraftState().orientation;

  it('is ~0 in level forward flight', () => {
    const aoa = computeAngleOfAttack(new Vector3(0, 0, -50), identity);
    expect(Math.abs(aoa)).toBeLessThan(1e-6);
  });

  it('is positive when the flight path is below the nose (descending)', () => {
    const aoa = computeAngleOfAttack(new Vector3(0, -5, -50), identity);
    expect(aoa).toBeGreaterThan(0);
  });

  it('returns 0 for negligible airspeed', () => {
    expect(computeAngleOfAttack(new Vector3(0, 0, 0), identity)).toBe(0);
  });
});

describe('liftCoefficient & stall', () => {
  it('is linear below the stall angle', () => {
    expect(liftCoefficient(0.1)).toBeCloseTo(5.5 * 0.1, 5);
    expect(liftCoefficient(0.2)).toBeGreaterThan(liftCoefficient(0.1));
  });

  it('drops after the stall angle', () => {
    const peak = liftCoefficient(STALL_ANGLE);
    const postStall = liftCoefficient(STALL_ANGLE + 0.2);
    expect(postStall).toBeLessThan(peak);
    expect(postStall).toBeGreaterThan(0); // retains a non-zero floor
  });

  it('flags stall only beyond the critical angle', () => {
    expect(isStalled(STALL_ANGLE - 0.05)).toBe(false);
    expect(isStalled(STALL_ANGLE + 0.05)).toBe(true);
  });
});

describe('dynamicPressure', () => {
  it('grows with the square of airspeed', () => {
    expect(dynamicPressure(20)).toBeGreaterThan(0);
    expect(dynamicPressure(40)).toBeCloseTo(dynamicPressure(20) * 4, 5);
  });

  it('means more lift at higher speed for the same angle of attack', () => {
    const cl = liftCoefficient(0.1);
    const slow = dynamicPressure(30) * cl;
    const fast = dynamicPressure(60) * cl;
    expect(fast).toBeGreaterThan(slow);
  });
});

describe('stepAircraft — takeoff', () => {
  it('accelerates on the runway and eventually leaves the ground', () => {
    const s = createInitialAircraftState();
    const input = ctrl({ throttle: 1, pitch: 0.6 });
    const dt = 1 / 120;
    for (let i = 0; i < 120 * 20; i++) {
      stepAircraft(s, input, dt);
      if (!s.onGround && s.position.y > GEAR_HEIGHT + 5) break;
    }
    expect(s.crashed).toBe(false);
    expect(s.velocity.length()).toBeGreaterThan(25);
    expect(s.onGround).toBe(false);
    expect(s.position.y).toBeGreaterThan(GEAR_HEIGHT + 1);
  });
});

describe('stepAircraft — drag', () => {
  it('decelerates the airframe along its path with no thrust', () => {
    const s = createInitialAircraftState();
    s.onGround = false;
    s.position.set(0, 500, 0);
    s.velocity.set(0, 0, -60);
    const dt = 1 / 120;
    for (let i = 0; i < 120; i++) stepAircraft(s, NEUTRAL, dt);
    // Forward (–z) speed should have bled off due to drag.
    expect(Math.abs(s.velocity.z)).toBeLessThan(60);
  });
});

describe('stepAircraft — crash detection', () => {
  it('crashes on a hard, fast ground impact', () => {
    const s = createInitialAircraftState();
    s.onGround = false;
    s.position.set(0, 60, 0);
    s.velocity.set(0, -30, 0);
    const dt = 1 / 120;
    for (let i = 0; i < 120 * 5 && !s.crashed; i++) stepAircraft(s, NEUTRAL, dt);
    expect(s.crashed).toBe(true);
  });

  it('does not crash on a gentle touchdown', () => {
    const s = createInitialAircraftState();
    s.onGround = false;
    s.position.set(0, GEAR_HEIGHT + 1.5, 0);
    s.velocity.set(0, -1.5, -30);
    const dt = 1 / 120;
    for (let i = 0; i < 120; i++) stepAircraft(s, NEUTRAL, dt);
    expect(s.crashed).toBe(false);
    expect(s.onGround).toBe(true);
  });

  it('freezes once crashed (no-op stepping)', () => {
    const s = createInitialAircraftState();
    s.crashed = true;
    const before = s.position.clone();
    stepAircraft(s, ctrl({ throttle: 1 }), 1 / 60);
    expect(s.position.equals(before)).toBe(true);
  });
});

describe('deriveTelemetry', () => {
  it('reports knots-ready airspeed, altitude and heading', () => {
    const s = createInitialAircraftState();
    s.velocity.set(0, 2, -40);
    const t = createTelemetry();
    deriveTelemetry(s, t);
    expect(t.airspeed).toBeCloseTo(Math.hypot(40, 2), 4);
    expect(t.verticalSpeed).toBeCloseTo(2, 5);
    expect(t.altitude).toBeCloseTo(0, 5); // sitting at gear height = 0 AGL
    expect(t.heading).toBeGreaterThanOrEqual(0);
    expect(t.heading).toBeLessThan(360);
  });
});
