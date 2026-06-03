import { useMemo } from 'react';
import { BackSide, Color, ShaderMaterial } from 'three';

interface SkyProps {
  radius: number;
}

/**
 * A gradient sky dome rendered as a large back-faced sphere. A cheap custom
 * shader blends a zenith colour into a horizon colour, giving an atmospheric
 * feel without any texture assets. Depth writes are disabled so it never
 * occludes scene geometry.
 */
export function Sky({ radius }: SkyProps): JSX.Element {
  const material = useMemo(() => {
    return new ShaderMaterial({
      side: BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new Color('#1f6fd6') },
        horizonColor: { value: new Color('#bcd9f2') },
        sunDirection: { value: new Color() }, // reused as a vec3 direction
        offset: { value: 0.0 },
        exponent: { value: 0.8 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          float t = pow(max(h, 0.0), exponent);
          vec3 col = mix(horizonColor, topColor, t);
          // Subtle warm glow toward the lower sky.
          col = mix(col, vec3(1.0, 0.93, 0.82), max(0.0, 0.15 - abs(h)) * 1.2);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }, []);

  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[radius, 24, 16]} />
    </mesh>
  );
}
