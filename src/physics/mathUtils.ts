/**
 * Small, pure, dependency-free math helpers used by the flight model and HUD.
 * Keeping them isolated makes them trivial to unit test.
 */

/** Clamp `value` into the inclusive range [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/** Linear interpolation between `a` and `b` by `t` (t is not clamped). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Frame-rate independent exponential smoothing toward `target`.
 * `rate` is the responsiveness (1/s); `dt` the timestep (s).
 * Returns a value that converges to `target` regardless of frame timing.
 */
export function damp(current: number, target: number, rate: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-rate * dt));
}

/** Convert radians to degrees. */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** Convert degrees to radians. */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Wrap an angle in degrees into the range [0, 360). */
export function wrapHeading(deg: number): number {
  const wrapped = deg % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

/**
 * Compass bearing in degrees [0, 360) of a horizontal direction vector (dx, dz),
 * matching the sim's heading convention where 0° faces −Z (north) and bearing
 * increases clockwise (turning right / toward +X / east).
 */
export function bearingDegrees(dx: number, dz: number): number {
  if (dx === 0 && dz === 0) return 0;
  return wrapHeading((Math.atan2(dx, -dz) * 180) / Math.PI);
}

/**
 * Shortest signed turn (degrees) to get from heading `from` to heading `to`,
 * in the range [-180, 180]. Negative means turn left, positive means turn right.
 */
export function signedHeadingDelta(from: number, to: number): number {
  let d = (to - from) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

/** Map `value` from [inMin, inMax] to [outMin, outMax] (no clamping). */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (inMax === inMin) return outMin;
  return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);
}

/**
 * Apply a symmetric dead-zone to a normalised axis value in [-1, 1].
 * Values whose magnitude is below `threshold` return 0; the remaining range is
 * rescaled so the output still reaches ±1. Used to ignore stick/joystick drift.
 */
export function applyDeadzone(value: number, threshold: number): number {
  const magnitude = Math.abs(value);
  if (magnitude < threshold) return 0;
  const sign = value < 0 ? -1 : 1;
  return sign * ((magnitude - threshold) / (1 - threshold));
}
