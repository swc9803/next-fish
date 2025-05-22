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

vec3 backgroundWaves(vec2 uv, float time) {
  float wave = sin(uv.x * 10.0 + time * 0.5) * 0.1 + cos(uv.y * 10.0 + time * 0.3) * 0.1;
  uv.y += wave;
  vec3 blueColor = vec3(0.3, 0.55, 0.75);
  vec3 lightBlueColor = vec3(0.75, 0.9, 1.0);
  float mixVal = 0.5 + 0.5 * sin(time * 0.4 + uv.y * 8.0);
  return mix(blueColor, lightBlueColor, mixVal);
}

void main() {
  vec2 newUV = (vUv - 0.5) * resolution.zw + 0.5;
  vec2 start = vec2(0.5, 0.5);
  vec2 aspect = resolution.wz;

  float prog = progress * 0.66;
  float mask = 1. - smoothstep(-width, 0.0, radius * distance(start * aspect, newUV * aspect) - prog * (1. + width));
  float intpl = pow(abs(mask), 1.);

  vec4 bg = vec4(backgroundWaves(newUV, time), 1.0);
  vec4 txt = texture2D(texture1, newUV);
  vec4 t1 = mix(bg, txt, txt.a); 

  vec4 t2 = texture2D(texture2, (newUV - 0.5) * intpl + 0.5);
  gl_FragColor = mix(t1, t2, intpl);
}
