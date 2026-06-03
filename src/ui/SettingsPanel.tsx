import type { GraphicsQuality } from '../core/types';
import { useStore } from '../state/store';

const QUALITY_OPTIONS: { value: GraphicsQuality; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

/** Settings modal: graphics quality, control sensitivity and toggles. */
export function SettingsPanel(): JSX.Element {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Settings">
      <div className="panel">
        <div className="panel-header">
          <h2>Settings</h2>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close settings"
            onClick={() => setSettingsOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="setting">
          <label id="quality-label">Graphics quality</label>
          <div className="segmented" role="group" aria-labelledby="quality-label">
            {QUALITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`segment ${settings.graphicsQuality === opt.value ? 'active' : ''}`}
                aria-pressed={settings.graphicsQuality === opt.value}
                onClick={() => updateSettings({ graphicsQuality: opt.value })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="setting">
          <label htmlFor="sensitivity">
            Control sensitivity: {settings.sensitivity.toFixed(2)}×
          </label>
          <input
            id="sensitivity"
            type="range"
            min={0.3}
            max={1.5}
            step={0.05}
            value={settings.sensitivity}
            onChange={(e) => updateSettings({ sensitivity: Number(e.target.value) })}
          />
        </div>

        <div className="setting setting-row">
          <label htmlFor="invert-pitch">Invert pitch axis</label>
          <input
            id="invert-pitch"
            type="checkbox"
            checked={settings.invertPitch}
            onChange={(e) => updateSettings({ invertPitch: e.target.checked })}
          />
        </div>

        <div className="setting setting-row">
          <label htmlFor="show-fps">Show FPS / performance</label>
          <input
            id="show-fps"
            type="checkbox"
            checked={settings.showFps}
            onChange={(e) => updateSettings({ showFps: e.target.checked })}
          />
        </div>

        <div className="panel-actions">
          <button type="button" className="btn" onClick={() => setSettingsOpen(false)}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
