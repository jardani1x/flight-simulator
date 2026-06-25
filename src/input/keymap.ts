/**
 * Keyboard bindings, documented in one place so the UI help panel and README can
 * stay in sync with the actual handler. Uses KeyboardEvent.code (layout-stable).
 */
export interface KeyBinding {
  /** Human-readable key label(s) for the controls overlay. */
  label: string;
  description: string;
}

export const KEY_BINDINGS: Record<string, KeyBinding> = {
  'W / ↓': { label: 'W / Arrow Down', description: 'Pitch down (nose down)' },
  'S / ↑': { label: 'S / Arrow Up', description: 'Pitch up (nose up)' },
  'A / ←': { label: 'A / Arrow Left', description: 'Roll left' },
  'D / →': { label: 'D / Arrow Right', description: 'Roll right' },
  'Q / E': { label: 'Q / E', description: 'Yaw left / right (rudder)' },
  'Shift / Ctrl': { label: 'Shift / Ctrl', description: 'Throttle up / down' },
  'X / Z': { label: 'X / Z', description: 'Throttle full / idle' },
  Space: { label: 'Space / B', description: 'Wheel brakes (hold)' },
  P: { label: 'P or Esc', description: 'Pause / resume' },
  R: { label: 'R', description: 'Reset flight' },
  H: { label: 'H', description: 'Toggle HUD help' },
};

/** Sets of KeyboardEvent.code values mapped to each control action. */
export const KEYS = {
  pitchUp: ['KeyS', 'ArrowUp'],
  pitchDown: ['KeyW', 'ArrowDown'],
  rollLeft: ['KeyA', 'ArrowLeft'],
  rollRight: ['KeyD', 'ArrowRight'],
  yawLeft: ['KeyQ'],
  yawRight: ['KeyE'],
  throttleUp: ['ShiftLeft', 'ShiftRight'],
  throttleDown: ['ControlLeft', 'ControlRight'],
  throttleFull: ['KeyX'],
  throttleIdle: ['KeyZ'],
  brake: ['Space', 'KeyB'],
  pause: ['KeyP', 'Escape'],
  reset: ['KeyR'],
  help: ['KeyH'],
} as const;
