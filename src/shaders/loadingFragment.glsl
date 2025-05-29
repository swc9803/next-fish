uniform float time;
uniform float progress;
uniform float width;
uniform float radius;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform vec4 resolution;

varying vec2 vUv;

float random(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
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
  vec2 newUV = (vUv - 0.5) * resolution.zw + 0.5;
  vec2 start = vec2(0.5, 0.5);
  vec2 aspect = resolution.wz;

  float prog = progress;
  float d = distance(start * aspect, newUV * aspect);
  float n = noise(newUV * 8.0 + time * 0.2) * 0.2;
  float shaped = radius * (d + n);
  float mask = 1.0 - smoothstep(-width, 0.0, shaped - prog * 2.0);
  float intpl = pow(abs(mask), 1.0);

  vec2 dir1 = normalize(vec2(sin(time * 0.4), cos(time * 0.5)));
  vec2 dir2 = normalize(vec2(cos(time * 0.3), sin(time * 0.4)));
  vec2 flowDir = mix(dir1, dir2, sin(time * 0.1));

  float wave = 0.0;
  for (int i = 1; i <= 3; i++) {
    float freq = float(i) * 2.5;
    float amp = 0.04 / float(i);
    wave += noise(newUV * freq + flowDir * time * (0.3 + 0.1 * float(i))) * amp;
  }

  vec2 swirl = vec2(
    newUV.x * cos(wave * 5.0) - newUV.y * sin(wave * 5.0),
    newUV.x * sin(wave * 5.0) + newUV.y * cos(wave * 5.0)
  );

  vec3 colorA = vec3(0.2, 0.4, 0.7);
  vec3 colorB = vec3(0.95, 1.0, 1.0);

  float blendNoise = noise(swirl * 4.5 + time * 0.2);
  float blendWave = sin(time * 0.3 + dot(swirl, vec2(5.0, 7.0)) + wave * 8.0);
  float blend = 0.5 + 0.3 * blendNoise + 0.2 * blendWave;
  vec4 bg = vec4(mix(colorA, colorB, clamp(blend, 0.0, 1.0)), 1.0);

  vec2 waveUV = newUV + flowDir * wave;
  waveUV.y += sin(newUV.x * 30.0 + time * 2.0) * 0.01;

  vec4 txt = texture2D(texture1, waveUV);
  vec4 t1 = mix(bg, txt, txt.a);

  vec4 t2 = texture2D(texture2, (newUV - 0.5) * intpl + 0.5);
  gl_FragColor = mix(t1, t2, intpl);
}
