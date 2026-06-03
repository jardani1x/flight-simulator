import { useStore } from '../state/store';

interface TopBarProps {
  onReset: () => void;
}

/** Persistent in-flight action bar. Buttons are large enough for touch. */
export function TopBar({ onReset }: TopBarProps): JSX.Element {
  const paused = useStore((s) => s.paused);
  const togglePause = useStore((s) => s.togglePause);
  const toggleHelp = useStore((s) => s.toggleHelp);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);

  return (
    <div className="top-bar">
      <button
        type="button"
        className="icon-btn"
        aria-label={paused ? 'Resume' : 'Pause'}
        onClick={togglePause}
      >
        {paused ? '▶' : '❚❚'}
      </button>
      <button type="button" className="icon-btn" aria-label="Reset flight" onClick={onReset}>
        ↺
      </button>
      <button type="button" className="icon-btn" aria-label="Controls help" onClick={toggleHelp}>
        ?
      </button>
      <button
        type="button"
        className="icon-btn"
        aria-label="Settings"
        onClick={() => setSettingsOpen(true)}
      >
        ⚙
      </button>
    </div>
  );
}
