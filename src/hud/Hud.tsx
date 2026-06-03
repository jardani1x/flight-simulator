import { useEffect, useRef } from 'react';
import { AttitudeIndicator } from './AttitudeIndicator';
import { useSimulation } from '../scene/SimulationContext';
import { perf } from '../scene/perf';
import { useStore } from '../state/store';
import { M_TO_FEET, MS_TO_FPM, MS_TO_KNOTS } from '../config/constants';

/**
 * Heads-up display. All numeric readouts are updated by a single rAF loop that
 * samples the live telemetry/perf objects and writes to DOM nodes via refs, so
 * the HUD never triggers React re-renders during flight.
 */
export function Hud(): JSX.Element {
  const { simulation } = useSimulation();
  const showFps = useStore((s) => s.settings.showFps);

  const airspeedRef = useRef<HTMLSpanElement>(null);
  const altitudeRef = useRef<HTMLSpanElement>(null);
  const headingRef = useRef<HTMLSpanElement>(null);
  const vspeedRef = useRef<HTMLSpanElement>(null);
  const throttleFillRef = useRef<HTMLDivElement>(null);
  const throttleTextRef = useRef<HTMLSpanElement>(null);
  const stallRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const t = simulation.telemetry;
    let rafId = 0;

    const update = () => {
      if (airspeedRef.current) {
        airspeedRef.current.textContent = Math.round(t.airspeed * MS_TO_KNOTS).toString();
      }
      if (altitudeRef.current) {
        altitudeRef.current.textContent = Math.round(t.altitude * M_TO_FEET).toLocaleString();
      }
      if (headingRef.current) {
        headingRef.current.textContent = Math.round(t.heading).toString().padStart(3, '0');
      }
      if (vspeedRef.current) {
        const fpm = Math.round(t.verticalSpeed * MS_TO_FPM);
        vspeedRef.current.textContent = `${fpm > 0 ? '+' : ''}${fpm.toLocaleString()}`;
      }
      if (throttleFillRef.current) {
        throttleFillRef.current.style.height = `${Math.round(t.throttle * 100)}%`;
      }
      if (throttleTextRef.current) {
        throttleTextRef.current.textContent = `${Math.round(t.throttle * 100)}%`;
      }
      if (stallRef.current) {
        stallRef.current.classList.toggle('visible', t.stalled);
      }
      if (showFps && fpsRef.current) {
        fpsRef.current.textContent = `${Math.round(perf.fps)} fps`;
      }
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [simulation, showFps]);

  return (
    <div className="hud" aria-hidden="false">
      {showFps && (
        <div className="hud-fps" role="status" aria-label="Frames per second">
          <span ref={fpsRef}>0 fps</span>
        </div>
      )}

      {/* Airspeed */}
      <div className="hud-gauge hud-airspeed" aria-label="Airspeed in knots">
        <div className="hud-gauge-value">
          <span ref={airspeedRef}>0</span>
        </div>
        <div className="hud-gauge-label">KTS</div>
      </div>

      {/* Altitude */}
      <div className="hud-gauge hud-altitude" aria-label="Altitude in feet">
        <div className="hud-gauge-value">
          <span ref={altitudeRef}>0</span>
        </div>
        <div className="hud-gauge-label">FT</div>
      </div>

      {/* Heading */}
      <div className="hud-gauge hud-heading" aria-label="Heading in degrees">
        <div className="hud-gauge-value">
          <span ref={headingRef}>000</span>°
        </div>
        <div className="hud-gauge-label">HDG</div>
      </div>

      {/* Vertical speed */}
      <div className="hud-gauge hud-vspeed" aria-label="Vertical speed in feet per minute">
        <div className="hud-gauge-value">
          <span ref={vspeedRef}>0</span>
        </div>
        <div className="hud-gauge-label">FT/MIN</div>
      </div>

      {/* Throttle */}
      <div className="hud-throttle" aria-label="Throttle setting">
        <div className="hud-throttle-bar">
          <div className="hud-throttle-fill" ref={throttleFillRef} />
        </div>
        <div className="hud-throttle-label">
          THR <span ref={throttleTextRef}>0%</span>
        </div>
      </div>

      {/* Attitude indicator */}
      <div className="hud-attitude">
        <AttitudeIndicator telemetry={simulation.telemetry} />
      </div>

      {/* Stall warning */}
      <div className="hud-stall" ref={stallRef} role="alert">
        STALL
      </div>
    </div>
  );
}
