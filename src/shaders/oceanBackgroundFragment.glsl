uniform vec3 topColor;
uniform vec3 bottomColor;
varying vec3 vWorldPosition;

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
  float h = normalize(vWorldPosition).y;
  float n = noise(vWorldPosition.xy * 0.5);

  vec3 base = mix(bottomColor, topColor, smoothstep(-1.0, 0.5, h));
  vec3 finalColor = base + 0.02 * n; // 약한 noise 섞기

  gl_FragColor = vec4(finalColor, 1.0);
}
