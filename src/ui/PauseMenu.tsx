import { useStore } from '../state/store';

interface PauseMenuProps {
  onResume: () => void;
  onReset: () => void;
}

/** Pause overlay with resume / reset / settings / help actions. */
export function PauseMenu({ onResume, onReset }: PauseMenuProps): JSX.Element {
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const setShowHelp = useStore((s) => s.setShowHelp);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Paused">
      <div className="panel panel-narrow">
        <div className="panel-header">
          <h2>Paused</h2>
        </div>
        <div className="menu-buttons">
          <button type="button" className="btn btn-primary" onClick={onResume} autoFocus>
            Resume
          </button>
          <button type="button" className="btn" onClick={onReset}>
            Reset Flight
          </button>
          <button type="button" className="btn" onClick={() => setShowHelp(true)}>
            Controls
          </button>
          <button type="button" className="btn" onClick={() => setSettingsOpen(true)}>
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}
