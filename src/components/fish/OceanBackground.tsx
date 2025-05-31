import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import { Mesh, ShaderMaterial, BackSide } from "three";

import vertex from "@/shaders/oceanBackgroundVertex.glsl";
import fragment from "@/shaders/oceanBackgroundFragment.glsl";

export const OceanBackground = () => {
	const meshRef = useRef<Mesh>(null);

	const material = useMemo(
		() =>
			new ShaderMaterial({
				vertexShader: vertex,
				fragmentShader: fragment,
				uniforms: {
					topColor: { value: [0.7, 0.88, 1.0] },
					bottomColor: { value: [0.25, 0.58, 0.91] },
				},
				depthWrite: false, // 배경이 다른 객체에 깊이 영향 안 주도록
				side: BackSide,
			}),
		[]
	);

	useFrame(({ camera }) => {
		if (meshRef.current) {
			meshRef.current.position.copy(camera.position); // 카메라를 따라다님
		}
	});

	return (
		<mesh ref={meshRef} scale={1000}>
			<sphereGeometry args={[1, 32, 32]} />
			<primitive object={material} attach="material" />
		</mesh>
	);
};
