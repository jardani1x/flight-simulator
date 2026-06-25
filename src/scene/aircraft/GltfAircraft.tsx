import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box3, Vector3 } from 'three';

interface Props {
  url: string;
  /** Auto-scale the model so its longest horizontal axis equals this (m). */
  targetLength: number;
  /** Y rotation (rad) if the model's nose does not face -Z. */
  yaw?: number;
  /** Extra vertical offset (m) to seat the model on its wheels. */
  yOffset?: number;
}

/**
 * Renders an external glTF/glb aircraft loaded at runtime and **normalises** it
 * so it drops into the scene predictably regardless of the model's native units
 * or origin: the bounding box is measured, the model is recentred horizontally,
 * its wheels are seated near y=0, and it is uniformly scaled so its longest
 * horizontal axis matches `targetLength`. A `yaw` corrects nose direction.
 *
 * Must be mounted under a <Suspense> boundary (see AircraftModel), which shows a
 * procedural airliner while the model downloads.
 */
export function GltfAircraft({ url, targetLength, yaw = 0, yOffset = 0 }: Props): JSX.Element {
  const { scene } = useGLTF(url);

  const { object, scale, offset } = useMemo(() => {
    // Clone so re-selecting / multiple instances don't share one mutated graph.
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      obj.castShadow = true;
      obj.receiveShadow = true;
    });

    const box = new Box3().setFromObject(clone);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);

    const longestHorizontal = Math.max(size.x, size.z) || 1;
    const s = targetLength / longestHorizontal;

    // Recentre horizontally; lift so the lowest point sits at y=0 (plus yOffset).
    return {
      object: clone,
      scale: s,
      offset: new Vector3(-center.x, -box.min.y + yOffset / s, -center.z),
    };
  }, [scene, targetLength, yOffset]);

  return (
    <group rotation={[0, yaw, 0]} scale={scale}>
      <primitive object={object} position={offset} />
    </group>
  );
}
