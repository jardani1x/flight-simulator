/**
 * Shared, mutable performance metrics. Written by the render loop and sampled by
 * the HUD without going through React state, so the FPS counter never triggers
 * re-renders of the scene.
 */
export const perf = {
  fps: 0,
  /** Exponential moving average of frame time in milliseconds. */
  frameMs: 16.7,
};

/** Feed a new frame delta (seconds) into the rolling averages. */
export function recordFrame(delta: number): void {
  const ms = delta * 1000;
  // Smooth so the readout is stable rather than jittery.
  perf.frameMs += (ms - perf.frameMs) * 0.1;
  perf.fps = perf.frameMs > 0 ? 1000 / perf.frameMs : 0;
}
