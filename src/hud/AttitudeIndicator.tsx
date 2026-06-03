import { useEffect, useRef } from 'react';
import type { Telemetry } from '../core/types';
import { radToDeg } from '../physics/mathUtils';

interface AttitudeIndicatorProps {
  /** Live telemetry object, sampled each frame (not React state). */
  telemetry: Telemetry;
  size?: number;
}

/** Pixels of vertical horizon travel per degree of pitch. */
const PITCH_PIXELS_PER_DEG = 2.2;

/**
 * A simplified artificial horizon / attitude indicator. The sky/ground disc
 * rotates with bank and slides with pitch, while fixed aircraft reference marks
 * stay put. Updated directly via refs inside a rAF loop to avoid re-renders.
 */
export function AttitudeIndicator({ telemetry, size = 120 }: AttitudeIndicatorProps): JSX.Element {
  const horizonRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let rafId = 0;
    const update = () => {
      const g = horizonRef.current;
      if (g) {
        const rollDeg = radToDeg(telemetry.roll);
        const pitchDeg = radToDeg(telemetry.pitch);
        const offset = pitchDeg * PITCH_PIXELS_PER_DEG;
        // Rotate by bank, translate by pitch; horizon moves opposite to nose.
        g.setAttribute('transform', `rotate(${-rollDeg} 60 60) translate(0 ${offset})`);
      }
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [telemetry]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Attitude indicator showing pitch and bank"
      className="attitude"
    >
      <defs>
        <clipPath id="att-clip">
          <circle cx="60" cy="60" r="52" />
        </clipPath>
      </defs>

      <circle cx="60" cy="60" r="54" fill="#0a0f16" stroke="#3a4a5a" strokeWidth="3" />

      <g clipPath="url(#att-clip)">
        {/* Moving sky/ground disc */}
        <g ref={horizonRef}>
          <rect x="-120" y="-200" width="360" height="260" fill="#2f7fd1" />
          <rect x="-120" y="60" width="360" height="260" fill="#6b4a2a" />
          <line x1="-120" y1="60" x2="240" y2="60" stroke="#ffffff" strokeWidth="2" />
          {/* Pitch ladder */}
          {[-20, -10, 10, 20].map((p) => (
            <line
              key={p}
              x1={48}
              x2={72}
              y1={60 - p * PITCH_PIXELS_PER_DEG}
              y2={60 - p * PITCH_PIXELS_PER_DEG}
              stroke="#cfe3f5"
              strokeWidth="1.5"
            />
          ))}
        </g>
      </g>

      {/* Fixed aircraft reference */}
      <g stroke="#ffd34d" strokeWidth="3" fill="none">
        <line x1="30" y1="60" x2="48" y2="60" />
        <line x1="72" y1="60" x2="90" y2="60" />
        <circle cx="60" cy="60" r="2.5" fill="#ffd34d" stroke="none" />
      </g>

      {/* Bank pointer */}
      <polygon points="60,8 56,16 64,16" fill="#ffd34d" />
    </svg>
  );
}
