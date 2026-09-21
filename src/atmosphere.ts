import * as THREE from "three";

export function createAtmosphere() {
  const material = new THREE.ShaderMaterial({
    depthWrite: false,
    depthTest: false,
    uniforms: {
      time: { value: 0 },
      aspect: { value: 1 },
      energy: { value: 0 },
      typing: { value: 0 },
      draft: { value: 0 },
    },
    vertexShader: `varying vec2 uvScreen;
      void main() { uvScreen = uv; gl_Position = vec4(position.xy, .999, 1.); }`,
    fragmentShader: `
      varying vec2 uvScreen;
      uniform float time;
      uniform float aspect;
      uniform float energy;
      uniform float typing;
      uniform float draft;
      void main() {
        vec2 p = (uvScreen - .5) * vec2(aspect, 1.);
        float t = time;
        float activity = max(typing * .7, energy);
        float angle = atan(p.y, p.x);
        float radius = length(p * vec2(.78, 1.));
        float warp = sin(p.x * 4. + t) * (.025 + typing * .025) + sin(p.y * 5. - t * .7) * .025;
        warp += sin(angle * 3. + radius * 8. - t * 1.5) * energy * .04;
        warp += sin(radius * 22. - t * 3.) * typing * .025;
        float halo = exp(-pow((radius - .32 - draft * .035 - warp) * 5., 2.));
        halo *= smoothstep(0., .18, min(uvScreen.y, 1. - uvScreen.y));
        float contour = pow(.5 + .5 * sin((radius + warp) * (70. + draft * 18.) - t * (1. + energy * 2.)), 14.);
        float fade = exp(-radius * radius * 4.);
        vec3 base = vec3(.027, .029, .040);
        vec3 mist = mix(vec3(.12, .105, .18), vec3(.22, .17, .34), activity) * halo * fade;
        vec3 line = vec3(.13, .12, .20) * contour * halo * (.13 + activity * .45);
        float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - .5;
        gl_FragColor = vec4(base + mist * (.58 + activity * .55) + line + grain * .008, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -100;
  return {
    mesh,
    update(
      time: number,
      aspect: number,
      energy: number,
      typing: number,
      draft: number,
    ) {
      material.uniforms.time.value = time;
      material.uniforms.aspect.value = aspect;
      material.uniforms.energy.value = energy;
      material.uniforms.typing.value = typing;
      material.uniforms.draft.value = draft;
    },
  };
}
