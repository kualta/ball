import { test, expect } from "bun:test";
import { smoothTo, smoothed } from "./smooth";

test("smoothing reaches its target at any frame rate without overshoot", () => {
  for (const dt of [1 / 120, 1 / 60, 1 / 30, 0.1]) {
    const state = smoothed();
    let peak = 0;
    for (let t = 0; t < 3; t += dt)
      peak = Math.max(peak, smoothTo(state, 1, 5, dt));
    expect(peak).toBeLessThanOrEqual(1);
    expect(state.value).toBeCloseTo(1, 4);
    expect(Math.abs(state.velocity)).toBeLessThan(1e-3);
  }
});

test("smoothing starts gently instead of jumping", () => {
  const state = smoothed();
  smoothTo(state, 1, 5, 1 / 60);
  const first = state.value;
  smoothTo(state, 1, 5, 1 / 60);
  expect(first).toBeLessThan(0.01);
  expect(state.value - first).toBeGreaterThan(first);
});

test("smoothing is independent of step size", () => {
  const fine = smoothed();
  const coarse = smoothed();
  for (let i = 0; i < 12; i++) smoothTo(fine, 1, 4, 1 / 120);
  smoothTo(coarse, 1, 4, 0.1);
  expect(fine.value).toBeCloseTo(coarse.value, 6);
});
