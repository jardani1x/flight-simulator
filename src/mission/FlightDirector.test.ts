import { describe, expect, it } from 'vitest';
import type { Telemetry } from '../core/types';
import { createInitialAircraftState, createTelemetry } from '../physics/flightModel';
import { CLIMB_TARGET_M, APPROACH_ENTRY, WAYPOINT } from './missionPlan';
import { FlightDirector } from './FlightDirector';
import type { MissionSnapshot } from './types';

interface SnapOverrides {
  pos?: [number, number, number];
  onGround?: boolean;
  crashed?: boolean;
  tele?: Partial<Telemetry>;
  brake?: number;
}

/** Build a mission snapshot with sensible defaults and targeted overrides. */
function snap(over: SnapOverrides = {}): MissionSnapshot {
  const state = createInitialAircraftState();
  if (over.pos) state.position.set(over.pos[0], over.pos[1], over.pos[2]);
  if (over.onGround !== undefined) state.onGround = over.onGround;
  if (over.crashed !== undefined) state.crashed = over.crashed;
  const telemetry: Telemetry = { ...createTelemetry(), ...over.tele };
  return { state, telemetry, brake: over.brake ?? 0 };
}

describe('FlightDirector', () => {
  it('starts at the pre-flight phase', () => {
    const d = new FlightDirector();
    expect(d.state.phaseId).toBe('preflight');
    expect(d.state.phaseIndex).toBe(0);
    expect(d.state.complete).toBe(false);
    expect(d.state.totalSteps).toBeGreaterThan(5);
  });

  it('does not advance while the goal is unmet', () => {
    const d = new FlightDirector();
    d.update(snap({ tele: { groundSpeed: 0, throttle: 0 } }));
    expect(d.state.phaseId).toBe('preflight');
    expect(d.state.progress).toBeLessThan(1);
    expect(d.state.hint.length).toBeGreaterThan(0);
  });

  it('walks through the whole guided circuit to completion', () => {
    const d = new FlightDirector();

    // pre-flight -> taxi: start rolling.
    d.update(snap({ tele: { groundSpeed: 2 } }));
    expect(d.state.phaseId).toBe('taxi');

    // taxi -> line-up: reach the runway, on the ground.
    d.update(snap({ pos: [0, 1.4, 660], onGround: true, tele: { groundSpeed: 8 } }));
    expect(d.state.phaseId).toBe('lineup');

    // line-up -> take-off: centred and pointing down the runway.
    d.update(snap({ pos: [0, 1.4, 640], onGround: true, tele: { heading: 0, groundSpeed: 4 } }));
    expect(d.state.phaseId).toBe('takeoff');

    // take-off -> climb: airborne and climbing.
    d.update(snap({ pos: [0, 12, 300], onGround: false, tele: { altitude: 11, airspeed: 32 } }));
    expect(d.state.phaseId).toBe('climb');

    // climb -> waypoint: reach 1,000 ft.
    d.update(
      snap({
        pos: [0, 320, -800],
        onGround: false,
        tele: { altitude: CLIMB_TARGET_M + 5, airspeed: 40 },
      }),
    );
    expect(d.state.phaseId).toBe('waypoint');

    // waypoint -> return: arrive at the waypoint ring.
    d.update(
      snap({ pos: [WAYPOINT.x, 300, WAYPOINT.z], onGround: false, tele: { altitude: 295 } }),
    );
    expect(d.state.phaseId).toBe('return');

    // return -> approach: arrive at the approach entry.
    d.update(
      snap({
        pos: [APPROACH_ENTRY.x, 250, APPROACH_ENTRY.z],
        onGround: false,
        tele: { altitude: 245 },
      }),
    );
    expect(d.state.phaseId).toBe('approach');

    // approach -> land: descend low over the runway.
    d.update(
      snap({
        pos: [0, 20, -100],
        onGround: false,
        tele: { altitude: 18, heading: 180, airspeed: 33 },
      }),
    );
    expect(d.state.phaseId).toBe('land');

    // land -> complete: stopped on the runway.
    d.update(snap({ pos: [0, 1.4, 200], onGround: true, tele: { groundSpeed: 1 } }));
    expect(d.state.phaseId).toBe('complete');
    expect(d.state.complete).toBe(true);
  });

  it('computes directional guidance toward the active target', () => {
    const d = new FlightDirector();
    // Advance into the waypoint phase.
    d.update(snap({ tele: { groundSpeed: 2 } })); // -> taxi
    d.update(snap({ pos: [0, 1.4, 660], onGround: true })); // -> lineup
    d.update(snap({ pos: [0, 1.4, 640], onGround: true, tele: { heading: 0 } })); // -> takeoff
    d.update(snap({ pos: [0, 12, 300], onGround: false, tele: { altitude: 11, airspeed: 32 } })); // -> climb
    d.update(
      snap({ pos: [0, 320, -800], onGround: false, tele: { altitude: CLIMB_TARGET_M + 5 } }),
    ); // -> waypoint

    // From the origin heading north, the waypoint (north-west) is a left turn.
    d.update(snap({ pos: [0, 300, 0], onGround: false, tele: { heading: 0, altitude: 300 } }));
    expect(d.state.phaseId).toBe('waypoint');
    expect(d.state.hasTarget).toBe(true);
    expect(d.state.targetKind).toBe('waypoint');
    expect(d.state.relativeBearing).toBeLessThan(0); // turn left
    expect(d.state.distance).toBeGreaterThan(2500);
  });

  it('reset returns to the first phase', () => {
    const d = new FlightDirector();
    d.update(snap({ tele: { groundSpeed: 2 } }));
    expect(d.state.phaseId).toBe('taxi');
    d.reset();
    expect(d.state.phaseId).toBe('preflight');
    expect(d.state.phaseIndex).toBe(0);
    expect(d.state.complete).toBe(false);
  });
});
