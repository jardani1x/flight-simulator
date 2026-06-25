import { describe, expect, it } from 'vitest';
import { DEFAULT_AIRCRAFT_ID, FLEET, getAircraftDef } from './fleet';

describe('fleet', () => {
  it('is non-empty and has unique ids', () => {
    expect(FLEET.length).toBeGreaterThan(3);
    const ids = FLEET.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('contains the default aircraft', () => {
    expect(FLEET.some((a) => a.id === DEFAULT_AIRCRAFT_ID)).toBe(true);
  });

  it('offers both Boeing and Airbus aircraft', () => {
    const makers = new Set(FLEET.map((a) => a.manufacturer));
    expect(makers.has('Boeing')).toBe(true);
    expect(makers.has('Airbus')).toBe(true);
  });

  it('gives every aircraft sane camera framing', () => {
    for (const a of FLEET) {
      expect(a.camera.distance).toBeGreaterThan(0);
      expect(a.camera.height).toBeGreaterThan(0);
      expect(a.camera.lookAhead).toBeGreaterThan(0);
    }
  });

  it('points glTF models at a bundled .glb with a positive target length', () => {
    const gltfs = FLEET.filter((a) => a.model.kind === 'gltf');
    expect(gltfs.length).toBeGreaterThan(0);
    for (const a of gltfs) {
      if (a.model.kind !== 'gltf') continue;
      expect(a.model.url).toMatch(/aircraft\/.+\.glb$/);
      expect(a.model.targetLength).toBeGreaterThan(0);
    }
  });

  it('falls back to the default for unknown or missing ids', () => {
    expect(getAircraftDef('does-not-exist').id).toBe(DEFAULT_AIRCRAFT_ID);
    expect(getAircraftDef(undefined).id).toBe(DEFAULT_AIRCRAFT_ID);
  });

  it('resolves a known id exactly', () => {
    expect(getAircraftDef('b747').id).toBe('b747');
  });
});
