import { useMemo } from 'react';
import type { AirlinerShape, Livery } from './types';

interface Props {
  shape: AirlinerShape;
  livery: Livery;
}

/** One swept half-wing (also reused for horizontal stabilisers), with a winglet. */
function HalfWing({
  side,
  span,
  chord,
  thickness,
  sweep,
  dihedral,
  color,
}: {
  side: 1 | -1;
  span: number;
  chord: number;
  thickness: number;
  sweep: number;
  dihedral: number;
  color: string;
}): JSX.Element {
  const half = span / 2;
  return (
    <group rotation={[0, side === 1 ? -sweep : sweep, 0]}>
      <group rotation={[0, 0, side === 1 ? dihedral : -dihedral]}>
        <mesh castShadow position={[(side * half) / 2, 0, 0]}>
          <boxGeometry args={[half, thickness, chord]} />
          <meshStandardMaterial color={color} metalness={0.45} roughness={0.45} />
        </mesh>
        {/* Winglet */}
        <mesh castShadow position={[side * half, thickness * 2, chord * 0.12]}>
          <boxGeometry args={[thickness * 1.4, thickness * 6, chord * 0.5]} />
          <meshStandardMaterial color={color} metalness={0.45} roughness={0.45} />
        </mesh>
      </group>
    </group>
  );
}

/** An underwing turbofan nacelle on a short pylon. */
function Engine({
  x,
  y,
  z,
  radius,
  length,
  color,
}: {
  x: number;
  y: number;
  z: number;
  radius: number;
  length: number;
  color: string;
}): JSX.Element {
  return (
    <group position={[x, y, z]}>
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius * 0.92, length, 18]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.32} />
      </mesh>
      {/* Dark intake lip */}
      <mesh position={[0, 0, -length * 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.96, radius * 0.12, 10, 22]} />
        <meshStandardMaterial color="#1b1f24" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* Pylon to the wing */}
      <mesh position={[0, radius * 0.9, length * 0.12]}>
        <boxGeometry args={[radius * 0.32, radius * 1.4, length * 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.45} />
      </mesh>
    </group>
  );
}

/**
 * A stylised airliner assembled from primitive geometry (no external assets):
 * a tapered tube fuselage with nose/tail cones, swept wings with winglets and
 * turbofans, a swept tail, a window line and a painted cheatline + tail. The
 * model faces -Z, matching the flight model's body-frame "forward".
 */
export function ProceduralAirliner({ shape, livery }: Props): JSX.Element {
  const {
    fuselageLength: L,
    fuselageRadius: R,
    noseLength,
    tailLength,
    tailUpsweep,
    wingspan,
    wingChord,
    wingSweep,
    wingDihedral,
    wingZ,
    engineCount,
    engineRadius,
    engineLength,
    finHeight,
    stabSpan,
    upperDeckHump,
  } = shape;

  const halfSpan = wingspan / 2;
  const wingThickness = Math.max(0.12, R * 0.16);

  // Engine span fractions and the world x of each nacelle.
  const engineXs = useMemo(() => {
    const fracs = engineCount === 2 ? [0.34] : [0.22, 0.44];
    const xs: number[] = [];
    for (const f of fracs) {
      xs.push(f * halfSpan, -f * halfSpan);
    }
    return xs;
  }, [engineCount, halfSpan]);

  const bodyMat = { color: livery.fuselage, metalness: 0.62, roughness: 0.34 } as const;
  const engineY = -R * 0.35 - engineRadius * 0.4;
  const engineZ = wingZ - wingChord * 0.35;

  return (
    <group name="airliner">
      {/* Fuselage */}
      <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[R * 0.86, R, L, 22]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>

      {/* Nose cone */}
      <mesh
        castShadow
        position={[0, 0, -L / 2 - noseLength / 2 + 0.25]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <coneGeometry args={[R, noseLength, 22]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>

      {/* Tail cone (upswept) */}
      <mesh
        castShadow
        position={[0, tailUpsweep * tailLength * 0.55, L / 2 + tailLength / 2 - 0.3]}
        rotation={[Math.PI / 2 - tailUpsweep, 0, 0]}
      >
        <coneGeometry args={[R * 0.82, tailLength, 22]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>

      {/* Optional upper-deck hump */}
      {upperDeckHump && (
        <mesh castShadow position={[0, R * 0.5, -L * 0.16]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[R * 0.5, R * 0.66, L * 0.4, 18]} />
          <meshStandardMaterial {...bodyMat} />
        </mesh>
      )}

      {/* Window line + cheatline along both sides */}
      {[1, -1].map((s) => (
        <group key={s}>
          <mesh position={[s * R * 0.92, R * 0.28, 0.2]}>
            <boxGeometry args={[0.04, R * 0.22, L * 0.74]} />
            <meshStandardMaterial color="#10151c" metalness={0.2} roughness={0.5} />
          </mesh>
          <mesh position={[s * R * 0.95, R * 0.06, 0.2]}>
            <boxGeometry args={[0.04, R * 0.16, L * 0.8]} />
            <meshStandardMaterial color={livery.cheatline} metalness={0.3} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Cockpit windows */}
      <mesh position={[0, R * 0.45, -L / 2 - noseLength * 0.4]} rotation={[-0.5, 0, 0]}>
        <boxGeometry args={[R * 1.1, R * 0.34, 0.1]} />
        <meshStandardMaterial color="#0e1b28" metalness={0.4} roughness={0.18} />
      </mesh>

      {/* Main wings */}
      <group position={[0, -R * 0.1, wingZ]}>
        <HalfWing
          side={1}
          span={wingspan}
          chord={wingChord}
          thickness={wingThickness}
          sweep={wingSweep}
          dihedral={wingDihedral}
          color={livery.wing}
        />
        <HalfWing
          side={-1}
          span={wingspan}
          chord={wingChord}
          thickness={wingThickness}
          sweep={wingSweep}
          dihedral={wingDihedral}
          color={livery.wing}
        />
      </group>

      {/* Engines */}
      {engineXs.map((x, i) => (
        <Engine
          key={i}
          x={x}
          y={engineY}
          z={engineZ}
          radius={engineRadius}
          length={engineLength}
          color={livery.engine}
        />
      ))}

      {/* Horizontal stabilisers */}
      <group position={[0, R * 0.25, L / 2 + tailLength * 0.2]}>
        <HalfWing
          side={1}
          span={stabSpan}
          chord={wingChord * 0.6}
          thickness={wingThickness * 0.7}
          sweep={wingSweep + 0.05}
          dihedral={0.05}
          color={livery.tail}
        />
        <HalfWing
          side={-1}
          span={stabSpan}
          chord={wingChord * 0.6}
          thickness={wingThickness * 0.7}
          sweep={wingSweep + 0.05}
          dihedral={0.05}
          color={livery.tail}
        />
      </group>

      {/* Vertical tail fin (swept) */}
      <mesh
        castShadow
        position={[0, R * 0.6 + finHeight / 2, L / 2 + tailLength * 0.05]}
        rotation={[0.5, 0, 0]}
      >
        <boxGeometry args={[wingThickness * 0.9, finHeight, wingChord * 0.95]} />
        <meshStandardMaterial color={livery.tail} metalness={0.45} roughness={0.42} />
      </mesh>

      {/* Wing-root belly fairing */}
      <mesh castShadow position={[0, -R * 0.5, wingZ]}>
        <boxGeometry args={[R * 1.6, R * 0.7, wingChord * 2.1]} />
        <meshStandardMaterial color={livery.belly} metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  );
}
