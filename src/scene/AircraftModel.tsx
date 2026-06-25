import { Suspense } from 'react';
import { useStore } from '../state/store';
import { getAircraftDef } from './aircraft/fleet';
import { ProceduralAirliner } from './aircraft/ProceduralAirliner';
import { GltfAircraft } from './aircraft/GltfAircraft';

/**
 * Renders the currently selected aircraft. Procedural airliners (the in-repo
 * default fleet) render immediately; glTF-backed aircraft load on demand and
 * fall back to a procedural airliner while loading. The mesh faces -Z, matching
 * the flight model's body-frame forward direction.
 */
export function AircraftModel(): JSX.Element {
  const aircraftId = useStore((s) => s.settings.aircraftId);
  const def = getAircraftDef(aircraftId);

  if (def.model.kind === 'gltf') {
    const { url, targetLength, yaw, yOffset } = def.model;
    return (
      <Suspense fallback={<DefaultProcedural />}>
        <GltfAircraft url={url} targetLength={targetLength} yaw={yaw} yOffset={yOffset} />
      </Suspense>
    );
  }

  return <ProceduralAirliner shape={def.model.shape} livery={def.model.livery} />;
}

/** A neutral procedural airliner shown while a glTF model is still loading. */
function DefaultProcedural(): JSX.Element {
  const def = getAircraftDef('a320');
  if (def.model.kind !== 'procedural') return <group />;
  return <ProceduralAirliner shape={def.model.shape} livery={def.model.livery} />;
}
