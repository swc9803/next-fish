"use client";

import { useEffect, useState, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { slideArray } from "@/utils/slideUtils";

import { CameraHandler } from "./CameraHandler";
import { HoverLight } from "./HoverLight";
import { Slides } from "./Slides";
import { Ground } from "./Ground";

export const Experience = () => {
	const { camera, viewport } = useThree();

	const fov = "fov" in camera ? (camera.fov * Math.PI) / 180 : (75 * Math.PI) / 180;
	const aspect = viewport.aspect;

	const [cameraRadius, setCameraRadius] = useState<number>();
	const [slideGap, setSlideGap] = useState<number>();

	const slideWidth = useMemo(() => {
		if (!cameraRadius) return 0;
		return 2 * cameraRadius * Math.tan(fov / 2) * aspect;
	}, [cameraRadius, fov, aspect]);

	const slideHeight = useMemo(() => {
		if (slideWidth === 0) return 0;
		return slideWidth * (9 / 16);
	}, [slideWidth]);

	const totalRadius = useMemo(() => {
		if (!slideGap) return 0;
		return (slideGap * slideArray.length) / (2 * Math.PI);
	}, [slideGap]);

	const groundY = useMemo(() => {
		if (!cameraRadius || !slideHeight) return 0;
		return -slideHeight / 2 - 0.1;
	}, [cameraRadius, slideHeight]);

	const isInitialized = cameraRadius !== undefined && slideGap !== undefined;

	useEffect(() => {
		const getResponsiveCameraRadius = (width: number) => {
			const minWidth = 320;
			const maxWidth = 1920;
			const clampedWidth = Math.max(minWidth, Math.min(maxWidth, width));
			const ratio = (clampedWidth - minWidth) / (maxWidth - minWidth);
			return 4 + ratio * (6.5 - 4);
		};

		const getResponsiveSlideGap = (radius: number, width: number) => {
			const minWidth = 320;
			const maxWidth = 1920;
			const clampedWidth = Math.max(minWidth, Math.min(maxWidth, width));
			const ratio = (clampedWidth - minWidth) / (maxWidth - minWidth);
			return radius * (1.0 + ratio * (1.5 - 1.0));
		};

		const handleResize = () => {
			const width = window.innerWidth;
			const radius = getResponsiveCameraRadius(width);
			const gap = getResponsiveSlideGap(radius, width);
			setCameraRadius(radius);
			setSlideGap(gap);
		};

		handleResize();
		const timeoutId = { current: 0 as any };

		const debouncedResize = () => {
			clearTimeout(timeoutId.current);
			timeoutId.current = setTimeout(handleResize, 100);
		};

		window.addEventListener("resize", debouncedResize);
		return () => {
			clearTimeout(timeoutId.current);
			window.removeEventListener("resize", debouncedResize);
		};
	}, []);

	if (!isInitialized) return null;

	return (
		<>
			<ambientLight intensity={1.5} />
			<CameraHandler cameraRadius={cameraRadius} totalRadius={totalRadius} />
			<HoverLight totalRadius={totalRadius} />
			<Slides totalRadius={totalRadius} slideWidth={slideWidth} slideHeight={slideHeight} />
			<Ground positionY={groundY} />
		</>
	);
};
