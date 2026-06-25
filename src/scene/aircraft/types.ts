/** A paint scheme applied to a procedural airliner. */
export interface Livery {
  /** Upper fuselage / main body. */
  fuselage: string;
  /** Lower fuselage (belly). */
  belly: string;
  /** Cheatline stripe along the windows. */
  cheatline: string;
  /** Tail fin colour. */
  tail: string;
  /** Engine nacelle colour. */
  engine: string;
  /** Wing colour. */
  wing: string;
}

/** Parameters that drive the procedural airliner mesh (all metres / radians). */
export interface AirlinerShape {
  fuselageLength: number;
  fuselageRadius: number;
  noseLength: number;
  tailLength: number;
  /** Upsweep of the tail cone (rad). */
  tailUpsweep: number;
  wingspan: number;
  /** Root chord of the wing (front-to-back length). */
  wingChord: number;
  /** Wing sweep angle (rad). */
  wingSweep: number;
  /** Wing dihedral angle (rad). */
  wingDihedral: number;
  /** Wing mount point along the fuselage (z, +back). */
  wingZ: number;
  /** 2 or 4 underwing engines. */
  engineCount: 2 | 4;
  engineRadius: number;
  engineLength: number;
  /** Vertical tail height above the fuselage. */
  finHeight: number;
  /** Horizontal stabiliser span. */
  stabSpan: number;
  /** Adds a partial upper-deck hump behind the nose (747 silhouette). */
  upperDeckHump?: boolean;
}

export type AircraftCategory = 'Narrow-body' | 'Wide-body' | 'Jumbo' | 'Regional' | 'Light';

/**
 * A selectable aircraft. The model is either built procedurally from an
 * {@link AirlinerShape} (ships in-repo, MIT-clean) or loaded from an external
 * glTF/glb URL at runtime (so license-restricted real models can be dropped in
 * without bundling them into this repository).
 */
export interface AircraftDef {
  id: string;
  /** Display name (use evocative names, not trademarked type designators). */
  name: string;
  manufacturer: string;
  category: AircraftCategory;
  /** One-line flavour text for the hangar card. */
  blurb: string;
  /** Chase-camera offsets tuned to the model's size (metres). */
  camera: { distance: number; height: number; lookAhead: number };
  /** How the 3D model is provided. */
  model:
    | { kind: 'procedural'; shape: AirlinerShape; livery: Livery }
    | {
        kind: 'gltf';
        /** URL or path (e.g. `${import.meta.env.BASE_URL}aircraft/foo.glb`). */
        url: string;
        /**
         * Target overall length (m). The loaded model is auto-scaled so its
         * longest horizontal axis matches this, making native model units
         * irrelevant. Use realistic airliner lengths so they sit right on the runway.
         */
        targetLength: number;
        /** Y rotation (rad) if the model's nose does not face -Z after centring. */
        yaw?: number;
        /** Extra vertical offset (m) to seat the model on its wheels. */
        yOffset?: number;
        /** Attribution / source note (these real models are GPLv2). */
        attribution?: string;
      };
}
