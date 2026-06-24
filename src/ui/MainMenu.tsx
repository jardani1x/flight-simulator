import { useStore } from '../state/store';
import type { FlightMode } from '../state/store';
import { ControlsReference } from './ControlsHelp';

interface MainMenuProps {
  onStart: (mode: FlightMode) => void;
}

/** Opening screen: title, guided/free start options and a controls primer. */
export function MainMenu({ onStart }: MainMenuProps): JSX.Element {
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const deviceClass = useStore((s) => s.deviceClass);

  return (
    <div className="menu-screen" role="dialog" aria-label="Main menu">
      <div className="menu-content">
        <h1 className="title">SKYWARD</h1>
        <p className="subtitle">Web Flight Simulator</p>

        <div className="menu-buttons">
          <button
            type="button"
            className="btn btn-primary btn-large"
            onClick={() => onStart('guided')}
          >
            ▶ Start Flight
          </button>
          <p className="menu-mode-note">
            Guided tutorial — we&apos;ll walk you through taxi, take-off, flying and landing,
            step&nbsp;by&nbsp;step.
          </p>
          <button type="button" className="btn" onClick={() => onStart('free')}>
            ✈ Free Flight
          </button>
          <button type="button" className="btn" onClick={() => setSettingsOpen(true)}>
            ⚙ Settings
          </button>
        </div>

        <p className="hint">
          {deviceClass === 'desktop'
            ? 'New here? Choose Start Flight and just follow the on-screen prompts.'
            : 'New here? Tap Start Flight and follow the prompts. Landscape recommended.'}
        </p>

        <details className="menu-controls">
          <summary>Controls</summary>
          <ControlsReference />
        </details>
      </div>
    </div>
  );
}
