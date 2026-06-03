import type { AircraftState, ControlInput, Telemetry } from '../core/types';
import {
  CEILING,
  FIXED_DT,
  GEAR_HEIGHT,
  GROUND_LEVEL,
  MAX_FRAME_DT,
  MAX_SUBSTEPS,
  WORLD_HALF_SIZE,
} from '../config/constants';
import {
  createInitialAircraftState,
  createTelemetry,
  deriveTelemetry,
  stepAircraft,
} from './flightModel';

/**
 * Owns the authoritative aircraft state and advances it with a fixed-timestep
 * accumulator so physics is deterministic and frame-rate independent.
 *
 * This class has *no* rendering or React dependencies, which keeps the
 * simulation testable and lets the renderer simply read the resulting state.
 */
export class Simulation {
  readonly state: AircraftState;
  readonly telemetry: Telemetry;

  private accumulator = 0;
  /** Counts the number of out-of-bounds auto-recoveries (surfaced for tests/UX). */
  outOfBoundsEvents = 0;

  constructor() {
    this.state = createInitialAircraftState();
    this.telemetry = createTelemetry();
    deriveTelemetry(this.state, this.telemetry);
  }

  /** Reset the aircraft to the runway and clear all motion. */
  reset(): void {
    const fresh = createInitialAircraftState();
    this.state.position.copy(fresh.position);
    this.state.velocity.copy(fresh.velocity);
    this.state.orientation.copy(fresh.orientation);
    this.state.angularVelocity.copy(fresh.angularVelocity);
    this.state.throttle = 0;
    this.state.onGround = true;
    this.state.crashed = false;
    this.accumulator = 0;
    this.outOfBoundsEvents = 0;
    deriveTelemetry(this.state, this.telemetry);
  }

  /**
   * Advance the simulation by a wall-clock `frameDt` using fixed sub-steps.
   * The leftover time is carried in the accumulator for the next frame.
   */
  update(frameDt: number, input: ControlInput): void {
    // Guard against huge deltas after tab switches / GC pauses.
    const clamped = Math.min(frameDt, MAX_FRAME_DT);
    this.accumulator += clamped;

    let steps = 0;
    while (this.accumulator >= FIXED_DT && steps < MAX_SUBSTEPS) {
      stepAircraft(this.state, input, FIXED_DT);
      this.enforceBounds();
      this.accumulator -= FIXED_DT;
      steps += 1;
    }

    // If we hit the sub-step cap, drop the backlog to avoid a spiral of death.
    if (steps >= MAX_SUBSTEPS) {
      this.accumulator = 0;
    }

    deriveTelemetry(this.state, this.telemetry);
  }

  /** Soft world boundary: gently arrest the aircraft instead of letting it escape. */
  private enforceBounds(): void {
    const p = this.state.position;
    let recovered = false;

    if (p.x > WORLD_HALF_SIZE) {
      p.x = WORLD_HALF_SIZE;
      if (this.state.velocity.x > 0) this.state.velocity.x = 0;
      recovered = true;
    } else if (p.x < -WORLD_HALF_SIZE) {
      p.x = -WORLD_HALF_SIZE;
      if (this.state.velocity.x < 0) this.state.velocity.x = 0;
      recovered = true;
    }

    if (p.z > WORLD_HALF_SIZE) {
      p.z = WORLD_HALF_SIZE;
      if (this.state.velocity.z > 0) this.state.velocity.z = 0;
      recovered = true;
    } else if (p.z < -WORLD_HALF_SIZE) {
      p.z = -WORLD_HALF_SIZE;
      if (this.state.velocity.z < 0) this.state.velocity.z = 0;
      recovered = true;
    }

    // Ceiling: the air gets "too thin"; cap altitude and arrest the climb.
    const maxY = GROUND_LEVEL + GEAR_HEIGHT + CEILING;
    if (p.y > maxY) {
      p.y = maxY;
      if (this.state.velocity.y > 0) this.state.velocity.y = 0;
      recovered = true;
    }

    if (recovered) this.outOfBoundsEvents += 1;
  }
}
