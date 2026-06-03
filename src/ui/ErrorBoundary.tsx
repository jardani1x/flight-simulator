import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/**
 * Catches render-time errors (most importantly a failed WebGL context) and shows
 * a friendly recovery screen instead of a blank page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    // Surface for diagnostics; not user-facing.
    console.error('Simulator crashed:', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="fatal-screen" role="alert">
        <div className="panel panel-narrow">
          <h2>Unable to start the simulator</h2>
          <p>
            Something went wrong while loading the 3D scene. Your browser or device may not support
            WebGL, or hardware acceleration may be disabled.
          </p>
          <p className="fatal-detail">{this.state.message}</p>
          <div className="panel-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}

/** Feature-detect WebGL so we can show a clean message instead of throwing. */
export function isWebGLAvailable(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}
