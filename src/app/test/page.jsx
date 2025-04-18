"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { MathUtils, Vector2 } from "three";

import fragmentShader from "@/shaders/fragment.glsl";
import vertexShader from "@/shaders/vertex.glsl";

const RevealShaderMaterial = shaderMaterial(
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

const revealMaterial = new RevealShaderMaterial();

export default function App() {
	const revealProgressRef = useRef(1);
	const targetRef = useRef(0);

	return (
		<Canvas>
			<ambientLight intensity={0.5} />
			<directionalLight position={[5, 5, 5]} />

			<mesh position={[0, 0, -1]}>
				<boxGeometry />
				<meshStandardMaterial color="orange" />
			</mesh>

			<FullscreenReveal revealProgressRef={revealProgressRef} targetRef={targetRef} />
		</Canvas>
	);
}

function FullscreenReveal({ revealProgressRef, targetRef }) {
	const meshRef = useRef();
	const { viewport } = useThree();
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		revealMaterial.uRes.set(viewport.width, viewport.height);
	}, [viewport]);

	useFrame(({ clock }) => {
		if (!visible) return;

		revealMaterial.uTime = clock.getElapsedTime();
		const current = revealProgressRef.current;
		const target = targetRef.current;
		const lerped = MathUtils.lerp(current, target, 0.05);
		revealProgressRef.current = lerped;
		revealMaterial.uProgress = lerped;

		if (Math.abs(lerped - target) < 0.01 && target === 0) {
			setVisible(false);
		}
	});

	if (!visible) return null;

	return (
		<mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
			<planeGeometry args={[1, 1]} />
			<primitive object={revealMaterial} attach="material" />
		</mesh>
	);
}
