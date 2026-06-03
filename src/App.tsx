import { useCallback, useMemo } from 'react';
import { SceneRoot } from './scene/SceneRoot';
import { SimulationProvider, useSimulation } from './scene/SimulationContext';
import { Hud } from './hud/Hud';
import { useSimEvents } from './hud/useSimEvents';
import { TouchControls } from './input/TouchControls';
import { useKeyboard } from './input/useKeyboard';
import { useGamepad } from './input/useGamepad';
import { useDeviceClass } from './input/useDeviceClass';
import { useStore } from './state/store';
import { MainMenu } from './ui/MainMenu';
import { PauseMenu } from './ui/PauseMenu';
import { CrashOverlay } from './ui/CrashOverlay';
import { SettingsPanel } from './ui/SettingsPanel';
import { ControlsHelpOverlay } from './ui/ControlsHelp';
import { TopBar } from './ui/TopBar';
import { OrientationHint } from './ui/OrientationHint';

export function App(): JSX.Element {
  return (
    <SimulationProvider>
      <Game />
    </SimulationProvider>
  );
}

function Game(): JSX.Element {
  const { reset } = useSimulation();
  const { isTouch, isPortrait, deviceClass } = useDeviceClass();

  const started = useStore((s) => s.started);
  const paused = useStore((s) => s.paused);
  const showHelp = useStore((s) => s.showHelp);
  const settingsOpen = useStore((s) => s.settingsOpen);
  const start = useStore((s) => s.start);

  const { crashed } = useSimEvents();

  // Stable handler object so the keyboard effect doesn't re-subscribe each render.
  const keyHandlers = useMemo(() => ({ onReset: reset }), [reset]);
  useKeyboard(keyHandlers);
  useGamepad();

  const handleStart = useCallback(() => {
    reset();
    start();
  }, [reset, start]);

  const showPortraitHint = started && isTouch && deviceClass === 'phone' && isPortrait;

  return (
    <div className="app">
      {/* The 3D world renders behind everything, including the menu. */}
      <SceneRoot />

      {started && (
        <>
          <Hud />
          <TopBar onReset={reset} />
          {isTouch && !paused && !crashed && <TouchControls />}
          {showPortraitHint && <OrientationHint />}
        </>
      )}

      {!started && <MainMenu onStart={handleStart} />}

      {started && paused && !crashed && (
        <PauseMenu onResume={() => useStore.getState().setPaused(false)} onReset={reset} />
      )}

      {started && crashed && <CrashOverlay onReset={reset} />}

      {settingsOpen && <SettingsPanel />}
      {showHelp && <ControlsHelpOverlay />}
    </div>
  );
}
