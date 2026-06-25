import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { AircraftModel } from './AircraftModel';
import { getAircraftDef } from './aircraft/fleet';
import { useSimulation } from './SimulationContext';
import { getBrake, readControlInput } from '../input/inputState';
import { useStore } from '../state/store';
import { recordFrame } from './perf';

// Chase-camera follow responsiveness (1/s). Distance/height/look-ahead are
// per-aircraft (a jumbo needs a wider framing than a narrow-body).
const CAM_SMOOTH = 6;

// Module-scoped scratch vectors (single FlightRig instance → safe to reuse).
const _horizForward = new Vector3();
const _desiredCamPos = new Vector3();
const _lookTarget = new Vector3();
const _worldUp = new Vector3(0, 1, 0);
const _forward = new Vector3();
// Last valid horizontal heading, retained so the camera doesn't snap when the
// aircraft points straight up/down (e.g. mid-loop) and horizForward collapses.
const _lastHorizForward = new Vector3(0, 0, -1);
const BODY_FORWARD = new Vector3(0, 0, -1);

/**
 * Drives the simulation and applies its state to the aircraft mesh and chase
 * camera every frame. This is the single bridge between the physics world and
 * the Three.js scene; it performs zero React state updates.
 */
export function FlightRig(): JSX.Element {
  const { simulation, director } = useSimulation();
  const groupRef = useRef<Group>(null);
  const camInitialised = useRef(false);

  useFrame((threeState, delta) => {
    recordFrame(delta);

    const { started, paused, mode, settings } = useStore.getState();
    const cam = getAircraftDef(settings.aircraftId).camera;
    const guided = mode === 'guided';
    const missionComplete = guided && director.state.complete;
    const running = started && !paused && !simulation.state.crashed && !missionComplete;

    if (running) {
      simulation.update(delta, readControlInput());
      if (guided) {
        director.update({
          telemetry: simulation.telemetry,
          state: simulation.state,
          brake: getBrake(),
        });
      }
    }

    const group = groupRef.current;
    const { position, orientation } = simulation.state;
    if (group) {
      group.position.copy(position);
      group.quaternion.copy(orientation);
    }

    // --- Stable chase camera ------------------------------------------------
    // Follow the aircraft's heading (horizontal forward) rather than its full
    // orientation, so loops and rolls don't make the camera tumble.
    _forward.copy(BODY_FORWARD).applyQuaternion(orientation);
    _horizForward.set(_forward.x, 0, _forward.z);
    if (_horizForward.lengthSq() < 1e-3) {
      // Pointing near-vertical: keep the last good heading to avoid a snap.
      _horizForward.copy(_lastHorizForward);
    } else {
      _horizForward.normalize();
      _lastHorizForward.copy(_horizForward);
    }

    _desiredCamPos
      .copy(position)
      .addScaledVector(_horizForward, -cam.distance)
      .addScaledVector(_worldUp, cam.height);

    const camera = threeState.camera;
    if (!camInitialised.current) {
      camera.position.copy(_desiredCamPos);
      camInitialised.current = true;
    } else {
      const t = 1 - Math.exp(-CAM_SMOOTH * Math.min(delta, 0.1));
      camera.position.lerp(_desiredCamPos, t);
    }

    _lookTarget
      .copy(position)
      .addScaledVector(_horizForward, cam.lookAhead)
      .addScaledVector(_worldUp, 1.5);
    camera.lookAt(_lookTarget);
  });

  return (
    <group ref={groupRef}>
      <AircraftModel />
    </group>
  );
}
