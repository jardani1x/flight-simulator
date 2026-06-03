import { KEY_BINDINGS } from '../input/keymap';
import { useStore } from '../state/store';

/** Reusable controls reference, used both on the main menu and as an overlay. */
export function ControlsReference(): JSX.Element {
  const deviceClass = useStore((s) => s.deviceClass);

  return (
    <div className="controls-reference">
      <div className="controls-col">
        <h3>Keyboard &amp; Mouse</h3>
        <dl>
          {Object.values(KEY_BINDINGS).map((b) => (
            <div className="control-row" key={b.label}>
              <dt>{b.label}</dt>
              <dd>{b.description}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="controls-col">
        <h3>Touch {deviceClass !== 'desktop' ? '(your device)' : ''}</h3>
        <dl>
          <div className="control-row">
            <dt>Left stick</dt>
            <dd>Roll &amp; pitch</dd>
          </div>
          <div className="control-row">
            <dt>Right slider</dt>
            <dd>Throttle</dd>
          </div>
          <div className="control-row">
            <dt>◄ ► buttons</dt>
            <dd>Rudder (yaw)</dd>
          </div>
          <div className="control-row">
            <dt>Top bar</dt>
            <dd>Pause · Reset · Settings</dd>
          </div>
        </dl>
        <h3>Gamepad</h3>
        <dl>
          <div className="control-row">
            <dt>Left stick</dt>
            <dd>Roll &amp; pitch</dd>
          </div>
          <div className="control-row">
            <dt>Right stick X</dt>
            <dd>Yaw</dd>
          </div>
          <div className="control-row">
            <dt>Right trigger</dt>
            <dd>Throttle</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/** Modal overlay wrapper around the controls reference. */
export function ControlsHelpOverlay(): JSX.Element {
  const setShowHelp = useStore((s) => s.setShowHelp);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Controls help">
      <div className="panel">
        <div className="panel-header">
          <h2>Controls</h2>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close controls help"
            onClick={() => setShowHelp(false)}
          >
            ✕
          </button>
        </div>
        <ControlsReference />
        <div className="panel-actions">
          <button type="button" className="btn" onClick={() => setShowHelp(false)}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
