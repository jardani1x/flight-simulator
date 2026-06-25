import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { defaultQualityForDevice, useStore } from './store';

beforeEach(() => {
  localStorage.clear();
  // Reset the store to a pristine, un-hydrated state for each test.
  useStore.setState({
    settings: {
      graphicsQuality: 'high',
      sensitivity: 1,
      invertPitch: false,
      showFps: false,
      aircraftId: 'a320',
    },
    settingsHydrated: false,
  });
});

afterEach(() => localStorage.clear());

describe('defaultQualityForDevice', () => {
  it('maps device classes to sensible presets', () => {
    expect(defaultQualityForDevice('phone')).toBe('low');
    expect(defaultQualityForDevice('tablet')).toBe('medium');
    expect(defaultQualityForDevice('desktop')).toBe('high');
  });
});

describe('applyDeviceDefaults', () => {
  it('applies the device default on first run', () => {
    useStore.getState().applyDeviceDefaults('phone');
    expect(useStore.getState().settings.graphicsQuality).toBe('low');
    expect(useStore.getState().settingsHydrated).toBe(true);
  });

  it('does not override a user choice once hydrated', () => {
    useStore.getState().updateSettings({ graphicsQuality: 'high' });
    useStore.getState().applyDeviceDefaults('phone');
    expect(useStore.getState().settings.graphicsQuality).toBe('high');
  });
});

describe('flight mode', () => {
  it('defaults to guided and starts in the chosen mode', () => {
    useStore.setState({ started: false, mode: 'guided' });
    expect(useStore.getState().mode).toBe('guided');

    useStore.getState().start('free');
    expect(useStore.getState().started).toBe(true);
    expect(useStore.getState().mode).toBe('free');

    useStore.getState().setMode('guided');
    expect(useStore.getState().mode).toBe('guided');
  });
});

describe('settings persistence', () => {
  it('persists updates to localStorage', () => {
    useStore.getState().updateSettings({ sensitivity: 0.7 });
    const raw = localStorage.getItem('skyward.settings.v1');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).sensitivity).toBe(0.7);
  });
});
