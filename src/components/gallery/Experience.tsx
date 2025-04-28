"use client";

import { useEffect, useState, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { useGallerySlide } from "@/store/useGallerySlide";
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
		return slideWidth / aspect;
	}, [slideWidth, aspect]);

	const totalRadius = useMemo(() => {
		if (!slideGap) return 0;
		return (slideGap * slideArray.length) / (2 * Math.PI);
	}, [slideGap]);

	const groundY = useMemo(() => {
		if (!cameraRadius) return 0;
		return -cameraRadius * 0.29;
	}, [cameraRadius]);

	const isInitialized = cameraRadius !== undefined && slideGap !== undefined;

	useEffect(() => {
		const getResponsiveCameraRadius = (width: number) => {
			if (width < 640) return 4;
			if (width < 1024) return 5;
			if (width < 1440) return 6;
			return 6.5;
		};

		const getResponsiveSlideGap = (radius: number, width: number) => {
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

	const { setFocusIndex } = useGallerySlide();
	useEffect(() => {
		setFocusIndex(0);
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
