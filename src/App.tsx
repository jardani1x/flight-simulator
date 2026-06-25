import { useCallback, useMemo } from 'react';
import { SceneRoot } from './scene/SceneRoot';
import { SimulationProvider, useSimulation } from './scene/SimulationContext';
import { Hud } from './hud/Hud';
import { ObjectivePanel } from './hud/ObjectivePanel';
import { useSimEvents } from './hud/useSimEvents';
import { useMissionEvents } from './hud/useMissionEvents';
import { TouchControls } from './input/TouchControls';
import { useKeyboard } from './input/useKeyboard';
import { useGamepad } from './input/useGamepad';
import { useDeviceClass } from './input/useDeviceClass';
import { useStore } from './state/store';
import type { FlightMode } from './state/store';
import { MainMenu } from './ui/MainMenu';
import { PauseMenu } from './ui/PauseMenu';
import { CrashOverlay } from './ui/CrashOverlay';
import { MissionCompleteOverlay } from './ui/MissionCompleteOverlay';
import { SettingsPanel } from './ui/SettingsPanel';
import { ControlsHelpOverlay } from './ui/ControlsHelp';
import { TopBar } from './ui/TopBar';
import { OrientationHint } from './ui/OrientationHint';
import { ErrorBoundary, isWebGLAvailable } from './ui/ErrorBoundary';

export function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <SimulationProvider>
        <Game />
      </SimulationProvider>
    </ErrorBoundary>
  );
}

/** Shown when WebGL is unavailable, before we ever try to create a context. */
function WebGLUnavailable(): JSX.Element {
  return (
    <div className="fatal-screen" role="alert">
      <div className="panel panel-narrow">
        <h2>WebGL is required</h2>
        <p>
          This flight simulator needs WebGL, which isn&apos;t available in this browser. Try
          enabling hardware acceleration or using an up-to-date browser.
        </p>
      </div>
    </div>
  );
}

function Game(): JSX.Element {
  const { reset } = useSimulation();
  const { isTouch, isPortrait, deviceClass } = useDeviceClass();
  // Detect WebGL once so we can show a clean message rather than a blank canvas.
  const webglOk = useMemo(() => isWebGLAvailable(), []);

  const started = useStore((s) => s.started);
  const paused = useStore((s) => s.paused);
  const mode = useStore((s) => s.mode);
  const showHelp = useStore((s) => s.showHelp);
  const settingsOpen = useStore((s) => s.settingsOpen);
  const start = useStore((s) => s.start);

  const { crashed } = useSimEvents();
  const { complete } = useMissionEvents();

  // Stable handler object so the keyboard effect doesn't re-subscribe each render.
  const keyHandlers = useMemo(() => ({ onReset: reset }), [reset]);
  useKeyboard(keyHandlers);
  useGamepad();

  const handleStart = useCallback(
    (nextMode: FlightMode) => {
      reset();
      start(nextMode);
    },
    [reset, start],
  );

  const guided = mode === 'guided';
  const missionComplete = guided && complete && !crashed;
  const showPortraitHint = started && isTouch && deviceClass === 'phone' && isPortrait;

  if (!webglOk) return <WebGLUnavailable />;

  return (
    <div className="app">
      {/* The 3D world renders behind everything, including the menu. */}
      <SceneRoot />

      {started && (
        <>
          <Hud />
          {guided && <ObjectivePanel />}
          <TopBar onReset={reset} />
          {isTouch && !paused && !crashed && !missionComplete && <TouchControls />}
          {showPortraitHint && <OrientationHint />}
        </>
      )}

      {!started && <MainMenu onStart={handleStart} />}

      {started && paused && !crashed && !missionComplete && (
        <PauseMenu onResume={() => useStore.getState().setPaused(false)} onReset={reset} />
      )}

      {started && crashed && <CrashOverlay onReset={reset} />}

      {started && missionComplete && (
        <MissionCompleteOverlay
          onReplay={reset}
          onFreeFlight={() => useStore.getState().setPaused(false)}
        />
      )}

      {settingsOpen && <SettingsPanel />}
      {showHelp && <ControlsHelpOverlay />}
    </div>
  );
}
