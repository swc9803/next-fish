uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform vec4 resolution;
varying vec2 vUv;

float random(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float hole(vec2 uv, vec2 center, float seed) {
  float r = 0.1 + 0.1 * random(vec2(seed));
  float d = distance(uv, center);
  float expand = progress * 2.0 + 0.05 * sin(time + seed * 10.0);
  return smoothstep(r + expand, r + expand - 0.1, d);
}

void main() {
  vec4 texColor = texture2D(texture1, vUv);

  if (progress <= 0.0) {
    gl_FragColor = texColor;
    return;
  }

  float mask = 0.0;
  for (float i = 0.0; i < 5.0; i++) {
    vec2 center = vec2(random(vec2(i, i + 1.0)), random(vec2(i + 2.0, i + 3.0)));
    mask += hole(vUv, center, i * 10.0);
  }

  float visibility = clamp(1.0 - mask, 0.0, 1.0);
  gl_FragColor = vec4(texColor.rgb, texColor.a * visibility);
}
