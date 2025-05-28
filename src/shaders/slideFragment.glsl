uniform sampler2D texture1;
uniform sampler2D texture2;
uniform sampler2D dispMap;
uniform float progress;
uniform float slideIndex;
varying vec2 vUv;

void main() {
  vec4 disp = texture2D(dispMap, vUv);
  float seed = fract(sin(slideIndex * 91.3458) * 47458.453);
  float angle = seed * 6.2831;
  vec2 direction = vec2(cos(angle), sin(angle));
  float strength = sin(progress * 3.1415);
  vec2 offset = (disp.r - 0.5) * direction * 0.3 * strength;
  vec2 distortedUv1 = vUv + offset * (1.0 - progress);
  vec2 distortedUv2 = vUv + offset * progress;
  vec4 tex1 = texture2D(texture1, distortedUv1);
  vec4 tex2 = texture2D(texture2, distortedUv2);
  gl_FragColor = mix(tex1, tex2, progress);
}
