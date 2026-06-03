/**
 * Centralised, named simulation constants.
 *
 * Every "magic number" used by the flight model, world and rendering lives here
 * with a comment describing its meaning and unit. Values are tuned for a light
 * general-aviation style aircraft and prioritise *fun and stability* over strict
 * realism, while still producing believable lift/drag/stall behaviour.
 *
 * Unit conventions (SI unless noted):
 *   - distance: metres (m)
 *   - speed:    metres / second (m/s)
 *   - angle:    radians (rad)
 *   - mass:     kilograms (kg)
 *   - time:     seconds (s)
 */

/** Standard gravitational acceleration (m/s^2). */
export const GRAVITY = 9.81;

/** Air density at low altitude (kg/m^3). Treated as constant for simplicity. */
export const AIR_DENSITY = 1.225;

/** Aircraft mass (kg) — roughly a two-seat trainer. */
export const AIRCRAFT_MASS = 1100;

/** Reference wing area (m^2). */
export const WING_AREA = 16.2;

/** Lift-curve slope: change in lift coefficient per radian of angle of attack. */
export const LIFT_SLOPE = 5.5;

/** Critical angle of attack (rad) beyond which the wing stalls (~15°). */
export const STALL_ANGLE = 0.26;

/**
 * Fraction of lift retained once fully stalled. The wing never produces zero
 * lift in reality, and keeping a floor avoids a brick-like fall that is no fun.
 */
export const STALL_LIFT_FLOOR = 0.35;

/** Parasitic (zero-lift) drag coefficient. */
export const DRAG_COEFF_BASE = 0.027;

/** Induced-drag factor (k in Cd = Cd0 + k * Cl^2). */
export const INDUCED_DRAG_FACTOR = 0.05;

/** Maximum engine thrust at full throttle (N). */
export const MAX_THRUST = 5200;

/** Throttle change rate (fraction per second) when holding throttle keys. */
export const THROTTLE_RATE = 0.6;

/**
 * Maximum commanded body-axis angular rates at full control deflection (rad/s).
 * These are the "feel" of the aircraft and the main thing to tune for handling.
 */
export const MAX_PITCH_RATE = 1.1;
export const MAX_ROLL_RATE = 2.4;
export const MAX_YAW_RATE = 0.7;

/**
 * How quickly the actual body rate chases the commanded rate (1/s). Higher feels
 * snappier; lower feels heavier. Acts as a simple first-order control response.
 */
export const CONTROL_RESPONSIVENESS = 6.0;

/**
 * Airspeed (m/s) at and above which control surfaces are fully effective. Below
 * this, authority scales down so the aircraft feels mushy at low speed / stall.
 */
export const CONTROL_AUTHORITY_SPEED = 35;

/** Aerodynamic angular damping (1/s) — bleeds off rotation when uncommanded. */
export const ANGULAR_DAMPING = 1.6;

/**
 * Weathervane / pitch stability factor. Gently rotates the nose toward the
 * velocity vector, mimicking static stability and preventing endless tumbling.
 */
export const AERO_STABILITY = 0.9;

// ---------------------------------------------------------------------------
// Ground & world
// ---------------------------------------------------------------------------

/** Ground / sea level (m). The world plane sits at y = 0. */
export const GROUND_LEVEL = 0;

/** Height of the wheels below the aircraft origin (m) — the resting altitude. */
export const GEAR_HEIGHT = 1.4;

/** Rolling friction deceleration on the ground (m/s^2). */
export const GROUND_FRICTION = 1.4;

/** Sideways grip on the ground (1/s) — kills lateral drift so the plane tracks. */
export const GROUND_LATERAL_GRIP = 3.0;

/** Vertical descent rate above which a ground contact counts as a crash (m/s). */
export const CRASH_VSPEED = 7.5;

/** Bank/pitch angle beyond which a ground contact counts as a crash (rad ~35°). */
export const CRASH_ATTITUDE = 0.61;

/** Half-size of the playable world (m). Beyond this the aircraft is out of bounds. */
export const WORLD_HALF_SIZE = 9000;

/** Maximum altitude before the air is "too thin" and the sim flags out-of-bounds (m). */
export const CEILING = 6000;

/** Runway dimensions (m). */
export const RUNWAY_LENGTH = 1400;
export const RUNWAY_WIDTH = 45;

// ---------------------------------------------------------------------------
// Simulation loop
// ---------------------------------------------------------------------------

/** Fixed physics timestep (s). Physics integrates at a constant 120 Hz. */
export const FIXED_DT = 1 / 120;

/** Clamp for the per-frame delta (s) to survive tab-switch / GC stalls. */
export const MAX_FRAME_DT = 0.1;

/** Maximum physics sub-steps per frame, preventing a spiral-of-death. */
export const MAX_SUBSTEPS = 8;

// ---------------------------------------------------------------------------
// Unit conversions (for HUD display only — the sim stays in SI)
// ---------------------------------------------------------------------------

export const MS_TO_KNOTS = 1.94384;
export const M_TO_FEET = 3.28084;
/** metres/second to feet/minute */
export const MS_TO_FPM = 196.85;
