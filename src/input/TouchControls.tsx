import { useCallback, useRef, useState } from 'react';
import { setAxis, setThrottle } from './inputState';
import { useStore } from '../state/store';
import { clamp } from '../physics/mathUtils';

/**
 * On-screen controls for touch devices: a left analog stick (roll + pitch), a
 * right vertical throttle slider, and rudder (yaw) buttons. All write directly to
 * the shared input state. Targets are sized generously for fingers.
 */
export function TouchControls(): JSX.Element {
  const sensitivity = useStore((s) => s.settings.sensitivity);
  const invertPitch = useStore((s) => s.settings.invertPitch);

  return (
    <div className="touch-controls" aria-label="Touch flight controls">
      <Joystick sensitivity={sensitivity} invertPitch={invertPitch} />
      <div className="touch-right">
        <ThrottleSlider />
        <RudderButtons />
      </div>
    </div>
  );
}

function Joystick({
  sensitivity,
  invertPitch,
}: {
  sensitivity: number;
  invertPitch: boolean;
}): JSX.Element {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const activePointer = useRef<number | null>(null);

  const updateFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const base = baseRef.current;
      if (!base) return;
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const radius = rect.width / 2;
      let dx = (clientX - cx) / radius;
      let dy = (clientY - cy) / radius;
      const mag = Math.hypot(dx, dy);
      if (mag > 1) {
        dx /= mag;
        dy /= mag;
      }
      setKnob({ x: dx, y: dy });
      const roll = clamp(dx, -1, 1) * sensitivity;
      // Drag up (negative dy) = nose up = positive pitch command.
      let pitch = clamp(-dy, -1, 1) * sensitivity;
      if (invertPitch) pitch = -pitch;
      setAxis('touch', 'roll', roll);
      setAxis('touch', 'pitch', pitch);
    },
    [sensitivity, invertPitch],
  );

  const release = useCallback(() => {
    activePointer.current = null;
    setKnob({ x: 0, y: 0 });
    setAxis('touch', 'roll', 0);
    setAxis('touch', 'pitch', 0);
  }, []);

  return (
    <div
      ref={baseRef}
      className="joystick"
      role="application"
      aria-label="Roll and pitch joystick"
      onPointerDown={(e) => {
        activePointer.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        updateFromEvent(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activePointer.current !== e.pointerId) return;
        updateFromEvent(e.clientX, e.clientY);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div
        className="joystick-knob"
        style={{ transform: `translate(${knob.x * 42}px, ${knob.y * 42}px)` }}
      />
    </div>
  );
}

function ThrottleSlider(): JSX.Element {
  const trackRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);
  const activePointer = useRef<number | null>(null);

  const updateFromEvent = useCallback((clientY: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const v = clamp(1 - (clientY - rect.top) / rect.height, 0, 1);
    setValue(v);
    setThrottle(v);
  }, []);

  return (
    <div
      ref={trackRef}
      className="throttle-slider"
      role="slider"
      aria-label="Throttle"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      tabIndex={0}
      onPointerDown={(e) => {
        activePointer.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        updateFromEvent(e.clientY);
      }}
      onPointerMove={(e) => {
        if (activePointer.current !== e.pointerId) return;
        updateFromEvent(e.clientY);
      }}
      onPointerUp={(e) => {
        activePointer.current = null;
        void e;
      }}
      onPointerCancel={() => {
        activePointer.current = null;
      }}
    >
      <div className="throttle-slider-fill" style={{ height: `${value * 100}%` }} />
      <span className="throttle-slider-label">THR</span>
    </div>
  );
}

function RudderButtons(): JSX.Element {
  const press = (value: number) => () => setAxis('touch', 'yaw', value);
  const release = () => setAxis('touch', 'yaw', 0);

  return (
    <div className="rudder">
      <button
        type="button"
        className="rudder-btn"
        aria-label="Yaw left"
        onPointerDown={press(-1)}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
      >
        ◄
      </button>
      <button
        type="button"
        className="rudder-btn"
        aria-label="Yaw right"
        onPointerDown={press(1)}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
      >
        ►
      </button>
    </div>
  );
}
