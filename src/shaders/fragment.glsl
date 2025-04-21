uniform float time;
uniform float progress;
uniform float width;
uniform float radius;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform vec4 resolution;
varying vec2 vUv;

float parabola(float x, float k) {
  return pow(4. * x * (1. - x), k);
}

void main() {
  vec2 newUV = (vUv - vec2(0.5)) * resolution.zw + vec2(0.5);
  vec2 start = vec2(0.5, 0.5);
  vec2 aspect = resolution.wz;
  float prog = progress * 0.66;
  float circ = 1. - smoothstep(-width, 0.0, radius * distance(start * aspect, newUV * aspect) - prog * (1. + width));
  float intpl = pow(abs(circ), 1.);
  vec4 t1 = texture2D(texture1, (newUV - 0.5) * (1.0 - intpl) + 0.5);
  vec4 t2 = texture2D(texture2, (newUV - 0.5) * intpl + 0.5);
  gl_FragColor = mix(t1, t2, intpl);
}
