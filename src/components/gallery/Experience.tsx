"use client";

import { useEffect, useState, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { slideArray } from "@/utils/slideUtils";

import { Ground } from "./Ground";
import { Background } from "./Background";
import { CameraHandler } from "./CameraHandler";
import { Slides } from "./Slides";
import { HoverLight } from "./HoverLight";

export const Experience = () => {
	const { camera, viewport } = useThree();

	const fov = "fov" in camera ? (camera.fov * Math.PI) / 180 : (75 * Math.PI) / 180;
	const aspect = viewport.aspect;

	const [cameraRadius, setCameraRadius] = useState<number>();
	const [slideGap, setSlideGap] = useState<number>();

	const slideWidth = useMemo(() => {
		return cameraRadius ? 2 * cameraRadius * Math.tan(fov / 2) * aspect : 0;
	}, [cameraRadius, fov, aspect]);

	const slideHeight = useMemo(() => {
		return slideWidth ? slideWidth * (9 / 16) : 0;
	}, [slideWidth]);

	const totalRadius = useMemo(() => {
		return slideGap ? (slideGap * slideArray.length) / (2 * Math.PI) : 0;
	}, [slideGap]);

	const groundY = useMemo(() => {
		return cameraRadius && slideHeight ? -slideHeight / 2 - 0.1 : 0;
	}, [cameraRadius, slideHeight]);

	const isInitialized = cameraRadius !== undefined && slideGap !== undefined;

	useEffect(() => {
		const getResponsiveCameraRadius = (width: number) => {
			const clampedWidth = Math.min(Math.max(width, 320), 1920);
			const ratio = (clampedWidth - 320) / (1920 - 320);
			return 4 + ratio * (6.5 - 4);
		};

		const getResponsiveSlideGap = (radius: number, width: number) => {
			const clampedWidth = Math.min(Math.max(width, 320), 1920);
			const ratio = (clampedWidth - 320) / (1920 - 320);
			return radius * (1.0 + ratio * (1.5 - 1.0));
		};

		const handleResize = () => {
			const width = window.innerWidth;
			const radius = getResponsiveCameraRadius(width);
			const gap = getResponsiveSlideGap(radius, width);
			setCameraRadius(radius);
			setSlideGap(gap);
		};

		const timeoutRef = { current: 0 as any };
		const debouncedResize = () => {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = setTimeout(handleResize, 100);
		};

		handleResize();
		window.addEventListener("resize", debouncedResize);
		return () => {
			clearTimeout(timeoutRef.current);
			window.removeEventListener("resize", debouncedResize);
		};
	}, []);

	if (!isInitialized) return null;

	return (
		<>
			<Background />
			<CameraHandler cameraRadius={cameraRadius!} totalRadius={totalRadius} />
			<HoverLight totalRadius={totalRadius} />
			<Ground positionY={groundY} />
			<Slides totalRadius={totalRadius} slideWidth={slideWidth} slideHeight={slideHeight} />
		</>
	);
};
