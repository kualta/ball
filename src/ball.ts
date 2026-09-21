import { layoutAnswer } from "./answer-layout";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

type BallState = "idle" | "thinking" | "answer" | "error";
export async function createBall(container: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x08050e, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 30);
  camera.position.set(0, 0.12, 7.2);
  camera.lookAt(0, 0, 0);
  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(environment, 0.025);
  scene.environment = env.texture;
  environment.dispose();
  pmrem.dispose();
  const key = new THREE.DirectionalLight(0xddd0ff, 2.4);
  key.position.set(-3, 5, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x9b65ff, 3);
  fill.position.set(4, 1, 2);
  scene.add(fill);
  const blue = new THREE.PointLight(0x356cff, 1.5, 3);
  blue.position.set(0, 0, 1.55);
  scene.add(blue);
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const shadowContext = shadowCanvas.getContext("2d")!;
  const shadowGradient = shadowContext.createRadialGradient(
    128,
    128,
    2,
    128,
    128,
    128,
  );
  shadowGradient.addColorStop(0, "rgba(24,29,38,.26)");
  shadowGradient.addColorStop(0.4, "rgba(24,29,38,.15)");
  shadowGradient.addColorStop(1, "rgba(24,29,38,0)");
  shadowContext.fillStyle = shadowGradient;
  shadowContext.fillRect(0, 0, 256, 256);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 0.46),
    new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
    }),
  );
  shadow.position.set(0, -1.68, -0.5);
  scene.add(shadow);
  const ball = new THREE.Group();
  const handRotation = new THREE.Group();
  handRotation.add(ball);
  scene.add(handRotation);
  const shellMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x080a0e,
    roughness: 0.19,
    metalness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.09,
    envMapIntensity: 1.2,
  });
  const fallback = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(
      1.6,
      96,
      64,
      0,
      Math.PI * 2,
      Math.asin(0.85 / 1.6),
      Math.PI - Math.asin(0.85 / 1.6),
    ),
    shellMaterial,
  );
  shell.rotation.x = Math.PI / 2;
  fallback.add(shell);
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.045, 16, 96),
    new THREE.MeshStandardMaterial({
      color: 0x16191e,
      roughness: 0.27,
      metalness: 0.3,
    }),
  );
  rim.position.z = Math.sqrt(1.6 ** 2 - 0.85 ** 2);
  fallback.add(rim);
  ball.add(fallback);
  const well = new THREE.Mesh(
    new THREE.CircleGeometry(0.845, 96),
    new THREE.MeshBasicMaterial({ color: 0x010716 }),
  );
  well.position.z = 0.3;
  ball.add(well);
  const die = new THREE.Group();
  ball.add(die);
  die.position.z = 0.56;
  const geometry = new THREE.IcosahedronGeometry(0.96, 0);
  const pos = geometry.getAttribute("position");
  const a = new THREE.Vector3().fromBufferAttribute(pos, 0);
  const b = new THREE.Vector3().fromBufferAttribute(pos, 1);
  const c = new THREE.Vector3().fromBufferAttribute(pos, 2);
  const normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
  geometry.applyQuaternion(
    new THREE.Quaternion().setFromUnitVectors(
      normal,
      new THREE.Vector3(0, 0, 1),
    ),
  );
  const rotatedA = new THREE.Vector3().fromBufferAttribute(pos, 0);
  const rotatedB = new THREE.Vector3().fromBufferAttribute(pos, 1);
  geometry.rotateZ(
    -Math.atan2(rotatedB.y - rotatedA.y, rotatedB.x - rotatedA.x),
  );
  const centerY = (pos.getY(0) + pos.getY(1) + pos.getY(2)) / 3;
  if (pos.getY(2) > centerY) geometry.rotateZ(Math.PI);
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i += 3) {
    const points = [0, 1, 2].map((j) => ({
      j,
      x: pos.getX(i + j),
      y: pos.getY(i + j),
    }));
    if (i === 0) {
      points.sort((p, q) => q.y - p.y);
      const top = points.slice(0, 2).sort((p, q) => p.x - q.x);
      uv.set([0, 1], (i + top[0].j) * 2);
      uv.set([1, 1], (i + top[1].j) * 2);
      uv.set([0.5, 0], (i + points[2].j) * 2);
    } else uv.set([0, 1, 1, 1, 0.5, 0], i * 2);
    geometry.addGroup(i, 3, i === 0 ? 0 : 1);
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 444;
  const context = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  function writeAnswer(answer: string) {
    context.fillStyle = "#362076";
    context.fillRect(0, 0, 512, 444);
    context.strokeStyle = "rgba(153,197,255,.2)";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(15, 12);
    context.lineTo(497, 12);
    context.lineTo(256, 428);
    context.closePath();
    context.stroke();
    const layout = layoutAnswer(answer, (text, size) => {
      context.font = `600 ${size}px Arial, sans-serif`;
      return context.measureText(text).width;
    });
    context.save();
    context.beginPath();
    context.moveTo(24, 20);
    context.lineTo(488, 20);
    context.lineTo(256, 414);
    context.closePath();
    context.clip();
    context.font = `600 ${layout.size}px Arial, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#f4edff";
    context.shadowColor = "#af8dff";
    context.shadowBlur = 3;
    for (const line of layout.lines) context.fillText(line.text, 256, line.y);
    context.restore();
    texture.needsUpdate = true;
  }
  writeAnswer("ASK A QUESTION");
  const faceMaterial = new THREE.MeshBasicMaterial({ map: texture });
  const dieMesh = new THREE.Mesh(geometry, [
    faceMaterial,
    new THREE.MeshStandardMaterial({
      color: 0x020b25,
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.1,
    }),
  ]);
  die.add(dieMesh);
  const fluidMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uEnergy: { value: 0 },
      uSlosh: { value: new THREE.Vector2() },
    },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv; uniform float uTime; uniform float uEnergy; uniform vec2 uSlosh;
    void main(){vec2 p=(vUv-.5)*2.; p += uSlosh * sin(uTime * 3.);float r=length(p);float edge=smoothstep(.45,1.,r);float ripple=sin(r*24.-uTime*1.7+sin(p.x*8.+uTime)*.5)*.5+.5;float wave=sin(p.x*8.+p.y*11.+uTime*1.2)*sin(p.y*13.-uTime*.9);vec3 col=mix(vec3(.018,.055,.20),vec3(.025,.19,.55),edge*.7+ripple*.12);float alpha=.10+edge*.70+uEnergy*(.09+wave*.035);float glint=pow(max(0.,1.-abs(r-.91)*35.),2.)*.21;col+=vec3(.19,.37,.62)*glint;gl_FragColor=vec4(col,alpha);}`,
  });
  const fluid = new THREE.Mesh(
    new THREE.CircleGeometry(0.825, 96),
    fluidMaterial,
  );
  fluid.position.z = 1.365;
  ball.add(fluid);
  const glassRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.807, 0.011, 8, 96),
    new THREE.MeshBasicMaterial({
      color: 0x9370df,
      transparent: true,
      opacity: 0.4,
    }),
  );
  glassRim.position.z = 1.37;
  ball.add(glassRim);
  let disposed = false;
  new GLTFLoader().load(
    "/models/ball.glb",
    (gltf) => {
      if (disposed) {
        gltf.scene.traverse((object) => {
          if (object instanceof THREE.Mesh) object.geometry.dispose();
        });
        return;
      }
      gltf.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (/Glass|Fluid|Die|Prism/i.test(object.name))
            object.visible = false;
          else if (/Shell|Body/i.test(object.name))
            object.material = shellMaterial;
        }
      });
      fallback.visible = false;
      ball.add(gltf.scene);
    },
    undefined,
    () => {},
  );
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let state: BallState = "idle",
    frame = 0,
    last = performance.now(),
    elapsed = 0,
    energy = 0;
  const target = new THREE.Quaternion();
  const spinEuler = new THREE.Euler();
  let spin = 0,
    thinkingStart = 0;
  let pointerId: number | null = null;
  let lastX = 0,
    lastY = 0,
    pointerTime = 0;
  const angularVelocity = new THREE.Vector2();
  const slosh = new THREE.Vector2();
  const internalLag = new THREE.Quaternion();
  const dragRotation = new THREE.Quaternion();
  const dragAxis = new THREE.Vector3();
  const restRotation = new THREE.Quaternion();
  let disturbance = 0;
  function rotateFromDrag(dx: number, dy: number) {
    const distance = Math.hypot(dx, dy);
    if (!distance) return;
    dragAxis.set(dy, dx, 0).normalize();
    dragRotation.setFromAxisAngle(dragAxis, distance);
    handRotation.quaternion.premultiply(dragRotation).normalize();
    internalLag.premultiply(dragRotation.clone().invert()).normalize();
    slosh.x = THREE.MathUtils.clamp(slosh.x + dx * 0.35, -0.18, 0.18);
    slosh.y = THREE.MathUtils.clamp(slosh.y + dy * 0.35, -0.18, 0.18);
    disturbance = Math.min(1, disturbance + distance * 2);
  }
  function pointerDown(event: PointerEvent) {
    if (pointerId !== null || !event.isPrimary || event.button !== 0) return;
    const bounds = renderer.domElement.getBoundingClientRect();
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(
      new THREE.Vector2(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        (-(event.clientY - bounds.top) / bounds.height) * 2 + 1,
      ),
      camera,
    );
    if (
      !raycaster.ray.intersectsSphere(
        new THREE.Sphere(new THREE.Vector3(), 1.65),
      )
    )
      return;
    event.preventDefault();
    pointerId = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    pointerTime = event.timeStamp;
    angularVelocity.set(0, 0);
    container.setPointerCapture(event.pointerId);
    container.dataset.dragging = "true";
    container.dataset.pointerFocus = "true";
    container.focus({ preventScroll: true });
  }
  function pointerMove(event: PointerEvent) {
    if (event.pointerId !== pointerId) return;
    const scale = 5 / Math.min(container.clientWidth, container.clientHeight);
    const dx = (event.clientX - lastX) * scale;
    const dy = (event.clientY - lastY) * scale;
    const dt = Math.max(0.008, (event.timeStamp - pointerTime) / 1000);
    rotateFromDrag(dx, dy);
    angularVelocity.set(
      THREE.MathUtils.clamp(dx / dt, -5, 5),
      THREE.MathUtils.clamp(dy / dt, -5, 5),
    );
    lastX = event.clientX;
    lastY = event.clientY;
    pointerTime = event.timeStamp;
  }
  function pointerEnd(event: PointerEvent) {
    if (event.pointerId !== pointerId) return;
    if (event.type !== "pointerup" || event.timeStamp - pointerTime > 100)
      angularVelocity.set(0, 0);
    pointerId = null;
    delete container.dataset.dragging;
    if (container.hasPointerCapture(event.pointerId))
      container.releasePointerCapture(event.pointerId);
  }
  function keyboardRotate(event: KeyboardEvent) {
    delete container.dataset.pointerFocus;
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-0.2, 0],
      ArrowRight: [0.2, 0],
      ArrowUp: [0, -0.2],
      ArrowDown: [0, 0.2],
    };
    if (event.key === "Home") {
      event.preventDefault();
      handRotation.quaternion.identity();
      angularVelocity.set(0, 0);
    } else if (directions[event.key]) {
      event.preventDefault();
      rotateFromDrag(...directions[event.key]);
      angularVelocity.set(0, 0);
    }
  }
  container.addEventListener("pointerdown", pointerDown);
  container.addEventListener("pointermove", pointerMove);
  container.addEventListener("pointerup", pointerEnd);
  container.addEventListener("pointercancel", pointerEnd);
  container.addEventListener("lostpointercapture", pointerEnd);
  container.addEventListener("keydown", keyboardRotate);
  function resize() {
    const width = container.clientWidth,
      height = container.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.position.z = Math.max(7.2, 6.4 / camera.aspect);
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  function render(now: number) {
    if (disposed) return;
    frame = requestAnimationFrame(render);
    if (document.hidden) {
      last = now;
      return;
    }
    if (
      now - last <
      (reduced.matches
        ? 100
        : state === "thinking" || pointerId !== null || disturbance > 0.05
          ? 16
          : 32)
    )
      return;
    const dt = Math.min((now - last) / 1000, 0.12);
    last = now;
    elapsed += dt;
    const thinking = state === "thinking";
    if (pointerId === null && !reduced.matches) {
      rotateFromDrag(angularVelocity.x * dt, angularVelocity.y * dt);
      angularVelocity.multiplyScalar(Math.exp(-dt * 4));
    }
    if (reduced.matches) angularVelocity.set(0, 0);
    disturbance *= Math.exp(-dt * 2);
    slosh.multiplyScalar(Math.exp(-dt * 2.2));
    internalLag.slerp(restRotation, 1 - Math.exp(-dt * 1.7));
    if (thinking && pointerId === null)
      handRotation.quaternion.slerp(restRotation, 1 - Math.exp(-dt * 3));
    fluidMaterial.uniforms.uSlosh.value.copy(slosh);
    energy = THREE.MathUtils.damp(energy, thinking ? 1 : disturbance, 3, dt);
    fluidMaterial.uniforms.uTime.value = elapsed;
    fluidMaterial.uniforms.uEnergy.value = reduced.matches ? 0 : energy;
    if (!reduced.matches) {
      spin += dt * (thinking ? 2.8 : 0.12);
      if (thinking) {
        spinEuler.set(Math.sin(spin * 0.7) * 0.8, spin, Math.sin(spin) * 0.3);
        target.setFromEuler(spinEuler);
      } else {
        spinEuler.set(
          Math.sin(elapsed * 0.55) * 0.022,
          Math.sin(elapsed * 0.4) * 0.03,
          Math.sin(elapsed * 0.6) * 0.025,
        );
        target.setFromEuler(spinEuler);
      }
      target.premultiply(internalLag);
      die.quaternion.slerp(target, 1 - Math.exp(-dt * (thinking ? 5 : 3.2)));
      die.position.z = THREE.MathUtils.damp(
        die.position.z,
        thinking
          ? 0.08
          : 0.56 - disturbance * 0.26 + Math.sin(elapsed * 0.8) * 0.008,
        3,
        dt,
      );
      ball.rotation.z =
        Math.sin(elapsed * (thinking ? 10 : 0.6)) * 0.025 * energy;
      if (thinking) {
        const turn = Math.min((elapsed - thinkingStart) / 2.25, 1);
        ball.rotation.y = Math.PI * 2 * (turn * turn * (3 - 2 * turn));
      } else
        ball.rotation.y = THREE.MathUtils.damp(
          ball.rotation.y,
          Math.PI * 2 * Math.round(ball.rotation.y / (Math.PI * 2)),
          5,
          dt,
        );
    } else {
      die.quaternion.copy(internalLag);
      die.position.z = 0.56;
      ball.rotation.set(0, 0, 0);
    }
    renderer.render(scene, camera);
  }
  frame = requestAnimationFrame(render);
  const lost = (event: Event) => {
    event.preventDefault();
    container.dataset.renderState = "unavailable";
  };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  return {
    setState(next: BallState, answer?: string) {
      if (next === "thinking" && state !== "thinking") {
        thinkingStart = elapsed;
        ball.rotation.y = 0;
      }
      if (next === "thinking") angularVelocity.set(0, 0);
      state = next;
      if (answer) writeAnswer(answer);
      else if (next === "thinking") writeAnswer("");
      else if (next === "error") writeAnswer("ASK AGAIN LATER");
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      container.removeEventListener("pointerdown", pointerDown);
      container.removeEventListener("pointermove", pointerMove);
      container.removeEventListener("pointerup", pointerEnd);
      container.removeEventListener("pointercancel", pointerEnd);
      container.removeEventListener("lostpointercapture", pointerEnd);
      container.removeEventListener("keydown", keyboardRotate);
      if (pointerId !== null && container.hasPointerCapture(pointerId))
        container.releasePointerCapture(pointerId);
      delete container.dataset.dragging;
      delete container.dataset.pointerFocus;
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material])
            material.dispose();
        }
      });
      texture.dispose();
      shadowTexture.dispose();
      env.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
