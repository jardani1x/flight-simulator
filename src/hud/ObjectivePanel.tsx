import { useEffect, useRef } from 'react';
import { useSimulation } from '../scene/SimulationContext';
import { formatDistance } from '../mission/missionPlan';

/** Objective text refreshes at ~12 Hz; the heading bug rotates every frame. */
const TEXT_INTERVAL_MS = 80;

/**
 * Beginner objective panel for the guided flight. Shows the current step, a
 * plain-language instruction, a progress bar, a live metric and a heading bug
 * that points toward the active target. Like the rest of the HUD it samples the
 * mutable mission state in a single rAF loop and writes through refs, so it
 * never triggers a React re-render while flying.
 */
export function ObjectivePanel(): JSX.Element {
  const { director } = useSimulation();

  const stepRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const instructionRef = useRef<HTMLParagraphElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const metricRef = useRef<HTMLSpanElement>(null);
  const targetRef = useRef<HTMLSpanElement>(null);
  const arrowRef = useRef<SVGSVGElement>(null);
  const distanceRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const s = director.state;
    let rafId = 0;
    let lastText = 0;
    let lastPhase = -1;
    let lastHint = '';

    const update = (now: number) => {
      // Static-per-phase text: only rewrite when the phase changes.
      if (s.phaseIndex !== lastPhase) {
        lastPhase = s.phaseIndex;
        if (stepRef.current) {
          stepRef.current.textContent = s.complete
            ? 'COMPLETE'
            : `STEP ${Math.min(s.phaseIndex + 1, s.totalSteps)} / ${s.totalSteps}`;
        }
        if (titleRef.current) titleRef.current.textContent = s.title;
        if (instructionRef.current) instructionRef.current.textContent = s.instruction;
      }

      // Heading bug: rotate every frame for smoothness (0° = dead ahead).
      if (arrowRef.current) {
        arrowRef.current.style.transform = `rotate(${s.relativeBearing.toFixed(1)}deg)`;
      }

      if (now - lastText >= TEXT_INTERVAL_MS) {
        lastText = now;
        if (progressRef.current) {
          progressRef.current.style.width = `${Math.round(s.progress * 100)}%`;
        }
        if (metricRef.current) {
          metricRef.current.textContent = s.metricLabel ? `${s.metricLabel} ${s.metricValue}` : '';
        }
        if (targetRef.current) {
          targetRef.current.style.display = s.hasTarget ? 'inline-flex' : 'none';
        }
        if (distanceRef.current && s.hasTarget) {
          distanceRef.current.textContent = formatDistance(s.distance);
        }
        if (hintRef.current && s.hint !== lastHint) {
          lastHint = s.hint;
          hintRef.current.textContent = s.hint;
        }
        if (hintRef.current) hintRef.current.classList.toggle('warn', s.warn);
      }

      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [director]);

  return (
    <div className="objective" role="status" aria-label="Flight objective">
      <div className="objective-head">
        <span className="objective-step" ref={stepRef}>
          STEP 1 / 9
        </span>
        <span className="objective-title" ref={titleRef} />
      </div>
      <p className="objective-instruction" ref={instructionRef} />
      <div className="objective-progress">
        <div className="objective-progress-fill" ref={progressRef} />
      </div>
      <div className="objective-status">
        <span className="objective-metric" ref={metricRef} />
        <span className="objective-target" ref={targetRef}>
          <svg
            ref={arrowRef}
            className="objective-bug"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            aria-hidden="true"
          >
            <polygon points="9,1 15,16 9,12 3,16" fill="currentColor" />
          </svg>
          <span ref={distanceRef} />
        </span>
      </div>
      <p className="objective-hint" ref={hintRef} />
    </div>
  );
}
