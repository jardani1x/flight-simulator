# ✈ Skyward — Web Flight Simulator

An immersive, production-grade flight simulator that runs in the browser on
**desktop/laptop, tablet, and phone**. Fly a light aircraft over a procedurally
generated world with believable lift/drag/stall physics, a responsive HUD, and
controls for keyboard, touch, and gamepad — no external 3D assets required.

Built with **TypeScript · Vite · React · React Three Fiber (Three.js) ·
Zustand**, tested with **Vitest** (physics/unit) and **Playwright** (e2e smoke).

---

## Quick start

```bash
npm install        # install dependencies
npm run dev        # start the dev server (http://localhost:5173)
```

Then open the printed URL, click **Start Flight**, add throttle and pull back to
climb.

### All commands

| Command                | What it does                                            |
| ---------------------- | ------------------------------------------------------- |
| `npm install`          | Install dependencies                                    |
| `npm run dev`          | Start the Vite dev server with HMR                      |
| `npm run build`        | Type-check (`tsc -b`) and build the production bundle   |
| `npm run preview`      | Serve the production build locally                      |
| `npm test`             | Run the Vitest unit/physics + smoke tests               |
| `npm run test:watch`   | Run Vitest in watch mode                                |
| `npm run test:e2e`     | Run the Playwright end-to-end smoke test\*              |
| `npm run lint`         | Lint with ESLint                                        |
| `npm run typecheck`    | Type-check without emitting                             |
| `npm run format`       | Format the codebase with Prettier                       |

\* `npm run test:e2e` downloads a browser on first run (`npx playwright install
chromium`) and builds + previews the app automatically. It needs network access
for the browser download.

---

## Controls

Controls are also available in-app from the **?** button and the main-menu
**Controls** section.

### Keyboard & mouse (desktop/laptop)

| Key                | Action                       |
| ------------------ | ---------------------------- |
| `W` / `↓`          | Pitch down (nose down)       |
| `S` / `↑`          | Pitch up (nose up)           |
| `A` / `←`          | Roll left                    |
| `D` / `→`          | Roll right                   |
| `Q` / `E`          | Yaw left / right (rudder)    |
| `Shift` / `Ctrl`   | Throttle up / down           |
| `X` / `Z`          | Throttle full / idle         |
| `P` / `Esc`        | Pause / resume               |
| `R`                | Reset flight                 |
| `H`                | Toggle the controls overlay  |

### Touch (tablet/phone)

- **Left analog stick** — roll & pitch
- **Right vertical slider** — throttle
- **◄ ► buttons** — rudder (yaw)
- **Top bar** — pause · reset · controls · settings

Large touch targets, safe-area aware. Landscape is recommended but the sim
remains fully playable in portrait (a non-blocking hint is shown on phones).

### Gamepad (optional)

- **Left stick** — roll & pitch
- **Right stick X** — yaw
- **Right trigger** — throttle

---

## Gameplay tips

1. Push the throttle to full (`Shift` / slider up / right trigger).
2. Around 50–60 kt, gently pull back (pitch up) to rotate and lift off.
3. Keep the nose just above the horizon to climb without stalling.
4. Bank to turn — lift tilts with you, curving the flight path.
5. Watch the **STALL** warning: at too high an angle of attack the wing loses
   lift. Lower the nose and add power to recover.
6. Land gently — touching down too fast or too steep crashes the aircraft.
   Press `R` or **Reset** to try again at any time.

---

## Architecture

The project deliberately separates **simulation**, **rendering**, **input**, and
**UI** so each concern is testable and replaceable.

```
src/
├── config/
│   ├── constants.ts      # All named physics/world constants (no magic numbers)
│   └── quality.ts        # Graphics quality presets (dpr, shadows, draw counts)
├── core/
│   └── types.ts          # Shared interfaces (ControlInput, AircraftState, Telemetry)
├── physics/              # Pure simulation — no React, no Three.js rendering
│   ├── mathUtils.ts      # clamp/lerp/damp/deadzone helpers (+ tests)
│   ├── flightModel.ts    # Forces, lift/drag/stall, integration (+ tests)
│   └── Simulation.ts     # Fixed-timestep loop, bounds/ceiling recovery (+ tests)
├── input/                # Input sources -> one shared mutable ControlInput
│   ├── inputState.ts     # Channel-merged input read every frame (no re-renders)
│   ├── keymap.ts         # Key bindings (single source of truth)
│   ├── useKeyboard.ts    # Keyboard handler
│   ├── useGamepad.ts     # Gamepad polling
│   ├── useDeviceClass.ts # Device/orientation detection
│   └── TouchControls.tsx # On-screen joystick / throttle / rudder
├── scene/                # Three.js / R3F rendering
│   ├── SceneRoot.tsx     # <Canvas>, lights, fog, adaptive quality
│   ├── Sky.tsx           # Gradient sky-dome shader
│   ├── Terrain.tsx       # Ground, runway, instanced landmarks
│   ├── Clouds.tsx        # Instanced cloud puffs
│   ├── AircraftModel.tsx # Procedural aircraft mesh
│   ├── FlightRig.tsx     # Drives the sim + chase camera in the frame loop
│   ├── SimulationContext.tsx # Provides the Simulation instance + reset
│   └── perf.ts           # Shared FPS/frame-time metrics
├── hud/                  # Heads-up display (samples telemetry via refs)
│   ├── Hud.tsx
│   ├── AttitudeIndicator.tsx
│   └── useSimEvents.ts   # Bridges crash events to React state
├── ui/                   # Menus & overlays
│   ├── MainMenu.tsx · PauseMenu.tsx · CrashOverlay.tsx
│   ├── SettingsPanel.tsx · ControlsHelp.tsx · TopBar.tsx · OrientationHint.tsx
├── App.tsx               # Composition root
└── main.tsx              # Entry point
```

### Key design decisions

- **Physics is pure and engine-agnostic.** `flightModel.ts` / `Simulation.ts`
  use only Three.js _math_ (Vector3/Quaternion), so they run in Node and are
  unit-tested directly. Rendering merely reads the resulting state.
- **The frame loop never calls `setState`.** The simulation advances inside a
  single `useFrame`, the HUD samples a mutable telemetry object via `refs` in its
  own `rAF`, and input lives in a shared mutable object. React only re-renders on
  genuine UI changes (menu open, pause, crash, settings).
- **Fixed-timestep integration** (120 Hz) with an accumulator and sub-step cap
  makes physics deterministic and frame-rate independent, and survives tab
  switches / GC stalls without exploding.
- **Zero per-frame allocations** in the physics step and camera rig — module-level
  scratch vectors are reused.
- **Adaptive graphics.** Quality presets bundle device-pixel-ratio caps, shadow
  on/off, view distance, and instanced object counts. On first run the default is
  chosen per device class (phone→low, tablet→medium, desktop→high); thereafter
  the user's choice is respected and persisted to `localStorage`.
- **Graceful failure.** WebGL is feature-detected up front (clean message if
  unsupported) and an `ErrorBoundary` catches any render-time failure instead of
  white-screening. The render loop runs on-demand in menus/pause to save battery.
- **Recovery feedback.** Crash, stall, and airspace-boundary/ceiling conditions
  each surface a clear HUD indicator, and reset is always one tap/key away.
- **One draw call per scenery type** via `InstancedMesh` for clouds and
  landmarks, which matters most on mobile GPUs.

### Flight model (in brief)

Forces are summed each step: gravity, thrust along the nose
(`throttle · maxThrust`), aerodynamic **lift** (perpendicular to the relative
wind, `½ρv²·S·C_L(α)`), and **drag** (`½ρv²·S·C_D`, with induced drag growing
with lift). The lift coefficient is linear in angle of attack up to the stall
angle, then falls toward a non-zero floor — producing real **stall** behaviour.
Banking tilts the lift vector, so coordinated turns emerge from the physics
rather than being scripted. Control authority scales with airspeed (mushy
controls when slow), and a gentle weathervane term gives static stability.

---

## Performance & compatibility

- Targets smooth 60 fps on desktop and acceptable frame rates on mobile via the
  quality presets and DPR caps.
- `Low` preset (default on phones) disables shadows and antialiasing, caps DPR at
  1, and reduces draw counts and view distance for low-end devices.
- Responsive HUD/UI using `clamp()` sizing, CSS safe-area insets, and
  portrait/landscape handling. Buttons meet ~44px minimum touch targets.
- Honors `prefers-reduced-motion`.

---

## Testing

- **Unit / physics (`npm test`)** — 44 tests covering the math helpers, angle of
  attack, lift curve & stall, drag, takeoff, crash detection, attitude
  derivation, boundary warnings, telemetry, the simulation loop (reset, world
  bounds, ceiling), input merging/sensitivity, and per-device quality defaults.
- **Smoke (`npm test`)** — mounts the app (with the WebGL scene mocked) and
  verifies the menu, starting a flight, the HUD, and settings.
- **End-to-end (`npm run test:e2e`)** — boots the real production build in
  Chromium on both a desktop and a mobile viewport, starts a flight, and asserts
  the WebGL canvas + HUD render with no page errors.

---

## Known limitations

- **E2E requires a browser download** (`npx playwright install chromium`) and
  network access; it cannot run in fully offline/sandboxed environments.
- **Shadows are localised** near the world origin (a single directional-light
  shadow camera); they fade out far from the runway. They are cosmetic and off by
  default below the `High` preset.
- **Arcade-leaning aerodynamics.** The model is believable (real lift/drag/stall,
  emergent banked turns) but simplified — no propeller torque, ground effect,
  wind, or per-axis moments of inertia.
- **No audio** yet (see next steps).
- The Three.js bundle is large (~176 kB gzipped); it is split into its own chunk
  for caching but is inherent to 3D in the browser.

---

## Suggested next improvements

- Real aircraft glTF models and liveries
- Richer terrain (heightmaps, biomes, water shading) and landmarks
- Weather: wind, turbulence, clouds you can fly through, time of day
- Missions / objectives (takeoff, waypoints, landing challenges, scoring)
- Multiplayer
- Fuller gamepad mapping & remappable controls
- More advanced aerodynamics (ground effect, p-factor, flaps/gear)
- Engine, wind, and stall-warning **audio**
- Save/load progress and flight logbook

---

## License

MIT — see `package.json`. All assets are procedurally generated; there are no
third-party art assets to attribute.
