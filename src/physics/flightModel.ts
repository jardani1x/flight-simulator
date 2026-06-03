import { Quaternion, Vector3 } from 'three';
import type { AircraftState, ControlInput, Telemetry } from '../core/types';
import {
  AERO_STABILITY,
  AIRCRAFT_MASS,
  AIR_DENSITY,
  CONTROL_AUTHORITY_SPEED,
  CONTROL_RESPONSIVENESS,
  CRASH_ATTITUDE,
  CRASH_VSPEED,
  DRAG_COEFF_BASE,
  GEAR_HEIGHT,
  GRAVITY,
  GROUND_FRICTION,
  GROUND_LATERAL_GRIP,
  GROUND_LEVEL,
  INDUCED_DRAG_FACTOR,
  LIFT_SLOPE,
  MAX_PITCH_RATE,
  MAX_ROLL_RATE,
  MAX_YAW_RATE,
  MAX_THRUST,
  STALL_ANGLE,
  STALL_BLEND_RANGE,
  STALL_LIFT_FLOOR,
  WING_AREA,
} from '../config/constants';
import { clamp, damp, wrapHeading } from './mathUtils';

// ---------------------------------------------------------------------------
// Reusable scratch objects.
//
// JavaScript is single-threaded, so a single set of module-level scratch
// vectors/quaternions can be safely reused every physics step. This avoids
// allocating (and garbage-collecting) dozens of Vector3s inside the frame loop.
// ---------------------------------------------------------------------------
const _forward = new Vector3();
const _right = new Vector3();
const _velDir = new Vector3();
const _localVel = new Vector3();
const _invQuat = new Quaternion();
const _force = new Vector3();
const _accel = new Vector3();
const _liftDir = new Vector3();
const _omega = new Vector3();
const _deltaQuat = new Quaternion();
const _horizVel = new Vector3();

const BODY_FORWARD = new Vector3(0, 0, -1);
const BODY_RIGHT = new Vector3(1, 0, 0);

/** Create a fresh aircraft state sitting on the runway threshold, engine idle. */
export function createInitialAircraftState(): AircraftState {
  return {
    position: new Vector3(0, GROUND_LEVEL + GEAR_HEIGHT, 600),
    velocity: new Vector3(0, 0, 0),
    orientation: new Quaternion(), // facing -Z (north / down the runway)
    angularVelocity: new Vector3(0, 0, 0),
    throttle: 0,
    onGround: true,
    crashed: false,
  };
}

/**
 * Angle of attack (rad): the angle between the relative wind and the aircraft's
 * longitudinal axis. Positive when the air meets the wing from below.
 */
export function computeAngleOfAttack(velocity: Vector3, orientation: Quaternion): number {
  const speed = velocity.length();
  if (speed < 1e-4) return 0;
  _invQuat.copy(orientation).invert();
  _localVel.copy(velocity).applyQuaternion(_invQuat);
  return Math.atan2(-_localVel.y, -_localVel.z);
}

/**
 * Lift coefficient as a function of angle of attack. Linear up to the stall
 * angle, then falls off toward a non-zero floor to model post-stall behaviour.
 */
export function liftCoefficient(aoa: number): number {
  const magnitude = Math.abs(aoa);
  const sign = aoa < 0 ? -1 : 1;
  if (magnitude <= STALL_ANGLE) {
    return LIFT_SLOPE * aoa;
  }
  const peak = LIFT_SLOPE * STALL_ANGLE;
  // Blend from the peak down to the floor over STALL_BLEND_RANGE past the stall.
  const excess = clamp((magnitude - STALL_ANGLE) / STALL_BLEND_RANGE, 0, 1);
  const factor = 1 - (1 - STALL_LIFT_FLOOR) * excess;
  return sign * peak * factor;
}

/** True when the wing's angle of attack exceeds the critical (stall) angle. */
export function isStalled(aoa: number): boolean {
  return Math.abs(aoa) > STALL_ANGLE;
}

/** Dynamic pressure q = ½·ρ·v² (Pa). */
export function dynamicPressure(airspeed: number): number {
  return 0.5 * AIR_DENSITY * airspeed * airspeed;
}

/**
 * Advance the aircraft state by `dt` seconds. Mutates `state` in place.
 * No-op once the aircraft has crashed (the sim freezes until reset).
 */
export function stepAircraft(state: AircraftState, input: ControlInput, dt: number): void {
  if (state.crashed) return;

  state.throttle = clamp(input.throttle, 0, 1);

  // --- Body axes in world space ------------------------------------------
  _forward.copy(BODY_FORWARD).applyQuaternion(state.orientation);
  _right.copy(BODY_RIGHT).applyQuaternion(state.orientation);

  const airspeed = state.velocity.length();
  const aoa = computeAngleOfAttack(state.velocity, state.orientation);
  const q = dynamicPressure(airspeed);
  const cl = liftCoefficient(aoa);
  const cd = DRAG_COEFF_BASE + INDUCED_DRAG_FACTOR * cl * cl;

  // --- Aerodynamic & propulsive forces -----------------------------------
  _force.set(0, 0, 0);

  // Gravity.
  _force.y -= GRAVITY * AIRCRAFT_MASS;

  // Thrust along the nose.
  _force.addScaledVector(_forward, state.throttle * MAX_THRUST);

  if (airspeed > 1e-3) {
    _velDir.copy(state.velocity).multiplyScalar(1 / airspeed);

    // Lift: perpendicular to the relative wind, in the wing's plane.
    _liftDir.copy(_right).cross(_velDir).normalize();
    _force.addScaledVector(_liftDir, q * WING_AREA * cl);

    // Drag: opposes the relative wind.
    _force.addScaledVector(_velDir, -q * WING_AREA * cd);
  }

  // --- Integrate linear motion (semi-implicit Euler) ---------------------
  _accel.copy(_force).multiplyScalar(1 / AIRCRAFT_MASS);
  state.velocity.addScaledVector(_accel, dt);
  state.position.addScaledVector(state.velocity, dt);

  // --- Rotational dynamics ------------------------------------------------
  integrateRotation(state, input, airspeed, aoa, dt);

  // --- Ground interaction -------------------------------------------------
  handleGround(state, dt);
}

/**
 * Update orientation from pilot commands plus simple aerodynamic stability.
 * Control authority scales with airspeed so the aircraft feels mushy when slow.
 */
function integrateRotation(
  state: AircraftState,
  input: ControlInput,
  airspeed: number,
  aoa: number,
  dt: number,
): void {
  const authority = clamp(airspeed / CONTROL_AUTHORITY_SPEED, 0, 1);
  // Allow a little nose-wheel steering authority while taxiing.
  const yawAuthority = state.onGround ? Math.max(authority, 0.4) : authority;

  // Sideslip for the weathervane (yaw) stability term.
  _invQuat.copy(state.orientation).invert();
  _localVel.copy(state.velocity).applyQuaternion(_invQuat);
  const sideslip = Math.abs(airspeed) > 1e-3 ? Math.atan2(_localVel.x, -_localVel.z) : 0;

  // Commanded body rates (see constants.ts for axis sign conventions):
  //   +x = pitch up, +y = yaw left, +z = roll left.
  const targetPitch = input.pitch * MAX_PITCH_RATE * authority - AERO_STABILITY * aoa * authority;
  const targetYaw =
    -input.yaw * MAX_YAW_RATE * yawAuthority - AERO_STABILITY * sideslip * authority;
  const targetRoll = -input.roll * MAX_ROLL_RATE * authority;

  // First-order response toward the commanded rates.
  state.angularVelocity.x = damp(state.angularVelocity.x, targetPitch, CONTROL_RESPONSIVENESS, dt);
  state.angularVelocity.y = damp(state.angularVelocity.y, targetYaw, CONTROL_RESPONSIVENESS, dt);
  state.angularVelocity.z = damp(state.angularVelocity.z, targetRoll, CONTROL_RESPONSIVENESS, dt);

  // Apply the body-frame angular velocity to the orientation.
  _omega.copy(state.angularVelocity);
  const omegaMag = _omega.length();
  if (omegaMag > 1e-6) {
    _omega.multiplyScalar(1 / omegaMag);
    _deltaQuat.setFromAxisAngle(_omega, omegaMag * dt);
    state.orientation.multiply(_deltaQuat).normalize();
  }
}

/** Resolve ground contact: crashes, wheel snapping, friction and lateral grip. */
function handleGround(state: AircraftState, dt: number): void {
  const restY = GROUND_LEVEL + GEAR_HEIGHT;
  const airborne = state.position.y > restY + 1e-3;

  if (airborne) {
    state.onGround = false;
    return;
  }

  const descentRate = -state.velocity.y;
  const { pitch, roll } = attitudeFromQuaternion(state.orientation);

  // Hard landing or wing-strike on first contact => crash.
  if (
    !state.onGround &&
    (descentRate > CRASH_VSPEED ||
      Math.abs(roll) > CRASH_ATTITUDE ||
      Math.abs(pitch) > CRASH_ATTITUDE)
  ) {
    state.crashed = true;
    state.velocity.multiplyScalar(0.1);
    return;
  }

  // Snap to the runway and clear downward velocity.
  state.position.y = restY;
  if (state.velocity.y < 0) state.velocity.y = 0;
  state.onGround = true;

  // Rolling resistance along the forward direction.
  _horizVel.set(state.velocity.x, 0, state.velocity.z);
  const groundSpeed = _horizVel.length();
  if (groundSpeed > 1e-3) {
    const decel = Math.min(GROUND_FRICTION * dt, groundSpeed);
    _horizVel.multiplyScalar((groundSpeed - decel) / groundSpeed);
  }

  // Lateral grip: bleed off sideways skidding so the aircraft tracks straight.
  _forward.copy(BODY_FORWARD).applyQuaternion(state.orientation);
  _forward.y = 0;
  if (_forward.lengthSq() > 1e-6) {
    _forward.normalize();
    const forwardSpeed = _horizVel.dot(_forward);
    _velDir.copy(_forward).multiplyScalar(forwardSpeed); // forward component
    _localVel.copy(_horizVel).sub(_velDir); // lateral component
    const gripFactor = Math.exp(-GROUND_LATERAL_GRIP * dt);
    _localVel.multiplyScalar(gripFactor);
    _horizVel.copy(_velDir).add(_localVel);
  }

  state.velocity.x = _horizVel.x;
  state.velocity.z = _horizVel.z;
}

/** Extract pitch, roll and heading (rad) from an orientation quaternion. */
export function attitudeFromQuaternion(orientation: Quaternion): {
  pitch: number;
  roll: number;
  heading: number;
} {
  _forward.copy(BODY_FORWARD).applyQuaternion(orientation);
  _right.copy(BODY_RIGHT).applyQuaternion(orientation);

  const pitch = Math.asin(clamp(_forward.y, -1, 1));
  const roll = -Math.asin(clamp(_right.y, -1, 1));
  const heading = Math.atan2(_forward.x, -_forward.z);
  return { pitch, roll, heading };
}

/** Populate a Telemetry object from the current aircraft state (no allocation). */
export function deriveTelemetry(state: AircraftState, out: Telemetry): void {
  const airspeed = state.velocity.length();
  const aoa = computeAngleOfAttack(state.velocity, state.orientation);
  const { pitch, roll, heading } = attitudeFromQuaternion(state.orientation);

  out.airspeed = airspeed;
  out.altitude = state.position.y - GEAR_HEIGHT;
  out.heading = wrapHeading((heading * 180) / Math.PI);
  out.verticalSpeed = state.velocity.y;
  out.throttle = state.throttle;
  out.roll = roll;
  out.pitch = pitch;
  out.angleOfAttack = aoa;
  out.stalled = !state.onGround && isStalled(aoa) && airspeed > 1;
  out.onGround = state.onGround;
  out.crashed = state.crashed;
  out.groundSpeed = Math.hypot(state.velocity.x, state.velocity.z);
}

/** Allocate a zeroed Telemetry object. */
export function createTelemetry(): Telemetry {
  return {
    airspeed: 0,
    altitude: 0,
    heading: 0,
    verticalSpeed: 0,
    throttle: 0,
    roll: 0,
    pitch: 0,
    angleOfAttack: 0,
    stalled: false,
    onGround: true,
    crashed: false,
    groundSpeed: 0,
  };
}
