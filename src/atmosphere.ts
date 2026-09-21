import * as THREE from "three";

export function createAtmosphere() {
  const material = new THREE.ShaderMaterial({
    depthWrite: false,
    depthTest: false,
    uniforms: {
      time: { value: 0 },
      aspect: { value: 1 },
      energy: { value: 0 },
    },
    vertexShader: `varying vec2 uvScreen;
      void main() { uvScreen = uv; gl_Position = vec4(position.xy, .999, 1.); }`,
    fragmentShader: `
      varying vec2 uvScreen;
      uniform float time;
      uniform float aspect;
      uniform float energy;
      void main() {
        vec2 p = (uvScreen - .5) * vec2(aspect, 1.);
        float t = time * .075;
        float radius = length(p * vec2(.78, 1.));
        float warp = sin(p.x * 4. + t) * .025 + sin(p.y * 5. - t * .7) * .025;
        float halo = exp(-pow((radius - .32 - warp) * 5., 2.));
        float contour = pow(.5 + .5 * sin((radius + warp) * 80. - t), 14.);
        float fade = exp(-radius * radius * 4.);
        vec3 base = vec3(.027, .029, .040);
        vec3 mist = vec3(.12, .105, .18) * halo * fade;
        vec3 line = vec3(.13, .12, .20) * contour * halo * .13;
        float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - .5;
        gl_FragColor = vec4(base + mist * (.58 + energy * .16) + line + grain * .008, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -100;
  return {
    mesh,
    update(time: number, aspect: number, energy: number) {
      material.uniforms.time.value = time;
      material.uniforms.aspect.value = aspect;
      material.uniforms.energy.value = energy;
    },
  };
}
