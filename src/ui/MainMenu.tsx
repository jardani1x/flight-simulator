import { useStore } from '../state/store';
import { ControlsReference } from './ControlsHelp';

interface MainMenuProps {
  onStart: () => void;
}

/** Opening screen: title, start button and a controls primer. */
export function MainMenu({ onStart }: MainMenuProps): JSX.Element {
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const deviceClass = useStore((s) => s.deviceClass);

  return (
    <div className="menu-screen" role="dialog" aria-label="Main menu">
      <div className="menu-content">
        <h1 className="title">SKYWARD</h1>
        <p className="subtitle">Web Flight Simulator</p>

        <div className="menu-buttons">
          <button type="button" className="btn btn-primary btn-large" onClick={onStart}>
            ▶ Start Flight
          </button>
          <button type="button" className="btn" onClick={() => setSettingsOpen(true)}>
            ⚙ Settings
          </button>
        </div>

        <p className="hint">
          {deviceClass === 'desktop'
            ? 'Tip: hold Shift to add throttle, then pull back (S / ↑) to climb.'
            : 'Tip: slide the throttle up, then pull the stick back to climb. Landscape recommended.'}
        </p>

        <details className="menu-controls">
          <summary>Controls</summary>
          <ControlsReference />
        </details>
      </div>
    </div>
  );
}
