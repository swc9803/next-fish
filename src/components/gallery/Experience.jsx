"use client";

import { CameraControls, Dodecahedron, Environment, Grid, MeshDistortMaterial, RenderTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useAtom } from "jotai";
import { useControls } from "leva";
import { useEffect, useRef } from "react";
import { slideAtom } from "./Overlay.jsx";
import { Scene } from "./Scene.jsx";

// model animation 추가
export const modelArray = [
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
	{
		path: "models/gallery/cybertruck_scene.glb",
		mainColor: "#ff5050",
		name: "car name 4",
		description: "High-speed sports car",
		price: 95000,
		range: 500,
	},
	{
		path: "models/gallery/cybertruck_scene.glb",
		mainColor: "#5078ff",
		name: "car name 5",
		description: "Heavy-duty truck",
		price: 120000,
		range: 700,
	},
];

const CameraHandler = ({ slideDistance }) => {
	const viewport = useThree((state) => state.viewport);
	const { camera } = useThree();
	const cameraControls = useRef();
	const [slide] = useAtom(slideAtom);
	const lastSlide = useRef(0);

	const { dollyDistance } = useControls({
		dollyDistance: {
			value: 10,
			min: 0,
			max: 50,
		},
	});

	const logCameraPosition = () => {
		setTimeout(() => {
			console.log(`x: ${camera.position.x.toFixed(2)}, y: ${camera.position.y.toFixed(2)}, z: ${camera.position.z.toFixed(2)}`);
		}, 100);
	};

	const moveToSlide = async () => {
		await cameraControls.current.setLookAt(
			lastSlide.current * (viewport.width + slideDistance),
			3,
			dollyDistance,
			lastSlide.current * (viewport.width + slideDistance),
			0,
			0,
			true
		);
		logCameraPosition();

		await cameraControls.current.setLookAt(
			(slide + 1) * (viewport.width + slideDistance),
			1,
			dollyDistance,
			slide * (viewport.width + slideDistance),
			0,
			0,
			true
		);
		logCameraPosition();

		await cameraControls.current.setLookAt(slide * (viewport.width + slideDistance), 0, 5, slide * (viewport.width + slideDistance), 0, 0, true);
		logCameraPosition();
	};

	useEffect(() => {
		const resetTimeout = setTimeout(() => {
			cameraControls.current.setLookAt(slide * (viewport.width + slideDistance), 0, 5, slide * (viewport.width + slideDistance), 0, 0);
		}, 200);
		return () => clearTimeout(resetTimeout);
	}, [viewport]);

	useEffect(() => {
		if (lastSlide.current !== slide) {
			moveToSlide();
			lastSlide.current = slide;
		}
	}, [slide]);

	return (
		<CameraControls
			ref={cameraControls}
			touches={{
				one: 0,
				two: 0,
				three: 0,
			}}
			mouseButtons={{
				left: 0,
				middle: 0,
				right: 0,
			}}
		/>
	);
};

export const Experience = () => {
	const viewport = useThree((state) => state.viewport);
	const { slideDistance } = useControls({
		slideDistance: {
			value: 1,
			min: 0,
			max: 10,
		},
	});
	return (
		<>
			<ambientLight intensity={0.2} />
			<Environment preset={"city"} />
			<CameraHandler slideDistance={slideDistance} />

			{modelArray.map((model, index) => (
				<group key={index}>
					<mesh position-x={index * (viewport.width + slideDistance)} position-y={viewport.height / 2 + 1.5}>
						<boxGeometry />
						<MeshDistortMaterial color={model.mainColor} speed={3} />
					</mesh>

					<mesh position={[index * (viewport.width + slideDistance), 0, 0]}>
						<planeGeometry args={[viewport.width, viewport.height]} />
						<meshBasicMaterial toneMapped={false}>
							<RenderTexture attach="map">
								<Scene {...model} />
							</RenderTexture>
						</meshBasicMaterial>
					</mesh>
				</group>
			))}

			<Grid
				position-y={-viewport.height / 2}
				sectionSize={1}
				sectionColor={"purple"}
				sectionThickness={1}
				cellSize={0.5}
				cellColor={"#6f6f6f"}
				cellThickness={0.6}
				infiniteGrid
				fadeDistance={50}
				fadeStrength={5}
			/>
		</>
	);
};
