import { useRef, useEffect, useState, RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Vector2 } from "three";
import { shaderMaterial } from "@react-three/drei";

import fragmentShader from "@/shaders/fragment.glsl";
import vertexShader from "@/shaders/vertex.glsl";

const RevealShaderMaterialImpl = shaderMaterial(
	{
		uTime: 0,
		uProgress: 1,
		uRes: new Vector2(1.0, 1.0),
	},
	vertexShader,
	fragmentShader,
	(self) => {
		self.transparent = true;
	}
);

export const RevealShader = ({ revealProgressRef, targetRef }: { revealProgressRef: RefObject<number>; targetRef: RefObject<number> }) => {
	const meshRef = useRef(null);
	const { viewport } = useThree();
	const [visible, setVisible] = useState(true);
	const materialRef = useRef(new RevealShaderMaterialImpl());

	useEffect(() => {
		materialRef.current.uRes.set(viewport.width, viewport.height);
	}, [viewport]);

	useFrame(({ clock }) => {
		if (!visible) return;

		const material = materialRef.current;
		material.uTime = clock.getElapsedTime();

		const current = revealProgressRef.current;
		const target = targetRef.current;
		const lerped = MathUtils.lerp(current, target, 0.05);
		revealProgressRef.current = lerped;
		material.uProgress = lerped;

		if (Math.abs(lerped - target) < 0.01 && target === 0) {
			setVisible(false);
		}
	});

	if (!visible) return null;

	return (
		<mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
			<planeGeometry args={[1, 1]} />
			<primitive object={materialRef.current} attach="material" />
		</mesh>
	);
};
