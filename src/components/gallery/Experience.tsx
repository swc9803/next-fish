"use client";

import { CameraControls, Environment, Grid, MeshDistortMaterial, RenderTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useControls } from "leva";
import { JSX, useEffect, useRef } from "react";
import { Scene } from "./Scene";

import { useGallerySlide } from "@/store/useGallerySlide";

export interface ModelInfo {
	path: string;
	mainColor: string;
	name: string;
	description: string;
	price: number;
	range: number;
}

export const modelArray: ModelInfo[] = [
	{
		path: "models/gallery/cybertruck_scene.glb",
		mainColor: "#ff0000",
		name: "car name 1",
		description: "1 빨강",
		price: 72000,
		range: 660,
	},
	{
		path: "models/gallery/model3_scene.glb",
		mainColor: "#ffa500",
		name: "car name 2",
		description: "2 주황",
		price: 29740,
		range: 576,
	},
	{
		path: "models/gallery/chest.glb",
		mainColor: "#ffff00",
		name: "car name 3",
		description: "3 노랑",
		price: 150000,
		range: 800,
	},
	{
		path: "models/gallery/cybertruck_scene.glb",
		mainColor: "#008000",
		name: "car name 4",
		description: "4 초록",
		price: 95000,
		range: 500,
	},
	{
		path: "models/gallery/cybertruck_scene.glb",
		mainColor: "#0000ff",
		name: "car name 5",
		description: "5 파랑",
		price: 120000,
		range: 700,
	},
	{
		path: "models/gallery/cybertruck_scene.glb",
		mainColor: "#800080",
		name: "car name 6",
		description: "6 보라",
		price: 20000,
		range: 400,
	},
];

interface CameraHandlerProps {
	slideDistance: number;
}

const CameraHandler = ({ slideDistance }: CameraHandlerProps): JSX.Element => {
	const viewport = useThree((state) => state.viewport);
	const { camera } = useThree();
	const cameraControls = useRef<CameraControls>(null);
	const slide = useGallerySlide((state) => state.slide);
	const lastSlide = useRef<number>(0);

	const { dollyDistance } = useControls({
		dollyDistance: {
			value: 10,
			min: 0,
			max: 50,
		},
	});

	const moveToSlide = async () => {
		if (!cameraControls.current) return;

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
		const resetTimeout = setTimeout(() => {
			cameraControls.current?.setLookAt(slide * (viewport.width + slideDistance), 0, 5, slide * (viewport.width + slideDistance), 0, 0);
		}, 200);
		return () => clearTimeout(resetTimeout);
	}, [viewport]);

	useEffect(() => {
		if (lastSlide.current !== slide) {
			moveToSlide();
			lastSlide.current = slide;
		}
	}, [slide]);

	return <CameraControls ref={cameraControls} touches={{ one: 0, two: 0, three: 0 }} mouseButtons={{ left: 0, middle: 0, right: 0, wheel: 0 }} />;
};

export const Experience = (): JSX.Element => {
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
			<Environment preset="city" />
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
				sectionColor="purple"
				sectionThickness={1}
				cellSize={0.5}
				cellColor="#6f6f6f"
				cellThickness={0.6}
				infiniteGrid
				fadeDistance={50}
				fadeStrength={5}
			/>
		</>
	);
};
