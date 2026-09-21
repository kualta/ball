import { Quaternion, Vector3 } from "three";

export function stepRotationSpring(
  rotation: Quaternion,
  velocity: Vector3,
  dt: number,
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
    velocity.addScaledVector(axis, -42 * h).multiplyScalar(Math.exp(-8 * h));
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
