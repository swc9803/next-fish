uniform float uProgress;

varying vec2 vUv;

void main()
{
  vec3 newPosition = position;

  float distanceToCenter = distance(vec2(0.5), uv);

  float wave = (1.0 - uProgress) * sin(distanceToCenter * 20.0 - uProgress * 5.0);

  newPosition.z += wave;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);

  vUv = uv;
}