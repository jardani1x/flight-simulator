import { describe, expect, it, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';

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

afterEach(cleanup);

describe('App smoke test', () => {
  it('renders the main menu on load', () => {
    render(<App />);
    expect(screen.getByText('SKYWARD')).toBeTruthy();
    expect(screen.getByRole('button', { name: /start flight/i })).toBeTruthy();
  });

  it('enters the cockpit and shows the HUD when starting a flight', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /start flight/i }));
    // HUD gauges should now be present.
    expect(screen.getByLabelText(/airspeed in knots/i)).toBeTruthy();
    expect(screen.getByLabelText(/altitude in feet/i)).toBeTruthy();
    expect(screen.getByLabelText(/attitude indicator/i)).toBeTruthy();
  });

  it('opens settings from the main menu', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    expect(screen.getByRole('dialog', { name: /settings/i })).toBeTruthy();
  });
});
