"use client";

import { CameraControls, Dodecahedron, Environment, Grid, MeshDistortMaterial, RenderTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useAtom } from "jotai";
import { useControls } from "leva";
import { useEffect, useRef } from "react";
import { slideAtom } from "./Overlay.jsx";
import { Scene } from "./Scene.jsx";

// model animation 추가
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

const CameraHandler = ({ slideDistance }) => {
	const viewport = useThree((state) => state.viewport);
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
		await cameraControls.current.setLookAt(
			(slide + 1) * (viewport.width + slideDistance),
			1,
			dollyDistance,
			slide * (viewport.width + slideDistance),
			0,
			0,
			true
		);
		await cameraControls.current.setLookAt(slide * (viewport.width + slideDistance), 0, 5, slide * (viewport.width + slideDistance), 0, 0, true);
	};

	useEffect(() => {
		// reset camera position when resize
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
