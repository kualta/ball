export interface Smoothed {
  value: number;
  velocity: number;
}

export function smoothed(value = 0): Smoothed {
  return { value, velocity: 0 };
}

// Critically damped spring, solved exactly so it stays stable at any frame rate.
// Unlike exponential damping, velocity stays continuous: motion eases in and out.
export function smoothTo(
  state: Smoothed,
  target: number,
  frequency: number,
  dt: number,
): number {
  const offset = state.value - target;
  const decay = Math.exp(-frequency * dt);
  const carry = (state.velocity + frequency * offset) * dt;
  state.velocity = (state.velocity - frequency * carry) * decay;
  state.value = target + (offset + carry) * decay;
  return state.value;
}
