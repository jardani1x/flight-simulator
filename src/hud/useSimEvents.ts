import { useEffect, useState } from 'react';
import { useSimulation } from '../scene/SimulationContext';

interface SimEvents {
  crashed: boolean;
}

/**
 * Bridges discrete simulation events (currently "crashed") into React state.
 * Polls the live sim object once per animation frame but only calls setState
 * when the value actually changes, so the UI re-renders at most twice per crash.
 */
export function useSimEvents(): SimEvents {
  const { simulation } = useSimulation();
  const [crashed, setCrashed] = useState(false);

  useEffect(() => {
    let rafId = 0;
    let last = simulation.state.crashed;
    const poll = () => {
      const now = simulation.state.crashed;
      if (now !== last) {
        last = now;
        setCrashed(now);
      }
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafId);
  }, [simulation]);

  return { crashed };
}
