import { test, expect } from "bun:test";
import { Quaternion, Vector3 } from "three";
import { stepAnswerSettle, stepRotationSpring } from "./rotation-spring";
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

test("answer arrival preserves spin direction and decelerates without a snap", () => {
  for (const dt of [1 / 120, 1 / 60, 1 / 30]) {
    const axis = new Vector3(1, 2, -0.3).normalize();
    const q = new Quaternion().setFromAxisAngle(axis, 2.8);
    const before = q.clone();
    const velocity = axis.clone().multiplyScalar(12);
    stepAnswerSettle(q, velocity, 0, dt);
    const travel = q.clone().multiply(before.invert());
    expect(new Vector3(travel.x, travel.y, travel.z).dot(axis)).toBeGreaterThan(
      0,
    );
    expect(velocity.length()).toBeGreaterThan(12 * 0.9);
    expect(velocity.length()).toBeLessThan(12);
    expect(travel.angleTo(new Quaternion())).toBeLessThanOrEqual(12 * dt);
  }
});

test("response settling converges smoothly at different frame rates and launch speeds", () => {
  for (const dt of [1 / 120, 1 / 60, 1 / 30, 0.1]) {
    for (const speed of [5, 8, 12]) {
      for (const angle of [0.1, 2, Math.PI, 5]) {
        const q = new Quaternion().setFromAxisAngle(
          new Vector3(1, 2, 3).normalize(),
          angle,
        );
        const velocity = new Vector3(-1, 2, 0.3)
          .normalize()
          .multiplyScalar(speed);
        for (let t = 0; t < 2.5; t += dt) stepAnswerSettle(q, velocity, t, dt);
        expect(q.angleTo(new Quaternion())).toBeLessThan(0.005);
        expect(velocity.length()).toBeLessThan(0.025);
      }
    }
  }
});
