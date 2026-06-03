interface CrashOverlayProps {
  onReset: () => void;
}

/** Shown when the aircraft crashes; the only path forward is to reset. */
export function CrashOverlay({ onReset }: CrashOverlayProps): JSX.Element {
  return (
    <div className="overlay" role="alertdialog" aria-modal="true" aria-label="Crashed">
      <div className="panel panel-narrow crash-panel">
        <h2>Aircraft Lost</h2>
        <p>You hit the ground too hard. Better luck next time, pilot.</p>
        <div className="panel-actions">
          <button type="button" className="btn btn-primary btn-large" onClick={onReset} autoFocus>
            ↺ Reset Flight
          </button>
        </div>
      </div>
    </div>
  );
}
