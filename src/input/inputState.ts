import type { ControlInput } from '../core/types';
import { clamp } from '../physics/mathUtils';
import { useStore } from '../state/store';

/**
 * A single mutable control-input object shared by every input source and read by
 * the simulation in the frame loop. Sharing one object (rather than React state)
 * means high-frequency control changes never trigger re-renders.
 *
 * Each source writes into its own "channel" so sources compose instead of
 * overwriting one another (e.g. touch joystick + keyboard simultaneously).
 */
interface Channel {
  pitch: number;
  roll: number;
  yaw: number;
}

const keyboardChannel: Channel = { pitch: 0, roll: 0, yaw: 0 };
const touchChannel: Channel = { pitch: 0, roll: 0, yaw: 0 };
const gamepadChannel: Channel = { pitch: 0, roll: 0, yaw: 0 };

/** Absolute throttle, owned globally because all sources set it as a target. */
let throttle = 0;

/** Wheel-brake target [0, 1], owned globally like throttle. */
let brake = 0;

/** The merged, clamped control input read by the simulation. */
const merged: ControlInput = { pitch: 0, roll: 0, yaw: 0, throttle: 0, brake: 0 };

export type InputChannel = 'keyboard' | 'touch' | 'gamepad';

const channels: Record<InputChannel, Channel> = {
  keyboard: keyboardChannel,
  touch: touchChannel,
  gamepad: gamepadChannel,
};

/** Set an axis value for a given input source. Values are clamped to [-1, 1]. */
export function setAxis(source: InputChannel, axis: 'pitch' | 'roll' | 'yaw', value: number): void {
  channels[source][axis] = clamp(value, -1, 1);
}

/** Set the absolute throttle target [0, 1]. */
export function setThrottle(value: number): void {
  throttle = clamp(value, 0, 1);
}

/** Adjust throttle by a delta (used by keyboard hold-to-change). */
export function nudgeThrottle(delta: number): void {
  throttle = clamp(throttle + delta, 0, 1);
}

export function getThrottle(): number {
  return throttle;
}

/** Set the absolute wheel-brake target [0, 1]. */
export function setBrake(value: number): void {
  brake = clamp(value, 0, 1);
}

export function getBrake(): number {
  return brake;
}

/** Zero every axis channel and the brakes — used on reset / control release. */
export function resetInput(): void {
  for (const key of Object.keys(channels) as InputChannel[]) {
    channels[key].pitch = 0;
    channels[key].roll = 0;
    channels[key].yaw = 0;
  }
  brake = 0;
}

/**
 * Merge all channels into a single clamped ControlInput, applying the user's
 * sensitivity and pitch-inversion settings centrally (sources write raw axes).
 * Returns a stable object reference (mutated in place) so it can be read every
 * frame without allocating.
 */
export function readControlInput(): ControlInput {
  const { sensitivity, invertPitch } = useStore.getState().settings;

  let pitch = keyboardChannel.pitch + touchChannel.pitch + gamepadChannel.pitch;
  if (invertPitch) pitch = -pitch;
  const roll = keyboardChannel.roll + touchChannel.roll + gamepadChannel.roll;
  const yaw = keyboardChannel.yaw + touchChannel.yaw + gamepadChannel.yaw;

  merged.pitch = clamp(pitch * sensitivity, -1, 1);
  merged.roll = clamp(roll * sensitivity, -1, 1);
  merged.yaw = clamp(yaw * sensitivity, -1, 1);
  merged.throttle = throttle;
  merged.brake = brake;
  return merged;
}
