import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, InstancedMesh, Object3D, PlaneGeometry } from 'three';
import {
  HOLD_SHORT_Z,
  LINEUP_Z,
  RUNWAY_LENGTH,
  RUNWAY_WIDTH,
  SOUTH_THRESHOLD_Z,
  SPAWN_Z,
  WORLD_HALF_SIZE,
} from '../config/constants';

/** Tiny deterministic PRNG (mulberry32) for stable scenery placement. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface TerrainProps {
  segments: number;
  landmarkCount: number;
}

/**
 * Ground terrain: gently rolling distant hills (kept flat near the runway), an
 * asphalt runway with centreline and threshold markings, and instanced trees as
 * depth-cue landmarks. All geometry is procedural — no external assets.
 */
export function Terrain({ segments, landmarkCount }: TerrainProps): JSX.Element {
  const groundGeometry = useMemo(() => {
    const size = WORLD_HALF_SIZE * 2;
    const geo = new PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    // Displace vertices for rolling hills, ramping amplitude up with distance so
    // the area around the runway stays flat and landable.
    const pos = geo.attributes.position;
    if (!pos) return geo;
    const flatRadius = 1200;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const dist = Math.hypot(x, z);
      const ramp = Math.min(1, Math.max(0, (dist - flatRadius) / 3000));
      const h =
        Math.sin(x * 0.0011) * Math.cos(z * 0.0013) * 60 + Math.sin(x * 0.0004 + z * 0.0005) * 120;
      pos.setY(i, h * ramp);
    }
    geo.computeVertexNormals();
    return geo;
  }, [segments]);

  const treesRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = treesRef.current;
    if (!mesh) return;
    const rng = makeRng(1337);
    const dummy = new Object3D();
    const color = new Color();

    for (let i = 0; i < landmarkCount; i++) {
      // Scatter in a ring outside the runway area.
      const angle = rng() * Math.PI * 2;
      const radius = 400 + rng() * (WORLD_HALF_SIZE * 0.7);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 8 + rng() * 22;
      dummy.position.set(x, scale * 0.5, z);
      dummy.scale.set(scale * 0.5, scale, scale * 0.5);
      dummy.rotation.y = rng() * Math.PI;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.setHSL(0.28 + rng() * 0.07, 0.45, 0.25 + rng() * 0.12);
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [landmarkCount]);

  return (
    <group>
      {/* Ground */}
      <mesh geometry={groundGeometry} receiveShadow>
        <meshStandardMaterial color="#3f6b3a" roughness={1} metalness={0} />
      </mesh>

      {/* Runway surface */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[RUNWAY_WIDTH, RUNWAY_LENGTH]} />
        <meshStandardMaterial color="#2c2f33" roughness={0.95} />
      </mesh>

      {/* Parking apron + taxi guidance behind the south threshold */}
      <Apron />

      {/* Runway centreline dashes */}
      <RunwayCentreline />

      {/* Threshold markings at each end */}
      <ThresholdBars z={RUNWAY_LENGTH / 2 - 12} />
      <ThresholdBars z={-RUNWAY_LENGTH / 2 + 12} />

      {/* Instanced landmark trees (depth cue) */}
      <instancedMesh
        ref={treesRef}
        args={[undefined, undefined, landmarkCount]}
        castShadow
        frustumCulled
      >
        <coneGeometry args={[1, 1, 6]} />
        <meshStandardMaterial vertexColors roughness={0.9} />
      </instancedMesh>
    </group>
  );
}

/**
 * Parking apron behind the south threshold plus a yellow taxi lead-in line and a
 * hold-short line, so the guided taxi from the apron onto the runway reads
 * clearly even without a full taxiway network.
 */
function Apron(): JSX.Element {
  const apronCentreZ = (SOUTH_THRESHOLD_Z + 8 + (SPAWN_Z + 45)) / 2;
  const apronLength = SPAWN_Z + 45 - (SOUTH_THRESHOLD_Z + 8);
  const leadInCentreZ = (LINEUP_Z + SPAWN_Z + 40) / 2;
  const leadInLength = SPAWN_Z + 40 - LINEUP_Z;

  return (
    <group>
      {/* Apron pad */}
      <mesh position={[0, 0.04, apronCentreZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[RUNWAY_WIDTH + 16, apronLength]} />
        <meshStandardMaterial color="#3a4047" roughness={0.95} />
      </mesh>

      {/* Yellow taxi lead-in line from the apron to the line-up point */}
      <mesh position={[0, 0.08, leadInCentreZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, leadInLength]} />
        <meshStandardMaterial color="#e6c200" roughness={0.7} />
      </mesh>

      {/* Hold-short line (double yellow bar across the taxiway) */}
      {[HOLD_SHORT_Z, HOLD_SHORT_Z + 2].map((z) => (
        <mesh key={z} position={[0, 0.09, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[16, 0.7]} />
          <meshStandardMaterial color="#e6c200" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function RunwayCentreline(): JSX.Element {
  const dashes = useMemo(() => {
    const items: number[] = [];
    const count = Math.floor(RUNWAY_LENGTH / 40);
    for (let i = 0; i < count; i++) {
      items.push(-RUNWAY_LENGTH / 2 + 20 + i * 40);
    }
    return items;
  }, []);

  return (
    <group>
      {dashes.map((z) => (
        <mesh key={z} position={[0, 0.07, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 16]} />
          <meshStandardMaterial color="#e9e9e9" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function ThresholdBars({ z }: { z: number }): JSX.Element {
  const bars = useMemo(() => [-12, -7.5, -3, 3, 7.5, 12], []);
  return (
    <group>
      {bars.map((x) => (
        <mesh key={x} position={[x, 0.07, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.5, 18]} />
          <meshStandardMaterial color="#f2f2f2" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
