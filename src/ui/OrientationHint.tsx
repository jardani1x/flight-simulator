/**
 * Non-blocking nudge to rotate a phone into landscape. It never traps the user —
 * the simulator remains fully playable in portrait; this is purely advisory.
 */
export function OrientationHint(): JSX.Element {
  return (
    <div className="orientation-hint" role="status">
      <span aria-hidden="true">📱↻</span> Rotate to landscape for the best view
    </div>
  );
}
