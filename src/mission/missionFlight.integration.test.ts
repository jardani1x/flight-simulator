import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import type { ControlInput, Telemetry } from '../core/types';
import { GEAR_HEIGHT, NORTH_THRESHOLD_Z } from '../config/constants';
import { Simulation } from '../physics/Simulation';
import { createInitialAircraftState, createTelemetry } from '../physics/flightModel';
import { bearingDegrees, clamp, signedHeadingDelta } from '../physics/mathUtils';
import { FlightDirector } from './FlightDirector';
import {
  APPROACH_ENTRY,
  CLIMB_TARGET_M,
  LANDING_HEADING,
  ROTATE_SPEED,
  WAYPOINT,
} from './missionPlan';
import type { MissionSnapshot } from './types';

/**
 * End-to-end gameplay-path tests that fly the *real* flight physics through the
 * FlightDirector with scripted autopilots. Because the simulation is a
 * deterministic fixed-timestep integrator these are stable across runs.
 *
 * Test 1 proves the whole outbound journey — apron taxi, take-off, climb,
 * navigation to the waypoint and the turn back to final approach. Test 2 proves
 * a straight-in approach is flown to a gentle touchdown and a full stop, firing
 * the mission-complete transition. Together they exercise every phase of the
 * guided flight against the genuine flight model rather than mocked telemetry.
 */
describe('guided flight integration (real physics)', () => {
  it('flies from the apron through take-off, climb and navigation to final approach', () => {
    const sim = new Simulation();
    const director = new FlightDirector();
    const input: ControlInput = { pitch: 0, roll: 0, yaw: 0, throttle: 0, brake: 0 };
    const dt = 1 / 60;
    const t = sim.telemetry;
    const pos = sim.state.position;

    const tick = (): void => {
      sim.update(dt, input);
      director.update({ telemetry: sim.telemetry, state: sim.state, brake: input.brake });
    };
    const run = (maxTicks: number, control: () => void, until: () => boolean): boolean => {
      for (let i = 0; i < maxTicks; i++) {
        control();
        tick();
        if (until()) return true;
      }
      return false;
    };

    const steerToward = (x: number, z: number): void => {
      const relB = signedHeadingDelta(t.heading, bearingDegrees(x - pos.x, z - pos.z));
      const desiredBank = clamp(relB * 0.03, -0.6, 0.6);
      input.roll = clamp((desiredBank - t.roll) * 3, -1, 1);
    };
    const holdAltitude = (target: number): void => {
      input.pitch = clamp((target - t.altitude) * 0.01 - t.verticalSpeed * 0.06, -0.6, 0.8);
    };
    const keepStraight = (): number =>
      clamp(-signedHeadingDelta(t.heading, 0) * 0.05 - pos.x * 0.01, -1, 1);

    // Pre-flight + taxi: a little throttle rolls onto the runway and lines up.
    expect(director.state.phaseId).toBe('preflight');
    run(
      1500,
      () => {
        input.throttle = 0.32;
        input.yaw = keepStraight();
      },
      () => director.state.phaseId === 'takeoff',
    );
    expect(director.state.phaseId).toBe('takeoff');

    // Take-off roll: full power, rotate around the target speed.
    run(
      1200,
      () => {
        input.throttle = 1;
        input.yaw = keepStraight();
        input.pitch = t.airspeed >= ROTATE_SPEED ? 0.5 : 0;
      },
      () => !sim.state.onGround && t.altitude > 10,
    );
    expect(sim.state.onGround).toBe(false);
    expect(director.state.phaseId).toBe('climb');

    // Climb straight ahead to 1,000 ft.
    run(
      3000,
      () => {
        input.yaw = 0;
        input.throttle = 1;
        input.roll = clamp(-t.roll * 3, -1, 1);
        holdAltitude(CLIMB_TARGET_M + 60);
      },
      () => director.state.phaseId === 'waypoint',
    );
    expect(director.state.phaseId).toBe('waypoint');
    expect(t.altitude).toBeGreaterThan(CLIMB_TARGET_M);

    // Navigate out to the waypoint.
    run(
      6000,
      () => {
        input.throttle = 0.5;
        steerToward(WAYPOINT.x, WAYPOINT.z);
        holdAltitude(360);
      },
      () => director.state.phaseId === 'return',
    );
    expect(director.state.phaseId).toBe('return');

    // Turn back toward the airport and reach the approach entry.
    run(
      9000,
      () => {
        input.throttle = 0.4;
        steerToward(APPROACH_ENTRY.x, APPROACH_ENTRY.z);
        holdAltitude(240);
      },
      () => director.state.phaseId === 'approach',
    );
    expect(sim.state.crashed).toBe(false);
    expect(director.state.phaseId).toBe('approach');
  });

  it('completes a straight-in approach with a gentle landing and full stop', () => {
    const sim = new Simulation();
    const director = new FlightDirector();
    const t = sim.telemetry;
    const pos = sim.state.position;

    // Fast-forward the director to the landing phase with idealised snapshots
    // (the synthetic phase logic is covered by FlightDirector.test.ts); here we
    // fly the real physics for the actual touchdown and rollout.
    const advance = (over: {
      pos?: [number, number, number];
      onGround?: boolean;
      tele?: Partial<Telemetry>;
    }): void => {
      const state = createInitialAircraftState();
      if (over.pos) state.position.set(over.pos[0], over.pos[1], over.pos[2]);
      if (over.onGround !== undefined) state.onGround = over.onGround;
      const telemetry: Telemetry = { ...createTelemetry(), ...over.tele };
      const snap: MissionSnapshot = { state, telemetry, brake: 0 };
      director.update(snap);
    };
    advance({ tele: { groundSpeed: 2 } }); // -> taxi
    advance({ pos: [0, 1.4, 660], onGround: true }); // -> lineup
    advance({ pos: [0, 1.4, 640], onGround: true, tele: { heading: 0 } }); // -> takeoff
    advance({ pos: [0, 12, 300], onGround: false, tele: { altitude: 11, airspeed: 32 } }); // -> climb
    advance({ pos: [0, 320, -800], onGround: false, tele: { altitude: CLIMB_TARGET_M + 5 } }); // -> waypoint
    advance({ pos: [WAYPOINT.x, 300, WAYPOINT.z], onGround: false, tele: { altitude: 295 } }); // -> return
    advance({
      pos: [APPROACH_ENTRY.x, 250, APPROACH_ENTRY.z],
      onGround: false,
      tele: { altitude: 245 },
    }); // -> approach
    expect(director.state.phaseId).toBe('approach');

    // Place the real aircraft on a stable straight-in final: on the centreline,
    // north of the runway, low, slow and pointing down the runway (heading 180).
    sim.state.position.set(0, GEAR_HEIGHT + 70, NORTH_THRESHOLD_Z - 700);
    sim.state.orientation.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI);
    sim.state.velocity.set(0, -2, 34); // descending, ~34 m/s toward +Z (south)
    sim.state.angularVelocity.set(0, 0, 0);
    sim.state.onGround = false;
    sim.state.crashed = false;

    const input: ControlInput = { pitch: 0, roll: 0, yaw: 0, throttle: 0, brake: 0 };
    const dt = 1 / 60;

    for (let i = 0; i < 5000; i++) {
      if (!sim.state.onGround) {
        input.throttle = 0.12; // low power for a slow, controlled descent
        // Hold the landing heading and the centreline.
        const relB = signedHeadingDelta(t.heading, LANDING_HEADING);
        const desiredBank = clamp(relB * 0.03 - pos.x * 0.004, -0.3, 0.3);
        input.roll = clamp((desiredBank - t.roll) * 3.5, -1, 1);
        // Gentle, steady sink rate, easing off just above the ground.
        const targetVS = t.altitude > 6 ? -2 : -0.6;
        input.pitch = clamp((targetVS - t.verticalSpeed) * 0.06, -0.3, 0.5);
      } else {
        input.throttle = 0;
        input.brake = 1;
        input.pitch = 0.05;
        input.roll = clamp(-t.roll * 3, -1, 1);
        input.yaw = clamp(
          -signedHeadingDelta(t.heading, LANDING_HEADING) * 0.06 - pos.x * 0.02,
          -1,
          1,
        );
      }
      sim.update(dt, input);
      director.update({ telemetry: sim.telemetry, state: sim.state, brake: input.brake });
      if (director.state.complete || sim.state.crashed) break;
    }

    expect(sim.state.crashed).toBe(false);
    expect(sim.state.onGround).toBe(true);
    expect(director.state.complete).toBe(true);
    expect(director.state.phaseId).toBe('complete');
  });
});
