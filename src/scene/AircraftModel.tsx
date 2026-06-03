import { forwardRef } from 'react';
import type { Group } from 'three';

/**
 * A lightweight procedurally-built aircraft, assembled from primitive meshes so
 * the app ships with no external model assets. The mesh is oriented to face -Z
 * (its "forward"), matching the body-frame convention used by the flight model.
 */
export const AircraftModel = forwardRef<Group>(function AircraftModel(_props, ref) {
  return (
    <group ref={ref} name="aircraft">
      {/* Fuselage */}
      <mesh castShadow position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.55, 0.42, 6.4, 12]} />
        <meshStandardMaterial color="#e8eef5" metalness={0.3} roughness={0.55} />
      </mesh>

      {/* Nose cone */}
      <mesh castShadow position={[0, 0, -3.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.55, 1.4, 12]} />
        <meshStandardMaterial color="#cdd8e4" metalness={0.3} roughness={0.5} />
      </mesh>

      {/* Spinner / prop hub */}
      <mesh position={[0, 0, -4.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.18, 0.4, 8]} />
        <meshStandardMaterial color="#2a2f36" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Main wing */}
      <mesh castShadow position={[0, 0.1, -0.3]}>
        <boxGeometry args={[11, 0.18, 1.7]} />
        <meshStandardMaterial color="#d23b3b" metalness={0.2} roughness={0.6} />
      </mesh>

      {/* Wing stripe accents */}
      <mesh position={[0, 0.2, -0.3]}>
        <boxGeometry args={[11.02, 0.04, 0.4]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Horizontal stabiliser */}
      <mesh castShadow position={[0, 0.15, 3]}>
        <boxGeometry args={[4, 0.14, 1]} />
        <meshStandardMaterial color="#d23b3b" metalness={0.2} roughness={0.6} />
      </mesh>

      {/* Vertical stabiliser (tail fin) */}
      <mesh castShadow position={[0, 0.8, 3.1]}>
        <boxGeometry args={[0.14, 1.4, 1.1]} />
        <meshStandardMaterial color="#d23b3b" metalness={0.2} roughness={0.6} />
      </mesh>

      {/* Canopy */}
      <mesh position={[0, 0.5, -1]} rotation={[Math.PI / 2, 0, 0]}>
        <sphereGeometry args={[0.5, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#36506b"
          metalness={0.1}
          roughness={0.15}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* Landing gear (simple struts) */}
      <mesh position={[-1.4, -0.7, -0.3]}>
        <cylinderGeometry args={[0.07, 0.07, 1.0, 6]} />
        <meshStandardMaterial color="#23282e" />
      </mesh>
      <mesh position={[1.4, -0.7, -0.3]}>
        <cylinderGeometry args={[0.07, 0.07, 1.0, 6]} />
        <meshStandardMaterial color="#23282e" />
      </mesh>
      <mesh position={[0, -0.6, 2.6]}>
        <cylinderGeometry args={[0.06, 0.06, 0.8, 6]} />
        <meshStandardMaterial color="#23282e" />
      </mesh>
    </group>
  );
});
