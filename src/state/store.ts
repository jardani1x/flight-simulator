import { create } from 'zustand';
import type { DeviceClass, GraphicsQuality } from '../core/types';

const SETTINGS_STORAGE_KEY = 'skyward.settings.v1';

export interface Settings {
  graphicsQuality: GraphicsQuality;
  /** Control sensitivity multiplier [0.3, 1.5]. */
  sensitivity: number;
  invertPitch: boolean;
  /** Show the FPS / debug overlay. */
  showFps: boolean;
}

export interface AppState {
  /** Whether the player has left the main menu and entered the cockpit. */
  started: boolean;
  paused: boolean;
  /** Controls-help overlay visibility. */
  showHelp: boolean;
  settingsOpen: boolean;
  deviceClass: DeviceClass;
  settings: Settings;

  // actions
  start: () => void;
  setPaused: (paused: boolean) => void;
  togglePause: () => void;
  toggleHelp: () => void;
  setShowHelp: (show: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setDeviceClass: (deviceClass: DeviceClass) => void;
  updateSettings: (patch: Partial<Settings>) => void;
}

const DEFAULT_SETTINGS: Settings = {
  graphicsQuality: 'high',
  sensitivity: 1,
  invertPitch: false,
  showFps: false,
};

function loadSettings(): Settings {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function persistSettings(settings: Settings): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore quota / private-mode errors — persistence is best-effort.
  }
}

/** Pick a sensible default graphics quality for the detected device. */
export function defaultQualityForDevice(deviceClass: DeviceClass): GraphicsQuality {
  switch (deviceClass) {
    case 'phone':
      return 'low';
    case 'tablet':
      return 'medium';
    default:
      return 'high';
  }
}

export const useStore = create<AppState>((set, get) => ({
  started: false,
  paused: false,
  showHelp: false,
  settingsOpen: false,
  deviceClass: 'desktop',
  settings: loadSettings(),

  start: () => set({ started: true, paused: false }),
  setPaused: (paused) => set({ paused }),
  togglePause: () => set((s) => ({ paused: !s.paused })),
  toggleHelp: () => set((s) => ({ showHelp: !s.showHelp })),
  setShowHelp: (show) => set({ showHelp: show }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setDeviceClass: (deviceClass) => set({ deviceClass }),
  updateSettings: (patch) => {
    const next = { ...get().settings, ...patch };
    persistSettings(next);
    set({ settings: next });
  },
}));
