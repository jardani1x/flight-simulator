import { useLayoutEffect, useRef } from 'react';
import { InstancedMesh, Object3D } from 'three';

/** Deterministic PRNG so cloud layout is stable across renders. */
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

interface CloudsProps {
  count: number;
}

/**
 * Volumetric-looking clouds built from instanced low-poly spheres. Each "cloud"
 * is a small cluster of puffs; using a single InstancedMesh keeps the draw-call
 * count at one regardless of cloud count, which matters on mobile GPUs.
 */
export function Clouds({ count }: CloudsProps): JSX.Element {
  const ref = useRef<InstancedMesh>(null);
  const puffsPerCloud = 5;
  const total = count * puffsPerCloud;

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const rng = makeRng(9001);
    const dummy = new Object3D();
    let i = 0;

    for (let c = 0; c < count; c++) {
      const cx = (rng() - 0.5) * 14000;
      const cz = (rng() - 0.5) * 14000;
      const cy = 700 + rng() * 1600;
      const baseScale = 80 + rng() * 160;

      for (let p = 0; p < puffsPerCloud; p++) {
        const ox = (rng() - 0.5) * baseScale * 2.2;
        const oy = (rng() - 0.5) * baseScale * 0.5;
        const oz = (rng() - 0.5) * baseScale * 2.2;
        const s = baseScale * (0.6 + rng() * 0.7);
        dummy.position.set(cx + ox, cy + oy, cz + oz);
        dummy.scale.set(s, s * 0.6, s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        i += 1;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, total]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, total]} frustumCulled>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color="#ffffff"
        transparent
        opacity={0.85}
        roughness={1}
        flatShading
        depthWrite={false}
      />
    </instancedMesh>
  );
}
