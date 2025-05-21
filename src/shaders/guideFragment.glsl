precision mediump float;

uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform vec4 resolution;
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

  float dissolve = fbm(uv * 5.0 + time * 0.05);

  if (dissolve < progress) {
    discard;
  }

  gl_FragColor = texColor;
}
