/* eslint-disable react-refresh/only-export-components -- provider + hook are intentionally colocated */
import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react';
import { Simulation } from '../physics/Simulation';
import { resetInput, setThrottle } from '../input/inputState';
import { useStore } from '../state/store';

interface SimulationContextValue {
  simulation: Simulation;
  /** Reset the flight: aircraft to runway, inputs cleared, sim un-paused. */
  reset: () => void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: ReactNode }): JSX.Element {
  const simRef = useRef<Simulation>();
  if (!simRef.current) simRef.current = new Simulation();

  const value = useMemo<SimulationContextValue>(() => {
    const simulation = simRef.current!;
    return {
      simulation,
      reset: () => {
        simulation.reset();
        resetInput();
        setThrottle(0);
        useStore.getState().setPaused(false);
      },
    };
  }, []);

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation(): SimulationContextValue {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used within a SimulationProvider');
  return ctx;
}
