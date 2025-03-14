export const vertexShader = `
  uniform float uTime;
  attribute vec3 targetPosition;
  varying vec3 vColor;

  void main() {
    float progress = (sin(uTime) + 1.0) / 2.0;  // 0 ~ 1 사이 값
    vec3 newPosition = mix(position, targetPosition, progress);

    vColor = vec3(progress, 1.0 - progress, 0.5);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    gl_PointSize = 3.0;
  }
`;

export const fragmentShader = `
  varying vec3 vColor;
  void main() {
    gl_FragColor = vec4(vColor, 1.0);
  }
`;
