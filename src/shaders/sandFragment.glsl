varying vec2 vUv;

float random(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
  float n = noise(vUv * 100.0);
  vec3 sandColor = mix(vec3(0.89, 0.84, 0.69), vec3(0.96, 0.91, 0.75), n);
  gl_FragColor = vec4(sandColor, 1.0);
}
