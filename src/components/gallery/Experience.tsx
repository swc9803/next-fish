"use client";

import { JSX } from "react";
import { useThree } from "@react-three/fiber";
import { slideArray } from "@/utils/slideUtils";

import { Slides } from "./Slides";
import { HoverLight } from "./HoverLight";
import { CameraHandler } from "./CameraHandler";
import { Ground } from "./Ground";

export const Experience = (): JSX.Element => {
	const { camera, viewport } = useThree();

	const fov = "fov" in camera ? (camera.fov * Math.PI) / 180 : (75 * Math.PI) / 180;
	const aspect = viewport.aspect;

	const cameraRadius = 6; // 슬라이드와 카메라의 거리
	const slideGap = 6; // 슬라이드 간의 간격

	const slideWidth = 2 * cameraRadius * Math.tan(fov / 2) * aspect;
	const slideHeight = slideWidth / aspect;

	const totalRadius = (slideGap * slideArray.length) / (2 * Math.PI);

	return (
		<>
			<ambientLight intensity={1.5} />

			<CameraHandler cameraRadius={cameraRadius} totalRadius={totalRadius} />
			<HoverLight totalRadius={totalRadius} cameraRadius={cameraRadius} />
			<Slides totalRadius={totalRadius} slideWidth={slideWidth} slideHeight={slideHeight} />

			<Ground />
		</>
	);
};
