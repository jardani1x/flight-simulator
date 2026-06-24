import { bearingDegrees, signedHeadingDelta } from '../physics/mathUtils';
import { MISSION_PHASES, TOTAL_STEPS } from './missionPlan';
import type { MissionPhase, MissionSnapshot, MissionState } from './types';

/** Build a fresh, zeroed mission state object. */
function createMissionState(): MissionState {
  return {
    phaseIndex: 0,
    phaseId: 'preflight',
    totalSteps: TOTAL_STEPS,
    title: '',
    instruction: '',
    hint: '',
    warn: false,
    progress: 0,
    metricLabel: '',
    metricValue: '',
    hasTarget: false,
    targetKind: 'none',
    relativeBearing: 0,
    distance: 0,
    complete: false,
  };
}

/**
 * Drives the guided-flight plan: holds the authoritative mission state and
 * advances through the phases as their pure predicates complete. Like the
 * physics {@link Simulation}, this has no React or rendering dependencies — the
 * HUD samples the mutable {@link MissionState} via refs and the scene reads the
 * active phase, so advancing a phase never triggers a React re-render.
 */
export class FlightDirector {
  readonly state: MissionState;
  private phaseIndex = 0;

  constructor(private readonly phases: MissionPhase[] = MISSION_PHASES) {
    this.state = createMissionState();
    this.applyPhaseDescriptor();
  }

  /** Restart the mission at the first phase. */
  reset(): void {
    this.phaseIndex = 0;
    const fresh = createMissionState();
    Object.assign(this.state, fresh);
    this.applyPhaseDescriptor();
  }

  private get currentPhase(): MissionPhase {
    return this.phases[this.phaseIndex]!;
  }

  /** Copy the static parts of the active phase into the mutable state. */
  private applyPhaseDescriptor(): void {
    const phase = this.currentPhase;
    this.state.phaseIndex = this.phaseIndex;
    this.state.phaseId = phase.id;
    this.state.title = phase.title;
    this.state.instruction = phase.instruction;
    this.state.complete = phase.id === 'complete';
  }

  /**
   * Evaluate the current phase against a snapshot, update the live state, and
   * advance to the next phase when the goal is met. Safe to call every frame.
   */
  update(snapshot: MissionSnapshot): void {
    if (this.state.complete) return;

    const phase = this.currentPhase;
    const result = phase.evaluate(snapshot);

    this.state.progress = result.progress;
    this.state.hint = result.hint;
    this.state.warn = result.warn;
    this.state.metricLabel = result.metric?.label ?? '';
    this.state.metricValue = result.metric?.value ?? '';

    // Directional guidance for the HUD heading bug / scene marker.
    const target = phase.target;
    if (target) {
      const dx = target.x - snapshot.state.position.x;
      const dz = target.z - snapshot.state.position.z;
      this.state.distance = Math.hypot(dx, dz);
      this.state.relativeBearing = signedHeadingDelta(
        snapshot.telemetry.heading,
        bearingDegrees(dx, dz),
      );
      this.state.hasTarget = target.kind !== 'none';
      this.state.targetKind = target.kind;
    } else {
      this.state.hasTarget = false;
      this.state.targetKind = 'none';
      this.state.distance = 0;
      this.state.relativeBearing = 0;
    }

    if (result.done && this.phaseIndex < this.phases.length - 1) {
      this.phaseIndex += 1;
      this.applyPhaseDescriptor();
    }
  }
}
