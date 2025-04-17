"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { shaderMaterial, useFBO, RenderTexture } from "@react-three/drei";
import { Texture, Vector2, MathUtils } from "three";
import { useEffect, useRef, useState } from "react";

import fragmentShader from "./shaders/fragment.glsl";
import vertexShader from "./shaders/vertex.glsl";

const ImageRevealMaterial = shaderMaterial(
	{
		uTexture: new Texture(),
		uTime: 0,
		uProgress: 1,
		uImageRes: new Vector2(1.0, 1.0),
		uRes: new Vector2(1.0, 1.0),
	},
	vertexShader,
	fragmentShader,
	(self) => {
		self.transparent = true;
	}
);

// material을 앱 외부에서 미리 생성
const glslMaterial = new ImageRevealMaterial();

export default function App() {
	const [cubeTexture, setCubeTexture] = useState(null);
	const revealProgressRef = useRef(1);
	const targetRef = useRef(1);

	useEffect(() => {
		if (cubeTexture) {
			targetRef.current = 0;
		}
	}, [cubeTexture]);

	return (
		<Canvas>
			<RevealContents revealProgressRef={revealProgressRef} targetRef={targetRef} contentsTexture={cubeTexture} />

			<ambientLight intensity={0.5} />
			<directionalLight position={[10, 10, 5]} />

			<CubeSceneTexture onTextureReady={setCubeTexture} />
		</Canvas>
	);
}

function CubeSceneTexture({ onTextureReady }) {
	const cubeRef = useRef();
	const fbo = useFBO({ samples: 4 });

	useFrame((state) => {
		if (!fbo || !cubeRef.current) return;

		const oldTarget = state.gl.getRenderTarget();
		state.gl.setRenderTarget(fbo);
		state.gl.clear();
		state.gl.render(cubeRef.current, state.camera);
		state.gl.setRenderTarget(oldTarget);

		onTextureReady(fbo.texture);
	});

	return (
		<group ref={cubeRef} position={[0, 0, -1]}>
			<mesh>
				<boxGeometry />
				<meshStandardMaterial>
					<RenderTexture attach="map" anisotropy={16}>
						<color attach="background" args={["orange"]} />
						<ambientLight intensity={0.5} />
					</RenderTexture>
				</meshStandardMaterial>
			</mesh>
		</group>
	);
}

function RevealContents({ contentsTexture, revealProgressRef, targetRef }) {
	const { viewport } = useThree();
	const revealMaterial = glslMaterial;
	const meshRef = useRef();
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		if (contentsTexture?.image) {
			revealMaterial.uTexture = contentsTexture;
			const { width, height } = contentsTexture.image;
			revealMaterial.uImageRes.set(width, height);
			revealMaterial.uRes.set(viewport.width, viewport.height);
		}
	}, [contentsTexture, viewport]);

	useFrame(({ clock }) => {
		if (!visible) return;

		revealMaterial.uTime = clock.getElapsedTime();
		const current = revealProgressRef.current;
		const target = targetRef.current;
		const lerped = MathUtils.lerp(current, target, 0.05);
		revealProgressRef.current = lerped;
		revealMaterial.uProgress = lerped;

		// glsl 메모리 해제
		if (Math.abs(lerped - target) < 0.01 && target === 0) {
			if (meshRef.current) {
				meshRef.current.geometry.dispose();
				meshRef.current.material.dispose();
			}
			if (revealMaterial.uTexture?.dispose) {
				revealMaterial.uTexture.dispose();
			}
			setVisible(false);
		}
	});

	if (!visible) return null;

	return (
		<mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
			<planeGeometry args={[1, 1, 32, 32]} />
			<primitive object={revealMaterial} attach="material" />
		</mesh>
	);
}
