"use client";

import { CameraControls, Dodecahedron, Environment, Grid, MeshDistortMaterial, RenderTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useControls } from "leva";
import { useEffect, useRef } from "react";
import { Scene } from "./Scene.jsx";

export const modelInfo = [
	{
		path: "models/gallery/cybertruck_scene.glb",
		mainColor: "#f9c0ff",
		name: "car name 1",
		description: "car description 1",
		price: 72000,
		range: 660,
	},
	{
		path: "models/gallery/model3_scene.glb",
		mainColor: "#c0ffe1",
		name: "car name 2",
		description: "car description 2",
		price: 29740,
		range: 576,
	},
	{
		path: "models/gallery/chest.glb",
		mainColor: "#ffdec0",
		name: "car name 3",
		description: "car description 3",
		price: 150000,
		range: 800,
	},
];

const CameraHandler = ({ slide, slideDistance }) => {
	const viewport = useThree((state) => state.viewport);
	const cameraControls = useRef();
	const lastSlide = useRef(slide);
	const isFirstRender = useRef(true);

	const { dollyDistance } = useControls({
		dollyDistance: { value: 10, min: 0, max: 50 },
	});

	const moveToSlide = async () => {
		if (!cameraControls.current) return;

		const targetX = slide * (viewport.width + slideDistance);
		const lastX = lastSlide.current * (viewport.width + slideDistance);

		if (isFirstRender.current) {
			cameraControls.current.setLookAt(targetX, 0, 5, targetX, 0, 0, false);
			isFirstRender.current = false;
			lastSlide.current = slide;
			return;
		}
		if (slide === 0 && lastSlide.current === modelInfo.length - 1) {
			cameraControls.current.setLookAt(lastX, 0, 5, lastX, 0, 0, false);
		} else if (slide === modelInfo.length - 1 && lastSlide.current === 0) {
			cameraControls.current.setLookAt(lastX, 0, 5, lastX, 0, 0, false);
		}

		await cameraControls.current.setLookAt(lastX, 3, dollyDistance, lastX, 0, 0, true);
		await cameraControls.current.setLookAt(targetX, 1, dollyDistance, targetX, 0, 0, true);
		await cameraControls.current.setLookAt(targetX, 0, 5, targetX, 0, 0, true);

		lastSlide.current = slide;
	};

	useEffect(() => {
		moveToSlide();
	}, [slide]);

	return <CameraControls ref={cameraControls} touches={{ one: 0, two: 0, three: 0 }} mouseButtons={{ left: 0, middle: 0, right: 0 }} />;
};

export const Experience = ({ slide }) => {
	const viewport = useThree((state) => state.viewport);
	const { slideDistance } = useControls({
		slideDistance: { value: 1, min: 0, max: 10 },
	});

	return (
		<>
			<ambientLight intensity={0.2} />
			<Environment preset={"city"} />
			<CameraHandler slide={slide} slideDistance={slideDistance} />
			<Grid position-y={-viewport.height / 2} sectionSize={1} cellSize={0.5} infiniteGrid fadeDistance={50} fadeStrength={5} />

			<group>
				<mesh position-y={viewport.height / 2 + 1.5}>
					<sphereGeometry args={[1, 32, 32]} />
					<MeshDistortMaterial color={modelInfo[0].mainColor} speed={3} />
				</mesh>

				<mesh position-x={viewport.width + slideDistance} position-y={viewport.height / 2 + 1.5}>
					<boxGeometry />
					<MeshDistortMaterial color={modelInfo[1].mainColor} speed={3} />
				</mesh>

				<Dodecahedron position-x={2 * (viewport.width + slideDistance)} position-y={viewport.height / 2 + 1.5}>
					<MeshDistortMaterial color={modelInfo[2].mainColor} speed={3} />
				</Dodecahedron>
			</group>

			{modelInfo.map((item, index) => (
				<mesh key={index} position-x={index * (viewport.width + slideDistance)}>
					<planeGeometry args={[viewport.width, viewport.height]} />
					<meshBasicMaterial toneMapped={false}>
						<RenderTexture attach="map">
							<Scene {...item} />
						</RenderTexture>
					</meshBasicMaterial>
				</mesh>
			))}
		</>
	);
};
