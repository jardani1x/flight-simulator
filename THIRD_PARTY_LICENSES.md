# Third-party assets & licences

## Aircraft 3D models (`public/aircraft/*.glb`)

The detailed "HD model" aircraft (`A320.glb`, `A380.glb`, `B748.glb`) are real
3D airliner models obtained from the **FlightAirMap 3D models** project:

- Source: <https://github.com/Ysurac/FlightAirMap-3dmodels>
- Upstream origins: Flightradar24 `fr24-3d-models` and FlightGear (FGMEMBERS)
- **Licence: GNU General Public License v2 (GPLv2)** — see each model's
  `COPYING`/`license.txt` in the upstream repository, and the project `LICENSE`.

Because these models are GPLv2 (a "copyleft" licence), **this project as a whole
is licensed under the GPL** (`GPL-2.0-or-later`, see `LICENSE`). If you remove
the bundled `.glb` models and use only the procedural in-repo aircraft, the
original source code is otherwise self-contained and asset-free.

No official manufacturer liveries, logos or trademarks are claimed. Boeing and
Airbus are trademarks of their respective owners; references are descriptive
only.

## Procedural aircraft & scenery

All other 3D content (the procedural airliner fleet, terrain, runway, clouds,
sky) is generated in code from primitive geometry and ships under this project's
GPL licence — there are no other third-party art assets.

## Software dependencies

Runtime/build dependencies (React, Three.js, @react-three/fiber, drei,
postprocessing, Zustand, Vite, etc.) are each distributed under their own
permissive licences (MIT/Apache-2.0); see `node_modules/<pkg>/LICENSE`.
