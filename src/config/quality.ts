import type { GraphicsQuality } from '../core/types';

/**
 * Rendering quality presets. Each preset bundles the knobs that meaningfully
 * affect performance so the renderer can switch between them in one place.
 */
export interface QualityPreset {
  /** Upper bound for device pixel ratio (the biggest perf lever on mobile). */
  maxPixelRatio: number;
  /** Whether shadows are rendered. */
  shadows: boolean;
  /** Camera far plane / fog distance (m). */
  viewDistance: number;
  /** Number of instanced cloud puffs. */
  cloudCount: number;
  /** Terrain grid subdivisions (per side). */
  terrainSegments: number;
  /** Number of scenery landmark objects. */
  landmarkCount: number;
  /** Enable antialiasing on the WebGL context. */
  antialias: boolean;
}

export const QUALITY_PRESETS: Record<GraphicsQuality, QualityPreset> = {
  low: {
    maxPixelRatio: 1,
    shadows: false,
    viewDistance: 4500,
    cloudCount: 18,
    terrainSegments: 48,
    landmarkCount: 30,
    antialias: false,
  },
  medium: {
    maxPixelRatio: 1.5,
    shadows: false,
    viewDistance: 6500,
    cloudCount: 40,
    terrainSegments: 96,
    landmarkCount: 70,
    antialias: true,
  },
  high: {
    maxPixelRatio: 2,
    shadows: true,
    viewDistance: 9000,
    cloudCount: 80,
    terrainSegments: 160,
    landmarkCount: 140,
    antialias: true,
  },
};
