import { useEffect, useState } from 'react';
import { useSimulation } from '../scene/SimulationContext';

interface MissionEvents {
  complete: boolean;
}

/**
 * Bridges the discrete "mission complete" event from the mutable mission state
 * into React state. Polls once per animation frame but only calls setState when
 * the value actually changes (mirrors {@link useSimEvents} for crashes).
 */
export function useMissionEvents(): MissionEvents {
  const { director } = useSimulation();
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let rafId = 0;
    let last = director.state.complete;
    const poll = () => {
      const now = director.state.complete;
      if (now !== last) {
        last = now;
        setComplete(now);
      }
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafId);
  }, [director]);

  return { complete };
}
