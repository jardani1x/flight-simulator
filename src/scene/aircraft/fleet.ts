import type { AircraftDef } from './types';

/**
 * The selectable fleet. The procedural entries are stylised, **unbranded**
 * approximations of well-known airliner silhouettes built from primitive
 * geometry — no official liveries, logos or trademarked detailing. The `gltf`
 * entries load detailed real models bundled in `public/aircraft/` (GPLv2; see
 * THIRD_PARTY_LICENSES.md). Add more by dropping a `.glb` in `public/aircraft/`
 * and appending a `{ kind: 'gltf', url, targetLength, yaw }` entry.
 */
export const FLEET: AircraftDef[] = [
  {
    id: 'a320',
    name: 'A320-style',
    manufacturer: 'Airbus',
    category: 'Narrow-body',
    blurb: 'Single-aisle twinjet — the everyday short-haul workhorse.',
    camera: { distance: 30, height: 9.5, lookAhead: 14 },
    model: {
      kind: 'procedural',
      shape: {
        fuselageLength: 16,
        fuselageRadius: 0.95,
        noseLength: 2.4,
        tailLength: 3.4,
        tailUpsweep: 0.2,
        wingspan: 18,
        wingChord: 2.6,
        wingSweep: 0.42,
        wingDihedral: 0.09,
        wingZ: 0.6,
        engineCount: 2,
        engineRadius: 0.6,
        engineLength: 2.2,
        finHeight: 3.0,
        stabSpan: 6.2,
      },
      livery: {
        fuselage: '#eef2f7',
        belly: '#d7dee7',
        cheatline: '#1d6fb8',
        tail: '#11497e',
        engine: '#cfd6de',
        wing: '#c9d2dc',
      },
    },
  },
  {
    id: 'b737',
    name: '737-style',
    manufacturer: 'Boeing',
    category: 'Narrow-body',
    blurb: 'Single-aisle twinjet with low-slung engines — a classic.',
    camera: { distance: 30, height: 9.5, lookAhead: 14 },
    model: {
      kind: 'procedural',
      shape: {
        fuselageLength: 16.5,
        fuselageRadius: 0.95,
        noseLength: 2.2,
        tailLength: 3.4,
        tailUpsweep: 0.22,
        wingspan: 17.5,
        wingChord: 2.7,
        wingSweep: 0.4,
        wingDihedral: 0.1,
        wingZ: 0.8,
        engineCount: 2,
        engineRadius: 0.58,
        engineLength: 2.0,
        finHeight: 3.1,
        stabSpan: 6.0,
      },
      livery: {
        fuselage: '#f4f5f7',
        belly: '#2b3a4a',
        cheatline: '#c8312b',
        tail: '#c8312b',
        engine: '#d8dde3',
        wing: '#9aa6b2',
      },
    },
  },
  {
    id: 'b777',
    name: '777-style',
    manufacturer: 'Boeing',
    category: 'Wide-body',
    blurb: 'Long-haul twinjet with huge engines and a broad cabin.',
    camera: { distance: 40, height: 12, lookAhead: 18 },
    model: {
      kind: 'procedural',
      shape: {
        fuselageLength: 22,
        fuselageRadius: 1.25,
        noseLength: 3.0,
        tailLength: 4.4,
        tailUpsweep: 0.18,
        wingspan: 26,
        wingChord: 3.4,
        wingSweep: 0.5,
        wingDihedral: 0.11,
        wingZ: 0.6,
        engineCount: 2,
        engineRadius: 0.98,
        engineLength: 3.2,
        finHeight: 3.9,
        stabSpan: 8.6,
      },
      livery: {
        fuselage: '#eff2f6',
        belly: '#c2cad4',
        cheatline: '#0e7a6b',
        tail: '#0b5a50',
        engine: '#ccd3db',
        wing: '#bcc6d1',
      },
    },
  },
  {
    id: 'b747',
    name: '747-style',
    manufacturer: 'Boeing',
    category: 'Jumbo',
    blurb: 'The Queen of the Skies — four engines and an upper-deck hump.',
    camera: { distance: 46, height: 14, lookAhead: 20 },
    model: {
      kind: 'procedural',
      shape: {
        fuselageLength: 26,
        fuselageRadius: 1.35,
        noseLength: 3.2,
        tailLength: 4.8,
        tailUpsweep: 0.16,
        wingspan: 30,
        wingChord: 3.8,
        wingSweep: 0.55,
        wingDihedral: 0.12,
        wingZ: 0.4,
        engineCount: 4,
        engineRadius: 0.8,
        engineLength: 2.8,
        finHeight: 4.3,
        stabSpan: 9.6,
        upperDeckHump: true,
      },
      livery: {
        fuselage: '#f2f4f7',
        belly: '#34506b',
        cheatline: '#2860a6',
        tail: '#1b3f6b',
        engine: '#cdd4dc',
        wing: '#b9c3ce',
      },
    },
  },
  {
    id: 'a380',
    name: 'A380-style',
    manufacturer: 'Airbus',
    category: 'Jumbo',
    blurb: 'Full-length double-deck quad — the largest airliner of all.',
    camera: { distance: 50, height: 15, lookAhead: 22 },
    model: {
      kind: 'procedural',
      shape: {
        fuselageLength: 28,
        fuselageRadius: 1.7,
        noseLength: 3.0,
        tailLength: 4.6,
        tailUpsweep: 0.14,
        wingspan: 32,
        wingChord: 4.2,
        wingSweep: 0.5,
        wingDihedral: 0.1,
        wingZ: 0.2,
        engineCount: 4,
        engineRadius: 0.92,
        engineLength: 3.0,
        finHeight: 4.4,
        stabSpan: 10.5,
      },
      livery: {
        fuselage: '#eef1f6',
        belly: '#b7c0cb',
        cheatline: '#15598e',
        tail: '#103f63',
        engine: '#cdd4dc',
        wing: '#bac4cf',
      },
    },
  },

  // --- Real glTF models -----------------------------------------------------
  // Detailed real-world airliner models loaded on demand from public/aircraft/.
  // These are GPLv2 (see THIRD_PARTY_LICENSES.md), which is why the project is
  // GPLv2. They auto-normalise (centre + scale to `targetLength`); `yaw` corrects
  // nose direction. They are not the default so the in-repo fleet always works.
  {
    id: 'a320-hd',
    name: 'A320 — HD model',
    manufacturer: 'Airbus',
    category: 'Narrow-body',
    blurb: 'Detailed single-aisle twinjet (real 3D model).',
    camera: { distance: 55, height: 16, lookAhead: 26 },
    model: {
      kind: 'gltf',
      url: `${import.meta.env.BASE_URL}aircraft/A320.glb`,
      targetLength: 30,
      yaw: Math.PI / 2,
      attribution: 'FlightAirMap 3D models (GPLv2)',
    },
  },
  {
    id: 'b748-hd',
    name: '747-8 — HD model',
    manufacturer: 'Boeing',
    category: 'Jumbo',
    blurb: 'Detailed four-engine jumbo with the iconic hump (real 3D model).',
    camera: { distance: 100, height: 30, lookAhead: 44 },
    model: {
      kind: 'gltf',
      url: `${import.meta.env.BASE_URL}aircraft/B748.glb`,
      targetLength: 58,
      yaw: Math.PI / 2,
      attribution: 'FlightAirMap 3D models (GPLv2)',
    },
  },
  {
    id: 'a380-hd',
    name: 'A380 — HD model',
    manufacturer: 'Airbus',
    category: 'Jumbo',
    blurb: 'Detailed full-length double-decker (real 3D model).',
    camera: { distance: 100, height: 30, lookAhead: 44 },
    model: {
      kind: 'gltf',
      url: `${import.meta.env.BASE_URL}aircraft/A380.glb`,
      targetLength: 55,
      yaw: Math.PI / 2,
      attribution: 'FlightAirMap 3D models (GPLv2)',
    },
  },
];

export const DEFAULT_AIRCRAFT_ID = 'a320';

/** Look up an aircraft by id, falling back to the default (the fleet is never empty). */
export function getAircraftDef(id: string | undefined): AircraftDef {
  return (
    FLEET.find((a) => a.id === id) ?? FLEET.find((a) => a.id === DEFAULT_AIRCRAFT_ID) ?? FLEET[0]!
  );
}
