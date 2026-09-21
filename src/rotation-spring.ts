import { Quaternion, Vector3 } from "three";

export function stepRotationSpring(
  rotation: Quaternion,
  velocity: Vector3,
  dt: number,
  stiffness = 42,
  damping = 8,
): void {
  const steps = Math.max(1, Math.ceil(Math.min(dt, 0.12) * 120));
  const h = Math.min(dt, 0.12) / steps;
  const axis = new Vector3();
  const delta = new Quaternion();
  for (let i = 0; i < steps; i++) {
    const sign = rotation.w < 0 ? -1 : 1;
    axis.set(rotation.x * sign, rotation.y * sign, rotation.z * sign);
    const length = axis.length();
    const angle = 2 * Math.atan2(length, Math.abs(rotation.w));
    if (length > 1e-8) axis.multiplyScalar(angle / length);
    velocity
      .addScaledVector(axis, -stiffness * h)
      .multiplyScalar(Math.exp(-damping * h));
    const speed = velocity.length();
    if (speed > 1e-8) {
      axis.copy(velocity).divideScalar(speed);
      delta.setFromAxisAngle(axis, speed * h);
      rotation.premultiply(delta).normalize();
    }
  }
  if (1 - Math.abs(rotation.w) < 1e-9 && velocity.lengthSq() < 1e-7) {
    rotation.identity();
    velocity.set(0, 0, 0);
  }
}

export function stepAnswerSettle(
  rotation: Quaternion,
  velocity: Vector3,
  elapsed: number,
  dt: number,
): void {
  const duration = Math.min(dt, 0.12);
  const steps = Math.max(1, Math.ceil(duration * 120));
  const h = duration / steps;
  for (let i = 0; i < steps; i++) {
    const progress = Math.max(0, Math.min(1, (elapsed + i * h - 0.25) / 0.6));
    const attraction = progress * progress * (3 - 2 * progress);
    stepRotationSpring(
      rotation,
      velocity,
      h,
      48 * attraction,
      3 + 7 * attraction,
    );
  }
}
