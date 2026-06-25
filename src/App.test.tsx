import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';
import { useStore } from './state/store';

// The real SceneRoot needs a WebGL context, which jsdom does not provide. Mock
// it out so this remains a fast, deterministic mount/smoke test. The full WebGL
// boot is covered by the Playwright e2e smoke test instead.
vi.mock('./scene/SceneRoot', () => ({
  SceneRoot: () => null,
}));

// jsdom has no WebGL, so force the capability check to pass for the smoke test
// while keeping the real ErrorBoundary implementation.
vi.mock('./ui/ErrorBoundary', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./ui/ErrorBoundary')>();
  return { ...actual, isWebGLAvailable: () => true };
});

beforeEach(() => {
  // Reset the shared store so tests don't leak menu/flight state into each other.
  useStore.setState({
    started: false,
    paused: false,
    mode: 'guided',
    showHelp: false,
    settingsOpen: false,
  });
});

afterEach(cleanup);

describe('App smoke test', () => {
  it('renders the main menu with guided and free options on load', () => {
    render(<App />);
    expect(screen.getByText('SKYWARD')).toBeTruthy();
    expect(screen.getByRole('button', { name: /start flight/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /free flight/i })).toBeTruthy();
  });

  it('shows the HUD and the guided objective panel when starting a guided flight', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /start flight/i }));
    expect(screen.getByLabelText(/airspeed in knots/i)).toBeTruthy();
    expect(screen.getByLabelText(/altitude in feet/i)).toBeTruthy();
    expect(screen.getByLabelText(/attitude indicator/i)).toBeTruthy();
    // The beginner objective panel is present in guided mode.
    expect(screen.getByLabelText(/flight objective/i)).toBeTruthy();
  });

  it('starts free flight without the guided objective panel', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /free flight/i }));
    expect(screen.getByLabelText(/airspeed in knots/i)).toBeTruthy();
    expect(screen.queryByLabelText(/flight objective/i)).toBeNull();
  });

  it('opens settings from the main menu', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    expect(screen.getByRole('dialog', { name: /settings/i })).toBeTruthy();
  });
});
