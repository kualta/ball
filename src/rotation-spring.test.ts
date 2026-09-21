import { test, expect } from "bun:test";
import { Quaternion, Vector3 } from "three";
import { stepRotationSpring } from "./rotation-spring";
test("spring returns arbitrary releases to the front at different frame rates", () => {
  for (const dt of [1 / 60, 1 / 30, 0.1])
    for (const angle of [0.2, 2, Math.PI, 5]) {
      const q = new Quaternion().setFromAxisAngle(
        new Vector3(1, 2, 3).normalize(),
        angle,
      );
      const velocity = new Vector3(3, -2, 1);
      for (let t = 0; t < 5; t += dt) stepRotationSpring(q, velocity, dt);
      expect(q.angleTo(new Quaternion())).toBeLessThan(0.001);
      expect(velocity.length()).toBeLessThan(0.001);
    }
});
test("spring has a damped overshoot rather than a linear reset", () => {
  const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.8);
  const velocity = new Vector3();
  let crossed = false;
  for (let i = 0; i < 180; i++) {
    stepRotationSpring(q, velocity, 1 / 60);
    if (q.y < -0.001) crossed = true;
  }
  expect(crossed).toBe(true);
  expect(q.angleTo(new Quaternion())).toBeLessThan(0.001);
});
