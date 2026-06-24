import {
  LINEUP_Z,
  M_TO_FEET,
  MS_TO_KNOTS,
  NORTH_THRESHOLD_Z,
  SOUTH_THRESHOLD_Z,
  SPAWN_Z,
} from '../config/constants';
import { bearingDegrees, clamp, signedHeadingDelta } from '../physics/mathUtils';
import type { MissionPhase, MissionSnapshot, PhaseEvaluation } from './types';

// ---------------------------------------------------------------------------
// Guided-flight geometry (metres). The runway runs north–south through the
// origin; the aircraft takes off to the north (−Z), flies out to a waypoint,
// turns back, and lands to the south (+Z) on the same runway.
// ---------------------------------------------------------------------------

/** Take-off rotation speed (m/s ≈ 54 kt) — pull back gently around here. */
export const ROTATE_SPEED = 28;
/** Initial climb goal: 1,000 ft above the ground (≈ 305 m). */
export const CLIMB_TARGET_M = 1000 / M_TO_FEET;
/** Outbound waypoint — ahead and to the left, a gentle climbing left turn. */
export const WAYPOINT = { x: -1700, z: -2600 };
/** Where reaching the waypoint counts (m). */
export const WAYPOINT_RADIUS = 360;
/** Approach entry on the extended centreline, north of the runway. */
export const APPROACH_ENTRY = { x: 0, z: -1700 };
export const APPROACH_ENTRY_RADIUS = 600;
/** Aim point for touchdown, just inside the north threshold (landing south). */
export const TOUCHDOWN_AIM = { x: 0, z: -560 };
/** Compass heading to fly the landing (south, +Z). */
export const LANDING_HEADING = 180;

// Reference distances purely for smooth progress bars.
const WAYPOINT_LEG = 3100;
const RETURN_LEG = 2000;

const kt = (ms: number): string => Math.round(ms * MS_TO_KNOTS).toString();
const ft = (m: number): string => Math.round(m * M_TO_FEET).toLocaleString();

/** Horizontal distance from the aircraft to a ground point. */
function distanceTo(s: MissionSnapshot, x: number, z: number): number {
  return Math.hypot(x - s.state.position.x, z - s.state.position.z);
}

/** Signed turn (deg) the pilot must make to head toward a ground point. */
function relativeBearingTo(s: MissionSnapshot, x: number, z: number): number {
  const bearing = bearingDegrees(x - s.state.position.x, z - s.state.position.z);
  return signedHeadingDelta(s.telemetry.heading, bearing);
}

/** Phrase a "turn left/right" nudge from a signed relative bearing. */
function turnHint(relBearing: number, threshold = 12): string {
  if (relBearing < -threshold) return 'Turn left toward the marker.';
  if (relBearing > threshold) return 'Turn right toward the marker.';
  return 'Hold this heading — fly straight to the marker.';
}

const ok = (
  progress: number,
  hint = '',
  metric: PhaseEvaluation['metric'] = null,
  warn = false,
): PhaseEvaluation => ({ done: false, progress: clamp(progress, 0, 1), hint, warn, metric });

const done = (hint = '', metric: PhaseEvaluation['metric'] = null): PhaseEvaluation => ({
  done: true,
  progress: 1,
  hint,
  warn: false,
  metric,
});

/**
 * The ordered guided-flight plan. Each phase is a static description plus a pure
 * `evaluate` predicate over a telemetry/position snapshot, so the whole flow is
 * unit-testable without React or a renderer.
 */
export const MISSION_PHASES: MissionPhase[] = [
  {
    id: 'preflight',
    title: 'Pre-flight checklist',
    instruction:
      'Brakes set, throttle idle, controls free. When you are ready, ease off the brakes and add a little throttle to start rolling.',
    target: { x: 0, z: LINEUP_Z, kind: 'taxi' },
    evaluate: (s) => {
      const moving = s.telemetry.groundSpeed;
      if (moving > 1.2) return done();
      const tooMuch = s.telemetry.throttle > 0.6;
      return ok(
        clamp(moving / 1.2, 0, 0.9),
        tooMuch
          ? 'Easy — just a touch of throttle to begin taxiing.'
          : 'Add a little throttle to taxi forward.',
        { label: 'THR', value: `${Math.round(s.telemetry.throttle * 100)}%` },
        tooMuch,
      );
    },
  },
  {
    id: 'taxi',
    title: 'Taxi to the runway',
    instruction:
      'Roll forward onto the runway. Keep it slow and use the rudder (Q / E) to stay on the centre line.',
    target: { x: 0, z: LINEUP_Z, kind: 'taxi' },
    evaluate: (s) => {
      const z = s.state.position.z;
      const onRunway = z <= SOUTH_THRESHOLD_Z - 20;
      if (onRunway && s.state.onGround) return done();
      const progress = clamp((SPAWN_Z - z) / (SPAWN_Z - (SOUTH_THRESHOLD_Z - 20)), 0, 1);
      const speedKt = s.telemetry.groundSpeed * MS_TO_KNOTS;
      if (speedKt > 28) {
        return ok(progress, 'Too fast — ease off and tap the brakes (Space).', null, true);
      }
      if (Math.abs(s.state.position.x) > 16) {
        return ok(progress, 'Steer back toward the centre line.', null, true);
      }
      return ok(progress, 'Good — keep rolling slowly toward the runway.');
    },
  },
  {
    id: 'lineup',
    title: 'Line up on the runway',
    instruction:
      'Point the nose straight down the runway and centre yourself on the white line. Get ready for take-off.',
    target: { x: 0, z: NORTH_THRESHOLD_Z, kind: 'runway' },
    evaluate: (s) => {
      const headingErr = Math.abs(signedHeadingDelta(s.telemetry.heading, 0));
      const offCentre = Math.abs(s.state.position.x);
      const aligned = headingErr < 8 && offCentre < 12;
      if (aligned && s.state.onGround) return done();
      const progress = clamp(1 - (headingErr / 40 + offCentre / 30) / 2, 0, 1);
      if (headingErr >= 8)
        return ok(progress, 'Use the rudder (Q / E) to aim straight down the runway.');
      return ok(progress, 'Centre the aircraft on the runway line.');
    },
  },
  {
    id: 'takeoff',
    title: 'Take off',
    instruction:
      'Push the throttle to full (Shift / X). At about 55 kt, gently pull back to lift off.',
    target: { x: 0, z: NORTH_THRESHOLD_Z, kind: 'runway' },
    evaluate: (s) => {
      const metric = { label: 'SPD', value: `${kt(s.telemetry.airspeed)} kt` };
      if (!s.state.onGround && s.telemetry.altitude > 8)
        return done('Positive climb — gear up… well, it is fixed! Keep climbing.', metric);
      const progress = clamp(s.telemetry.airspeed / ROTATE_SPEED, 0, 1);
      if (s.state.onGround && s.telemetry.throttle < 0.9) {
        return ok(progress, 'Full throttle — hold Shift or press X.', metric);
      }
      if (Math.abs(s.state.position.x) > 22) {
        return ok(progress, 'Keep straight with the rudder.', metric, true);
      }
      if (s.telemetry.airspeed >= ROTATE_SPEED * 0.9) {
        return ok(progress, 'Speed looks good — gently pull back to rotate.', metric);
      }
      return ok(progress, 'Building speed — keep it straight.', metric);
    },
  },
  {
    id: 'climb',
    title: 'Climb to 1,000 ft',
    instruction:
      'Keep the nose about 10° above the horizon and climb away. Watch your speed so you do not stall.',
    target: null,
    evaluate: (s) => {
      const metric = { label: 'ALT', value: `${ft(s.telemetry.altitude)} ft` };
      if (s.telemetry.altitude >= CLIMB_TARGET_M)
        return done('Level off — you reached 1,000 ft.', metric);
      const progress = clamp(s.telemetry.altitude / CLIMB_TARGET_M, 0, 1);
      if (s.telemetry.stalled)
        return ok(progress, 'Stall! Lower the nose and add power.', metric, true);
      if (s.telemetry.airspeed < ROTATE_SPEED * 0.8) {
        return ok(progress, 'Speed is low — lower the nose a touch.', metric, true);
      }
      if (s.telemetry.verticalSpeed < 0.5)
        return ok(progress, 'Pull back gently to keep climbing.', metric);
      return ok(progress, 'Nice climb — hold it steady.', metric);
    },
  },
  {
    id: 'waypoint',
    title: 'Fly to the waypoint',
    instruction:
      'Level off and turn toward the glowing waypoint ring. Bank gently — lift tilts with you to turn.',
    target: { x: WAYPOINT.x, z: WAYPOINT.z, kind: 'waypoint' },
    evaluate: (s) => {
      const dist = distanceTo(s, WAYPOINT.x, WAYPOINT.z);
      const metric = { label: 'DIST', value: formatDistance(dist) };
      if (dist < WAYPOINT_RADIUS) return done('Waypoint reached — great navigating!', metric);
      const progress = clamp(1 - dist / WAYPOINT_LEG, 0, 1);
      if (Math.abs(s.telemetry.roll) > 0.7)
        return ok(progress, 'Ease the bank — gentle turns.', metric, true);
      return ok(progress, turnHint(relativeBearingTo(s, WAYPOINT.x, WAYPOINT.z)), metric);
    },
  },
  {
    id: 'return',
    title: 'Turn back to the airport',
    instruction:
      'Turn around and head back toward the runway. Start easing off the throttle to lose some height.',
    target: { x: APPROACH_ENTRY.x, z: APPROACH_ENTRY.z, kind: 'approach' },
    evaluate: (s) => {
      const dist = distanceTo(s, APPROACH_ENTRY.x, APPROACH_ENTRY.z);
      const metric = { label: 'DIST', value: formatDistance(dist) };
      if (dist < APPROACH_ENTRY_RADIUS)
        return done('Lined up for approach — now bring it down.', metric);
      const progress = clamp(1 - dist / RETURN_LEG, 0, 1);
      return ok(
        progress,
        turnHint(relativeBearingTo(s, APPROACH_ENTRY.x, APPROACH_ENTRY.z)),
        metric,
      );
    },
  },
  {
    id: 'approach',
    title: 'Final approach',
    instruction:
      'Fly down the centre line toward the runway. Reduce throttle, descend gently, and slow to about 60 kt.',
    target: { x: TOUCHDOWN_AIM.x, z: TOUCHDOWN_AIM.z, kind: 'runway' },
    evaluate: (s) => {
      const z = s.state.position.z;
      const offCentreNow = Math.abs(s.state.position.x);
      const metric = { label: 'ALT', value: `${ft(s.telemetry.altitude)} ft` };
      // Hand over to the landing phase when low and roughly lined up near the
      // runway, or on any touchdown near the runway surface. Tolerances are
      // deliberately forgiving — this is a beginner's first landing, not an ILS.
      const headingErrNow = Math.abs(signedHeadingDelta(s.telemetry.heading, LANDING_HEADING));
      const nearRunway =
        z >= NORTH_THRESHOLD_Z - 60 && z <= SOUTH_THRESHOLD_Z + 60 && offCentreNow < 100;
      const lowAndAligned = nearRunway && s.telemetry.altitude < 40 && headingErrNow < 45;
      const touchedDownNear =
        s.state.onGround &&
        offCentreNow < 100 &&
        z >= NORTH_THRESHOLD_Z - 120 &&
        z <= SOUTH_THRESHOLD_Z + 160;
      if (lowAndAligned || touchedDownNear) {
        return done('Over the runway — flare and touch down softly.', metric);
      }
      const progress = clamp(1 - s.telemetry.altitude / CLIMB_TARGET_M, 0, 1);
      if (headingErrNow > 35)
        return ok(progress, 'Turn to fly straight down the runway (heading 180°).', metric, true);
      if (offCentreNow > 45) return ok(progress, 'Line up with the centre line.', metric, true);
      if (s.telemetry.airspeed > 40)
        return ok(progress, 'Ease off the throttle to slow down.', metric);
      if (s.telemetry.altitude > 150 && z > NORTH_THRESHOLD_Z - 400) {
        return ok(progress, 'You are high — reduce power and descend.', metric);
      }
      return ok(progress, 'Looking good — keep descending toward the numbers.', metric);
    },
  },
  {
    id: 'land',
    title: 'Land & stop',
    instruction:
      'Flare just above the runway, touch down softly, then hold the brakes (Space) to roll to a stop.',
    target: null,
    evaluate: (s) => {
      const z = s.state.position.z;
      const stopped = s.state.onGround && s.telemetry.groundSpeed < 3;
      const onRunway =
        Math.abs(s.state.position.x) < 100 &&
        z >= NORTH_THRESHOLD_Z - 120 &&
        z <= SOUTH_THRESHOLD_Z + 160;
      if (stopped && onRunway && !s.state.crashed)
        return done('Stopped on the runway. Mission complete!');
      if (!s.state.onGround) {
        const progress = clamp(1 - s.telemetry.altitude / 30, 0, 0.6);
        if (s.telemetry.altitude < 6 && s.telemetry.verticalSpeed < -3) {
          return ok(progress, 'Flare! Gently pull back to soften the touchdown.', null, true);
        }
        return ok(progress, 'Ease off the throttle and let it settle onto the runway.');
      }
      const progress = clamp(0.6 + 0.4 * (1 - s.telemetry.groundSpeed / 40), 0, 1);
      return ok(progress, 'Down! Hold the brakes (Space) to stop.', {
        label: 'SPD',
        value: `${kt(s.telemetry.groundSpeed)} kt`,
      });
    },
  },
  {
    id: 'complete',
    title: 'Mission complete',
    instruction:
      'You flew the whole circuit: taxi, take-off, climb, navigation, approach and landing.',
    target: null,
    // Terminal phase: never advances further.
    evaluate: () => ok(1, ''),
  },
];

/** Number of actionable steps (everything except the terminal phase). */
export const TOTAL_STEPS = MISSION_PHASES.length - 1;

/** Format a distance in metres as a friendly "820 m" / "1.4 km" string. */
export function formatDistance(metres: number): string {
  if (metres >= 1000) return `${(metres / 1000).toFixed(1)} km`;
  return `${Math.round(metres / 10) * 10} m`;
}
