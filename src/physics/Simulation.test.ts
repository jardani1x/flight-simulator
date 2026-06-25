import { describe, expect, it } from 'vitest';
import type { ControlInput } from '../core/types';
import { CEILING, GEAR_HEIGHT, WORLD_HALF_SIZE } from '../config/constants';
import { Simulation } from './Simulation';

const NEUTRAL: ControlInput = { pitch: 0, roll: 0, yaw: 0, throttle: 0, brake: 0 };

describe('Simulation', () => {
  it('advances the aircraft when throttle is applied', () => {
    const sim = new Simulation();
    const startZ = sim.state.position.z;
    for (let i = 0; i < 120; i++) {
      sim.update(1 / 60, { ...NEUTRAL, throttle: 1 });
    }
    // Facing –Z, so the aircraft should have moved to a smaller z.
    expect(sim.state.position.z).toBeLessThan(startZ);
    expect(sim.telemetry.airspeed).toBeGreaterThan(0);
  });

  it('reset returns the aircraft to its initial state', () => {
    const sim = new Simulation();
    for (let i = 0; i < 60; i++) sim.update(1 / 60, { ...NEUTRAL, throttle: 1 });
    sim.reset();
    expect(sim.state.velocity.length()).toBe(0);
    expect(sim.state.position.y).toBeCloseTo(GEAR_HEIGHT, 5);
    expect(sim.state.crashed).toBe(false);
    expect(sim.state.throttle).toBe(0);
  });

  it('clamps the aircraft to the world bounds', () => {
    const sim = new Simulation();
    sim.state.onGround = false;
    sim.state.position.set(WORLD_HALF_SIZE + 500, 1000, 0);
    sim.state.velocity.set(50, 0, 0);
    sim.update(1 / 60, NEUTRAL);
    expect(sim.state.position.x).toBeLessThanOrEqual(WORLD_HALF_SIZE);
    expect(sim.outOfBoundsEvents).toBeGreaterThan(0);
  });

  it('enforces a ceiling on altitude', () => {
    const sim = new Simulation();
    sim.state.onGround = false;
    sim.state.position.set(0, GEAR_HEIGHT + CEILING + 1000, 0);
    sim.state.velocity.set(0, 100, 0);
    sim.update(1 / 60, NEUTRAL);
    expect(sim.state.position.y).toBeLessThanOrEqual(GEAR_HEIGHT + CEILING + 1e-3);
  });

  it('does not advance time without a positive delta backlog', () => {
    const sim = new Simulation();
    const before = sim.state.position.clone();
    sim.update(0, { ...NEUTRAL, throttle: 1 });
    expect(sim.state.position.equals(before)).toBe(true);
  });
});
