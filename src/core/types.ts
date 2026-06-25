import type { Quaternion, Vector3 } from 'three';

/**
 * Normalised control input shared across all input sources (keyboard, touch,
 * gamepad). Axes are in the range [-1, 1]; throttle is absolute in [0, 1].
 */
export interface ControlInput {
  /** Nose up (+1) / nose down (-1). */
  pitch: number;
  /** Roll right (+1) / roll left (-1). */
  roll: number;
  /** Yaw right (+1) / yaw left (-1). */
  yaw: number;
  /** Absolute throttle setting in [0, 1]. */
  throttle: number;
  /** Wheel brakes in [0, 1]; only effective on the ground. */
  brake: number;
}

/** Mutable physical state of the aircraft, integrated by the flight model. */
export interface AircraftState {
  position: Vector3;
  velocity: Vector3;
  orientation: Quaternion;
  /** Body-frame angular velocity (rad/s): x=pitch, y=yaw, z=roll. */
  angularVelocity: Vector3;
  throttle: number;
  /** True while the wheels are on the ground. */
  onGround: boolean;
  /** True once the aircraft has crashed; the sim freezes until reset. */
  crashed: boolean;
}

/**
 * Read-only telemetry derived from the aircraft state each frame and consumed by
 * the HUD. Kept as a flat mutable object so the HUD can sample it without
 * triggering React re-renders.
 */
export interface Telemetry {
  /** Indicated airspeed (m/s). */
  airspeed: number;
  /** Altitude above ground/sea level (m). */
  altitude: number;
  /** Compass heading in degrees [0, 360). */
  heading: number;
  /** Vertical speed (m/s); positive is climbing. */
  verticalSpeed: number;
  /** Throttle setting [0, 1]. */
  throttle: number;
  /** Bank (roll) angle in radians. */
  roll: number;
  /** Pitch angle in radians. */
  pitch: number;
  /** Angle of attack in radians. */
  angleOfAttack: number;
  /** True when the wing is stalled. */
  stalled: boolean;
  onGround: boolean;
  crashed: boolean;
  /** Ground speed over the horizontal plane (m/s). */
  groundSpeed: number;
  /** True when approaching the world edge or service ceiling. */
  boundaryWarning: boolean;
}

export type GraphicsQuality = 'low' | 'medium' | 'high';

export type DeviceClass = 'desktop' | 'tablet' | 'phone';
