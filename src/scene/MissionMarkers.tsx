import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh, MeshStandardMaterial } from 'three';
import { NORTH_THRESHOLD_Z } from '../config/constants';
import { APPROACH_ENTRY, WAYPOINT } from '../mission/missionPlan';
import type { MissionPhaseId } from '../mission/types';
import { useSimulation } from './SimulationContext';

const CYAN = '#39d8ff';

/** Approach gates strung along the extended centreline, descending to the runway. */
const APPROACH_GATES = [
  { z: -1400, y: 170 },
  { z: -1100, y: 110 },
  { z: -800, y: 55 },
];

/** Set the emissive intensity of every standard material under a group. */
function setGlow(group: Group | null, intensity: number): void {
  if (!group) return;
  group.traverse((obj) => {
    const mesh = obj as Mesh;
    const mat = mesh.material as MeshStandardMaterial | undefined;
    if (mat && 'emissiveIntensity' in mat) mat.emissiveIntensity = intensity;
  });
}

/**
 * Glowing 3D guidance markers for the guided flight: a take-off aim beam at the
 * far threshold, an outbound waypoint pillar, and a string of approach gates.
 * The marker for the active phase pulses brightly; the others stay dim. Driven
 * entirely in the frame loop from the mission state, so it never re-renders.
 */
export function MissionMarkers(): JSX.Element {
  const { director } = useSimulation();
  const beamRef = useRef<Group>(null);
  const waypointRef = useRef<Group>(null);
  const gatesRef = useRef<Group>(null);

  useFrame((threeState) => {
    const phase: MissionPhaseId = director.state.phaseId;
    const t = threeState.clock.elapsedTime;
    const pulse = 0.7 + 0.5 * Math.sin(t * 3);
    const dim = 0.18;

    const beamActive = phase === 'lineup' || phase === 'takeoff' || phase === 'climb';
    const wpActive = phase === 'waypoint';
    const gatesActive = phase === 'return' || phase === 'approach' || phase === 'land';

    setGlow(beamRef.current, beamActive ? pulse : dim);
    setGlow(waypointRef.current, wpActive ? pulse : dim);
    setGlow(gatesRef.current, gatesActive ? pulse : dim);
  });

  return (
    <group>
      {/* Take-off aim beam at the far (north) threshold */}
      <group ref={beamRef} position={[0, 0, NORTH_THRESHOLD_Z]}>
        <mesh position={[0, 120, 0]}>
          <cylinderGeometry args={[2.5, 2.5, 240, 12]} />
          <meshStandardMaterial
            color="#7CFFB0"
            emissive="#7CFFB0"
            emissiveIntensity={0.4}
            transparent
            opacity={0.5}
          />
        </mesh>
      </group>

      {/* Outbound waypoint: a tall pillar ringed with hoops */}
      <group ref={waypointRef} position={[WAYPOINT.x, 0, WAYPOINT.z]}>
        <mesh position={[0, 180, 0]}>
          <cylinderGeometry args={[5, 5, 360, 14]} />
          <meshStandardMaterial
            color={CYAN}
            emissive={CYAN}
            emissiveIntensity={0.4}
            transparent
            opacity={0.45}
          />
        </mesh>
        {[80, 180, 280].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[42, 2.4, 8, 32]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.4} />
          </mesh>
        ))}
      </group>

      {/* Approach gates to fly through on final */}
      <group ref={gatesRef}>
        {APPROACH_GATES.map((g) => (
          <mesh key={g.z} position={[0, g.y, g.z]}>
            <torusGeometry args={[70, 3, 8, 36]} />
            <meshStandardMaterial color="#ffb84d" emissive="#ffb84d" emissiveIntensity={0.4} />
          </mesh>
        ))}
        {/* Vertical guide line down to the touchdown aim point */}
        <mesh position={[0, 90, APPROACH_ENTRY.z + 450]}>
          <cylinderGeometry args={[1.2, 1.2, 180, 8]} />
          <meshStandardMaterial
            color="#ffb84d"
            emissive="#ffb84d"
            emissiveIntensity={0.4}
            transparent
            opacity={0.4}
          />
        </mesh>
      </group>
    </group>
  );
}
