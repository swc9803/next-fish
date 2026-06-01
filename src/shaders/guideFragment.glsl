precision mediump float;

uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform vec4 resolution;
uniform vec2 holeCenter;
uniform float maxRadius;
uniform float isActive;
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


float fbm(vec2 p) {
  float n = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    n += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return n;
}

void main() {
  vec2 uv = (vUv - 0.5) * vec2(resolution.z, resolution.w) + 0.5;
  vec4 texColor = texture2D(texture1, uv);

  if (isActive < 0.5) {
    gl_FragColor = texColor;
    return;
  }

  vec2 aspect = vec2(resolution.x / resolution.y, 1.0);
  vec2 centeredUv = vUv * aspect;
  vec2 centeredHole = holeCenter * aspect;
  float dist = distance(centeredUv, centeredHole);
  float eased = smoothstep(0.0, 1.0, progress);
  float edgeNoise = (fbm(vUv * 18.0 + time * 0.35) - 0.5) * 0.12;
  float radius = mix(0.04, maxRadius, eased);
  float feather = mix(0.035, 0.18, eased);
  float alphaMask = smoothstep(radius - feather, radius + feather, dist + edgeNoise);

  if (alphaMask < 0.01) {
    discard;
  }

  gl_FragColor = vec4(texColor.rgb, texColor.a * alphaMask);
}
