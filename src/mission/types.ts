import type { AircraftState, Telemetry } from '../core/types';

/** Ordered phases of the guided beginner flight. */
export type MissionPhaseId =
  | 'preflight'
  | 'taxi'
  | 'lineup'
  | 'takeoff'
  | 'climb'
  | 'waypoint'
  | 'return'
  | 'approach'
  | 'land'
  | 'complete';

/** What kind of 3D marker the scene should emphasise for the active target. */
export type MissionTargetKind = 'taxi' | 'runway' | 'waypoint' | 'approach' | 'none';

/** A guidance target the HUD points its heading bug at and the scene marks. */
export interface MissionTarget {
  /** World position on the ground plane (metres). */
  x: number;
  z: number;
  kind: MissionTargetKind;
}

/** Read-only snapshot the pure phase predicates evaluate each tick. */
export interface MissionSnapshot {
  telemetry: Telemetry;
  state: AircraftState;
  /** Brake input [0, 1] so the pre-flight check can confirm "brakes set". */
  brake: number;
}

/** A single measurable readout for the objective panel (e.g. "ALT 620 ft"). */
export interface MissionMetric {
  label: string;
  value: string;
}

/** The dynamic result of evaluating a phase against a snapshot. */
export interface PhaseEvaluation {
  /** True once this phase's goal is met and the mission should advance. */
  done: boolean;
  /** Progress toward the goal in [0, 1], for the objective progress bar. */
  progress: number;
  /** Short contextual coaching hint (empty string for none). */
  hint: string;
  /** True when the hint is a warning (rendered in the warning colour). */
  warn: boolean;
  /** Optional measurable readout, or null. */
  metric: MissionMetric | null;
}

/** Static description of a mission phase plus its pure evaluation function. */
export interface MissionPhase {
  id: MissionPhaseId;
  /** Short title shown in the objective panel. */
  title: string;
  /** One- or two-line instruction shown under the title. */
  instruction: string;
  /** Guidance target for this phase, or null when there is none. */
  target: MissionTarget | null;
  /** Pure predicate deriving completion/progress/hint from a snapshot. */
  evaluate: (snapshot: MissionSnapshot) => PhaseEvaluation;
}

/**
 * Mutable, flat mission state sampled by the HUD via refs (never via React
 * re-renders), mirroring how the flight HUD samples telemetry.
 */
export interface MissionState {
  /** Zero-based index into the actionable phase list. */
  phaseIndex: number;
  phaseId: MissionPhaseId;
  /** Number of actionable steps (excludes the terminal "complete" phase). */
  totalSteps: number;
  title: string;
  instruction: string;
  hint: string;
  warn: boolean;
  /** Progress through the current phase in [0, 1]. */
  progress: number;
  metricLabel: string;
  metricValue: string;
  /** True when there is a directional target to point the heading bug at. */
  hasTarget: boolean;
  targetKind: MissionTargetKind;
  /** Signed bearing to the target relative to the nose, degrees [-180, 180]. */
  relativeBearing: number;
  /** Distance to the target (metres). */
  distance: number;
  /** True once the whole mission is finished. */
  complete: boolean;
}
