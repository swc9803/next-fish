import { useMemo } from "react";
import { useThree } from "@react-three/fiber";

import { slideArray } from "@/utils/slideUtils";
import { SceneCleanup } from "@/components/three/SceneCleanup";
import { MOBILE_BREAKPOINT, useViewportWidth } from "@/hooks/useViewportWidth";

import { Ground } from "./Ground";
import { Background } from "./Background";
import { CameraHandler } from "./CameraHandler";
import { Slides } from "./Slides";
import { HoverLight } from "./HoverLight";

const getGalleryLayout = (width: number) => {
	if (width <= MOBILE_BREAKPOINT) {
		const clampedWidth = Math.min(Math.max(width, 320), MOBILE_BREAKPOINT);
		const ratio = (clampedWidth - 320) / (MOBILE_BREAKPOINT - 320);
		const cameraRadius = 2.5 + ratio * (3.4 - 2.5);
		const rawGap = cameraRadius * (0.8 + ratio * (1.1 - 0.8));
		return { cameraRadius, slideGap: Math.max(1.6, rawGap) };
	}

	const clampedWidth = Math.min(Math.max(width, 320), 1920);
	const ratio = (clampedWidth - 320) / (1920 - 320);
	const cameraRadius = 4 + ratio * (6.5 - 4);
	const rawGap = cameraRadius * (1.0 + ratio * (1.5 - 1.0));
	return { cameraRadius, slideGap: Math.max(2.2, rawGap) };
};

export const Experience = () => {
	const { camera, viewport } = useThree();
	const width = useViewportWidth();
	const { cameraRadius, slideGap } = useMemo(() => getGalleryLayout(width), [width]);

	const fov = "fov" in camera ? (camera.fov * Math.PI) / 180 : (75 * Math.PI) / 180;
	const aspect = viewport.aspect;

	const slideWidth = useMemo(() => {
		if (!cameraRadius) return undefined;
		return 2 * cameraRadius * Math.tan(fov / 2) * aspect;
	}, [cameraRadius, fov, aspect]);

	const slideHeight = useMemo(() => {
		if (!slideWidth) return undefined;
		return slideWidth * (9 / 16);
	}, [slideWidth]);

	const totalRadius = useMemo(() => {
		if (!slideGap) return undefined;
		return (slideGap * slideArray.length) / (2 * Math.PI);
	}, [slideGap]);

	const groundY = useMemo(() => {
		if (!cameraRadius || !slideHeight) return 0;
		return -slideHeight / 2 - 0.1;
	}, [cameraRadius, slideHeight]);

	if (!cameraRadius || !slideGap || !slideWidth || !slideHeight || !totalRadius) return null;

	return (
		<>
			<SceneCleanup />
			<Background />
			<CameraHandler cameraRadius={cameraRadius} totalRadius={totalRadius} startIntro={true} />
			<HoverLight totalRadius={totalRadius} />
			<Ground positionY={groundY} />
			<Slides totalRadius={totalRadius} slideWidth={slideWidth} slideHeight={slideHeight} />
		</>
	);
};
