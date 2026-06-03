import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { AircraftModel } from './AircraftModel';
import { useSimulation } from './SimulationContext';
import { readControlInput } from '../input/inputState';
import { useStore } from '../state/store';
import { recordFrame } from './perf';

// Chase-camera tuning.
const CAM_DISTANCE = 20; // metres behind the aircraft
const CAM_HEIGHT = 7; // metres above the aircraft
const CAM_LOOK_AHEAD = 12; // metres ahead of the aircraft to aim at
const CAM_SMOOTH = 6; // follow responsiveness (1/s)

// Module-scoped scratch vectors (single FlightRig instance → safe to reuse).
const _horizForward = new Vector3();
const _desiredCamPos = new Vector3();
const _lookTarget = new Vector3();
const _worldUp = new Vector3(0, 1, 0);
const _forward = new Vector3();
const BODY_FORWARD = new Vector3(0, 0, -1);

/**
 * Drives the simulation and applies its state to the aircraft mesh and chase
 * camera every frame. This is the single bridge between the physics world and
 * the Three.js scene; it performs zero React state updates.
 */
export function FlightRig(): JSX.Element {
  const { simulation } = useSimulation();
  const groupRef = useRef<Group>(null);
  const camInitialised = useRef(false);

  useFrame((threeState, delta) => {
    recordFrame(delta);

    const { started, paused } = useStore.getState();
    const running = started && !paused && !simulation.state.crashed;

    if (running) {
      simulation.update(delta, readControlInput());
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
    if (_horizForward.lengthSq() < 1e-4) {
      _horizForward.set(0, 0, -1); // looking straight up/down: keep previous heading-ish
    }
    _horizForward.normalize();

    _desiredCamPos
      .copy(position)
      .addScaledVector(_horizForward, -CAM_DISTANCE)
      .addScaledVector(_worldUp, CAM_HEIGHT);

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
      .addScaledVector(_horizForward, CAM_LOOK_AHEAD)
      .addScaledVector(_worldUp, 1.5);
    camera.lookAt(_lookTarget);
  });

  return (
    <group ref={groupRef}>
      <AircraftModel />
    </group>
  );
}
