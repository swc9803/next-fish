"use client";

import { CameraControls, Environment, Grid, MeshDistortMaterial, RenderTexture } from "@react-three/drei";
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
	{ path: "models/gallery/cybertruck_scene.glb", mainColor: "#ff0000", name: "car name 1", description: "1 빨강", price: 72000, range: 660 },
	{ path: "models/gallery/model3_scene.glb", mainColor: "#ffa500", name: "car name 2", description: "2 주황", price: 29740, range: 576 },
	{ path: "models/gallery/chest.glb", mainColor: "#ffff00", name: "car name 3", description: "3 노랑", price: 150000, range: 800 },
	{ path: "models/gallery/cybertruck_scene.glb", mainColor: "#008000", name: "car name 4", description: "4 초록", price: 95000, range: 500 },
	{ path: "models/gallery/cybertruck_scene.glb", mainColor: "#0000ff", name: "car name 5", description: "5 파랑", price: 120000, range: 700 },
	{ path: "models/gallery/cybertruck_scene.glb", mainColor: "#800080", name: "car name 6", description: "6 보라", price: 20000, range: 400 },
];

interface CameraHandlerProps {
	radius: number;
}

const CameraHandler = ({ radius }: CameraHandlerProps): JSX.Element => {
	const cameraControls = useRef<CameraControls>(null);
	const slide = useGallerySlide((state) => state.slide);
	const lastSlide = useRef<number>(0);

	const moveToSlide = async () => {
		if (!cameraControls.current) return;

		const angle = (2 * Math.PI * slide) / modelArray.length;
		const targetX = radius * Math.sin(angle);
		const targetZ = radius * Math.cos(angle);

		await cameraControls.current.setLookAt(0, 0, 0, targetX, 0, targetZ, true);
	};

	useEffect(() => {
		const timeout = setTimeout(() => {
			const angle = (2 * Math.PI * slide) / modelArray.length;
			const targetX = radius * Math.sin(angle);
			const targetZ = radius * Math.cos(angle);
			cameraControls.current?.setLookAt(0, 0, 0, targetX, 0, targetZ);
		}, 100);

		return () => clearTimeout(timeout);
	}, []);

	useEffect(() => {
		if (lastSlide.current !== slide) {
			moveToSlide();
			lastSlide.current = slide;
		}
	}, [slide]);

	return <CameraControls ref={cameraControls} touches={{ one: 0, two: 0, three: 0 }} mouseButtons={{ left: 0, middle: 0, right: 0, wheel: 0 }} />;
};

export const Experience = (): JSX.Element => {
	const { radius } = useControls({
		radius: { value: 10, min: 5, max: 30 },
	});

	return (
		<>
			<ambientLight intensity={0.2} />
			<Environment preset="city" />
			<CameraHandler radius={radius} />

			{modelArray.map((model, index) => {
				const angle = (2 * Math.PI * index) / modelArray.length;
				const x = radius * Math.sin(angle);
				const z = radius * Math.cos(angle);
				const rotationY = angle + Math.PI;

				return (
					<group key={index} position={[x, 0, z]} rotation={[0, rotationY, 0]}>
						<mesh position-y={3}>
							<boxGeometry />
							<MeshDistortMaterial color={model.mainColor} speed={3} />
						</mesh>

						<mesh>
							<planeGeometry args={[4, 3]} />
							<meshBasicMaterial toneMapped={false}>
								<RenderTexture attach="map">
									<Scene {...model} />
								</RenderTexture>
							</meshBasicMaterial>
						</mesh>
					</group>
				);
			})}

			<Grid
				position-y={-1.5}
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
