"use client";

import { JSX, useEffect, useState, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { slideArray } from "@/utils/slideUtils";

import { Slides } from "./Slides";
import { HoverLight } from "./HoverLight";
import { CameraHandler } from "./CameraHandler";
import { Ground } from "./Ground";

export const Experience = (): JSX.Element | null => {
	const { camera, viewport } = useThree();

	const fov = "fov" in camera ? (camera.fov * Math.PI) / 180 : (75 * Math.PI) / 180;
	const aspect = viewport.aspect;

	const [cameraRadius, setCameraRadius] = useState<number | undefined>(undefined);
	const [slideGap, setSlideGap] = useState<number | undefined>(undefined);

	// 반응형
	const slideWidth = useMemo(() => {
		if (cameraRadius === undefined) return 0;
		return 2 * cameraRadius * Math.tan(fov / 2) * aspect;
	}, [cameraRadius, fov, aspect]);

	const slideHeight = useMemo(() => {
		if (slideWidth === 0) return 0;
		return slideWidth / aspect;
	}, [slideWidth, aspect]);

	const totalRadius = useMemo(() => {
		if (slideGap === undefined) return 0;
		return (slideGap * slideArray.length) / (2 * Math.PI);
	}, [slideGap]);

	const groundY = useMemo(() => {
		if (cameraRadius === undefined) return 0;
		return -cameraRadius * 0.29;
	}, [cameraRadius]);

	const isInitialized = cameraRadius !== undefined && slideGap !== undefined;

	useEffect(() => {
		const getResponsiveCameraRadius = (width: number): number => {
			if (width < 640) return 4;
			if (width < 1024) return 5;
			if (width < 1440) return 6;
			return 6.5;
		};

		const getResponsiveSlideGap = (radius: number, width: number): number => {
			if (width < 640) return radius * 1.0;
			if (width < 1024) return radius * 1.2;
			if (width < 1440) return radius * 1.4;
			return radius * 1.5;
		};

		const handleResize = () => {
			const width = window.innerWidth;
			const radius = Math.min(getResponsiveCameraRadius(width), 6.5);
			const gap = Math.min(getResponsiveSlideGap(radius, width), 10);
			setCameraRadius(radius);
			setSlideGap(gap);
		};

		let timeout: NodeJS.Timeout;
		const debouncedResize = () => {
			clearTimeout(timeout);
			timeout = setTimeout(handleResize, 100);
		};

		handleResize();
		window.addEventListener("resize", debouncedResize);
		return () => {
			clearTimeout(timeout);
			window.removeEventListener("resize", debouncedResize);
		};
	}, []);

	if (!isInitialized) return null;

	return (
		<>
			<ambientLight intensity={1.5} />
			<CameraHandler cameraRadius={cameraRadius} totalRadius={totalRadius} />
			<HoverLight totalRadius={totalRadius} cameraRadius={cameraRadius} />
			<Slides totalRadius={totalRadius} slideWidth={slideWidth} slideHeight={slideHeight} />
			<Ground positionY={groundY} />
		</>
	);
};
