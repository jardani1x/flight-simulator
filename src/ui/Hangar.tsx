import { FLEET } from '../scene/aircraft/fleet';
import { useStore } from '../state/store';

/**
 * Aircraft selection screen ("hangar"). Lists the fleet as cards — procedural
 * in-repo airliners plus the detailed real glTF "HD" models — and persists the
 * choice. Selecting an aircraft updates the scene immediately.
 */
export function Hangar(): JSX.Element {
  const aircraftId = useStore((s) => s.settings.aircraftId);
  const setAircraft = useStore((s) => s.setAircraft);
  const setHangarOpen = useStore((s) => s.setHangarOpen);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Select aircraft">
      <div className="panel hangar-panel">
        <div className="panel-header">
          <h2>Choose your aircraft</h2>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close aircraft selection"
            onClick={() => setHangarOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="hangar-grid">
          {FLEET.map((a) => {
            const selected = a.id === aircraftId;
            const isHd = a.model.kind === 'gltf';
            const swatch = a.model.kind === 'procedural' ? a.model.livery.tail : '#39d8ff';
            return (
              <button
                key={a.id}
                type="button"
                className={`hangar-card ${selected ? 'active' : ''}`}
                aria-pressed={selected}
                onClick={() => setAircraft(a.id)}
              >
                <span className="hangar-swatch" style={{ background: swatch }} aria-hidden="true" />
                <span className="hangar-card-body">
                  <span className="hangar-card-name">
                    {a.name}
                    {isHd && <span className="hangar-badge">HD</span>}
                  </span>
                  <span className="hangar-card-meta">
                    {a.manufacturer} · {a.category}
                  </span>
                  <span className="hangar-card-blurb">{a.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>

        <p className="hangar-note">
          “HD” aircraft are detailed real 3D models (GPLv2). The others are built in code. Your
          choice is saved for next time.
        </p>

        <div className="panel-actions">
          <button type="button" className="btn btn-primary" onClick={() => setHangarOpen(false)}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
