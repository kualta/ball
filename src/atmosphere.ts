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
        float motion = smoothstep(.025, .8, clamp(energy, 0., 1.));
        float disturbance = clamp(typing, 0., 1.);
        float edge = smoothstep(0., .17, min(uvScreen.y, 1. - uvScreen.y));
        float horizontalBend = sin(p.x * 2.5 - time * .24) * .035;
        horizontalBend += sin(p.x * 4.2 + time * .18) * .016;
        horizontalBend += disturbance * (
          sin(p.x * 10. - time * 2.1) * .035 +
          sin(p.x * 19. + time * 2.9) * .015
        );
        horizontalBend += draft * sin(p.x * 5. - time * .4) * .012;
        // A circle whose center recedes to infinity becomes a straight wave.
        float centerOffset = .6 * pow(1. - motion, 2.) / max(motion, .0001);
        vec2 wavePoint = vec2(p.x, p.y - horizontalBend * (1. - motion));
        float shiftedRadius = length(wavePoint + vec2(0., centerOffset));
        float distance = (dot(wavePoint, wavePoint) + 2. * centerOffset * wavePoint.y)
          / max(shiftedRadius + centerOffset, .0001);
        float swirl = sin(p.x * 8. + sin(p.y * 6. + time * .7) - time * .6);
        swirl += .55 * sin(p.y * 14. - p.x * 5. + time * 1.1);
        swirl += .3 * sin(p.x * 21. + p.y * 17. - time * 1.4);
        distance += swirl * motion * (.019 + disturbance * .012);
        float phase = distance * 110. - time * 4.5;
        float envelope = exp(-pow((distance - motion * .32) * mix(7., 1.8, motion), 2.));
        float lines = pow(.5 + .5 * cos(phase), 12.) * envelope;
        float mist = exp(-pow((distance - motion * .32) * mix(4.8, 2., motion), 2.));
        float activity = 1. - (1. - disturbance * .6) * (1. - motion);
        vec3 base = vec3(.022, .023, .033);
        vec3 violet = mix(vec3(.13, .115, .21), vec3(.20, .15, .32), activity);
        vec3 light = violet * (mist * .24 + lines * (.22 + activity * .35));
        float vignette = 1. - smoothstep(.3, 1.3, length(uvScreen - .5));
        float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - .5;
        gl_FragColor = vec4(base + light * edge * vignette + grain * .006, 1.);
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
