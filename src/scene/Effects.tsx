import { Bloom, EffectComposer, SMAA, Vignette } from '@react-three/postprocessing';

/**
 * Desktop-class post-processing stack: subtle bloom on bright highlights (sun,
 * polished metal), SMAA edge anti-aliasing, and a gentle vignette for depth.
 * Mounted only on the High preset (see SceneRoot) so mobile/low is untouched.
 */
export function Effects(): JSX.Element {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.25}
        mipmapBlur
        radius={0.7}
      />
      <SMAA />
      <Vignette offset={0.28} darkness={0.5} />
    </EffectComposer>
  );
}
