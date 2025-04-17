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

export default function App() {
	const [isRevealed, setIsRevealed] = useState(true);
	const [cubeTexture, setCubeTexture] = useState(null);
	const revealProgressRef = useRef(1);
	const targetRef = useRef(1);

	const toggleReveal = () => {
		targetRef.current = isRevealed ? 0 : 1;
		setIsRevealed(!isRevealed);
	};

	return (
		<>
			<Canvas style={{ width: "100vw", height: "100vh" }}>
				<ambientLight intensity={0.5} />
				<directionalLight position={[10, 10, 5]} />

				<CubeSceneTexture onTextureReady={setCubeTexture} />

				{cubeTexture && <RevealImage imageTexture={cubeTexture} revealProgressRef={revealProgressRef} targetRef={targetRef} />}
			</Canvas>

			<div
				style={{
					position: "absolute",
					bottom: 30,
					left: "50%",
					transform: "translateX(-50%)",
					zIndex: 10,
				}}
			>
				<button
					onClick={toggleReveal}
					style={{
						padding: "10px 20px",
						background: "#000",
						color: "#fff",
						border: "none",
						borderRadius: "6px",
						cursor: "pointer",
					}}
				>
					Show / Hide
				</button>
			</div>
		</>
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

function RevealImage({ imageTexture, revealProgressRef, targetRef }) {
	const { viewport } = useThree();
	const [materialInstance] = useState(() => new ImageRevealMaterial());

	useEffect(() => {
		materialInstance.uTexture = imageTexture;
		const { width, height } = imageTexture.image;
		materialInstance.uImageRes.set(width, height);
		materialInstance.uRes.set(viewport.width, viewport.height);
	}, [imageTexture, viewport, materialInstance]);

	useFrame(({ clock }) => {
		materialInstance.uTime = clock.getElapsedTime();
		const current = revealProgressRef.current;
		const target = targetRef.current;
		const lerped = MathUtils.lerp(current, target, 0.05);
		revealProgressRef.current = lerped;
		materialInstance.uProgress = lerped;
	});

	return (
		<mesh scale={[viewport.width, viewport.height, 1]}>
			<planeGeometry args={[1, 1, 32, 32]} />
			<primitive object={materialInstance} attach="material" />
		</mesh>
	);
}
