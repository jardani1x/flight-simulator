import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping } from 'three';
import { Sky } from './Sky';
import { Terrain } from './Terrain';
import { Clouds } from './Clouds';
import { FlightRig } from './FlightRig';
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
  const preset = QUALITY_PRESETS[quality];

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
        far: preset.viewDistance * 1.15,
        position: [0, 8, 625],
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      {/* Atmosphere: linear fog fading to the horizon colour. */}
      <fog attach="fog" args={['#bcd9f2', preset.viewDistance * 0.45, preset.viewDistance]} />

      {/* Lighting: a warm sun plus sky/ground ambient bounce. */}
      <hemisphereLight args={['#bcd9f2', '#3f6b3a', 0.7]} />
      <directionalLight
        position={[800, 1200, 400]}
        intensity={2.2}
        color="#fff4e0"
        castShadow={preset.shadows}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={3000}
        shadow-camera-left={-400}
        shadow-camera-right={400}
        shadow-camera-top={400}
        shadow-camera-bottom={-400}
      />

      <Sky radius={preset.viewDistance * 1.05} />
      <Terrain segments={preset.terrainSegments} landmarkCount={preset.landmarkCount} />
      <Clouds count={preset.cloudCount} />
      <FlightRig />
    </Canvas>
  );
}
