import { useCallback, useRef } from 'react';
import { setAxis, setBrake, setThrottle } from './inputState';
import { clamp } from '../physics/mathUtils';

/** Maximum knob travel from centre, in pixels. */
const KNOB_TRAVEL = 42;

/**
 * On-screen controls for touch devices: a left analog stick (roll + pitch), a
 * right vertical throttle slider, and rudder (yaw) buttons. All write raw axes to
 * the shared input state (sensitivity/inversion are applied centrally). Targets
 * are sized generously for fingers.
 */
export function TouchControls(): JSX.Element {
  return (
    <div className="touch-controls" aria-label="Touch flight controls">
      <Joystick />
      <div className="touch-right">
        <ThrottleSlider />
        <div className="touch-right-stack">
          <BrakeButton />
          <RudderButtons />
        </div>
      </div>
    </div>
  );
}

function BrakeButton(): JSX.Element {
  const press = () => setBrake(1);
  const release = () => setBrake(0);
  return (
    <button
      type="button"
      className="brake-btn"
      aria-label="Wheel brakes"
      onPointerDown={press}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
    >
      ✦ BRAKE
    </button>
  );
}

function Joystick(): JSX.Element {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);

  // Visuals are driven imperatively via refs so dragging never re-renders React.
  const updateFromEvent = useCallback((clientX: number, clientY: number) => {
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
    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${dx * KNOB_TRAVEL}px, ${dy * KNOB_TRAVEL}px)`;
    }
    setAxis('touch', 'roll', clamp(dx, -1, 1));
    // Drag up (negative dy) = nose up = positive pitch command.
    setAxis('touch', 'pitch', clamp(-dy, -1, 1));
  }, []);

  const release = useCallback(() => {
    activePointer.current = null;
    if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)';
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
      <div className="joystick-knob" ref={knobRef} />
    </div>
  );
}

function ThrottleSlider(): JSX.Element {
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);

  // Update the fill and the ARIA value via refs (no re-render during drag).
  const updateFromEvent = useCallback((clientY: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const v = clamp(1 - (clientY - rect.top) / rect.height, 0, 1);
    if (fillRef.current) fillRef.current.style.height = `${v * 100}%`;
    track.setAttribute('aria-valuenow', String(Math.round(v * 100)));
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
      aria-valuenow={0}
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
      onPointerUp={() => {
        activePointer.current = null;
      }}
      onPointerCancel={() => {
        activePointer.current = null;
      }}
    >
      <div className="throttle-slider-fill" ref={fillRef} style={{ height: '0%' }} />
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
