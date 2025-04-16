"use client";

import { JSX } from "react";
import { Environment, MeshReflectorMaterial } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { slideArray } from "@/utils/slideUtils";

import { Slides } from "./Slides";
import { HoverLight } from "./HoverLight";
import { CameraHandler } from "./CameraHandler";
import { Ground } from "./Ground";

export const Experience = (): JSX.Element => {
	const { viewport, camera, size } = useThree();
	const aspectRatio = size.width / size.height;
	const fov = "fov" in camera ? (camera.fov * Math.PI) / 180 : (75 * Math.PI) / 180;
	const cameraRadius = viewport.height / (2 * Math.tan(fov / 2));
	const slideSpacing = viewport.width * 2.8;
	const totalRadius = (slideSpacing * slideArray.length) / (2 * Math.PI);

	return (
		<>
			<ambientLight intensity={0.2} />
			<Environment preset="city" />

			<CameraHandler cameraRadius={cameraRadius} totalRadius={totalRadius} />
			<HoverLight totalRadius={totalRadius} cameraRadius={cameraRadius} />
			<Slides totalRadius={totalRadius} aspectRatio={aspectRatio} cameraRadius={cameraRadius} />

			<Ground />

			<color attach="background" args={["#222222"]} />
		</>
	);
};
