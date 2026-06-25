import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { ACESFilmicToneMapping } from 'three';
import { Sky } from './Sky';
import { Terrain } from './Terrain';
import { Clouds } from './Clouds';
import { FlightRig } from './FlightRig';
import { MissionMarkers } from './MissionMarkers';
import { Effects } from './Effects';
import { QUALITY_PRESETS } from '../config/quality';
import { useStore } from '../state/store';

/**
 * Root of the 3D scene. The WebGL context attributes (antialias) and shadow flag
 * can only be chosen at context-creation time, so the Canvas is keyed by quality
 * and remounts when the player changes the graphics preset. The aircraft state
 * lives above this in SimulationProvider, so a remount does not lose the flight.
 */
export function SceneRoot(): JSX.Element {
  const quality = useStore((s) => s.settings.graphicsQuality);
  const started = useStore((s) => s.started);
  const paused = useStore((s) => s.paused);
  const mode = useStore((s) => s.mode);
  const preset = QUALITY_PRESETS[quality];
  const showGuidance = started && mode === 'guided';

  // Only run the render loop continuously while actively flying. In the menu or
  // when paused the scene is static, so render on demand to save battery/GPU.
  const frameloop = started && !paused ? 'always' : 'demand';

  return (
    <Canvas
      key={quality}
      frameloop={frameloop}
      shadows={preset.shadows}
      dpr={[1, preset.maxPixelRatio]}
      gl={{
        antialias: preset.antialias,
        powerPreference: 'high-performance',
        // Keep the buffer when the tab is hidden so resuming is seamless.
        preserveDrawingBuffer: false,
      }}
      camera={{
        fov: 60,
        near: 0.5,
        // Behind the apron spawn so the menu frames the aircraft and runway
        // before the flight rig snaps the chase camera into place.
        far: preset.viewDistance * 1.15,
        position: [0, 9, 805],
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
      }}
    >
      {/* Atmosphere: linear fog fading to the horizon colour. */}
      <fog attach="fog" args={['#bcd9f2', preset.viewDistance * 0.45, preset.viewDistance]} />

      {/* Lighting: a warm sun plus sky/ground ambient bounce. */}
      <hemisphereLight args={['#cfe3f5', '#41663c', 0.55]} />
      <ambientLight intensity={0.12} />
      <directionalLight
        position={[800, 1200, 400]}
        intensity={2.7}
        color="#fff3da"
        castShadow={preset.shadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0004}
        shadow-camera-near={1}
        shadow-camera-far={3000}
        shadow-camera-left={-400}
        shadow-camera-right={400}
        shadow-camera-top={400}
        shadow-camera-bottom={-400}
      />

      {/* Image-based lighting for believable metal/glass reflections (no asset:
          a procedural sky/sun/ground rig built from light cards). */}
      {preset.environment && (
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={2.2} color="#fff4e0" position={[0, 8, -12]} scale={[14, 14, 1]} />
          <Lightformer intensity={0.7} color="#bcd9f2" position={[-12, 4, 6]} scale={[10, 10, 1]} />
          <Lightformer intensity={0.5} color="#d8e8f6" position={[12, 3, 6]} scale={[10, 10, 1]} />
          <Lightformer
            intensity={0.6}
            color="#41663c"
            position={[0, -8, 0]}
            scale={[30, 30, 1]}
            rotation={[Math.PI / 2, 0, 0]}
          />
        </Environment>
      )}

      <Sky radius={preset.viewDistance * 1.05} />
      <Terrain segments={preset.terrainSegments} landmarkCount={preset.landmarkCount} />
      <Clouds count={preset.cloudCount} />
      {showGuidance && <MissionMarkers />}
      <FlightRig />

      {preset.postFx && <Effects />}
    </Canvas>
  );
}
