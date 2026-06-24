import { useStore } from '../state/store';

interface MissionCompleteOverlayProps {
  /** Restart the guided flight from the apron. */
  onReplay: () => void;
  /** Switch to free-flight mode and keep flying. */
  onFreeFlight: () => void;
}

/** Shown after the player completes the full guided circuit and lands. */
export function MissionCompleteOverlay({
  onReplay,
  onFreeFlight,
}: MissionCompleteOverlayProps): JSX.Element {
  const setMode = useStore((s) => s.setMode);

  return (
    <div className="overlay" role="alertdialog" aria-modal="true" aria-label="Mission complete">
      <div className="panel panel-narrow complete-panel">
        <div className="complete-badge" aria-hidden="true">
          ✈
        </div>
        <h2>Mission Complete!</h2>
        <p>
          You flew the whole journey — pre-flight, taxi, take-off, climb, navigation, approach and a
          safe landing. That is the complete basics of flying. Nicely done, pilot!
        </p>
        <div className="menu-buttons">
          <button type="button" className="btn btn-primary btn-large" onClick={onReplay} autoFocus>
            ↺ Fly it again
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setMode('free');
              onFreeFlight();
            }}
          >
            ✈ Keep flying (free flight)
          </button>
        </div>
      </div>
    </div>
  );
}
