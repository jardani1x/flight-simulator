/* eslint-disable react-refresh/only-export-components -- provider + hook are intentionally colocated */
import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react';
import { Simulation } from '../physics/Simulation';
import { FlightDirector } from '../mission/FlightDirector';
import { resetInput, setThrottle } from '../input/inputState';
import { useStore } from '../state/store';

interface SimulationContextValue {
  simulation: Simulation;
  /** Guided-flight mission director (idle in free-flight mode). */
  director: FlightDirector;
  /** Reset the flight: aircraft to the apron, inputs cleared, sim un-paused. */
  reset: () => void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: ReactNode }): JSX.Element {
  const simRef = useRef<Simulation>();
  if (!simRef.current) simRef.current = new Simulation();
  const directorRef = useRef<FlightDirector>();
  if (!directorRef.current) directorRef.current = new FlightDirector();

  const value = useMemo<SimulationContextValue>(() => {
    const simulation = simRef.current!;
    const director = directorRef.current!;
    return {
      simulation,
      director,
      reset: () => {
        simulation.reset();
        director.reset();
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
