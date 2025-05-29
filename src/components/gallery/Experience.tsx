import { useEffect, useState, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Mesh, Material, Object3D } from "three";

import { slideArray } from "@/utils/slideUtils";

import { Ground } from "./Ground";
import { Background } from "./Background";
import { CameraHandler } from "./CameraHandler";
import { Slides } from "./Slides";
import { HoverLight } from "./HoverLight";

export const Experience = () => {
	const { camera, viewport, scene } = useThree();

	const [cameraRadius, setCameraRadius] = useState<number>(0);
	const [slideGap, setSlideGap] = useState<number>(0);

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

	const MIN_SLIDE_GAP = 2.2;
	useEffect(() => {
		const handleResize = () => {
			const width = window.innerWidth;
			const clampedWidth = Math.min(Math.max(width, 320), 1920);
			const ratio = (clampedWidth - 320) / (1920 - 320);

			const radius = 4 + ratio * (6.5 - 4);
			const rawGap = radius * (1.0 + ratio * (1.5 - 1.0));
			const gap = Math.max(MIN_SLIDE_GAP, rawGap);

			setCameraRadius(radius);
			setSlideGap(gap);
		};

		handleResize();

		window.addEventListener("resize", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	// 메모리 해제
	useEffect(() => {
		return () => {
			scene.traverse((child: Object3D) => {
				if ((child as Mesh).isMesh) {
					const mesh = child as Mesh;
					mesh.geometry?.dispose();
					if (Array.isArray(mesh.material)) {
						mesh.material.forEach((m: Material) => m.dispose());
					} else {
						(mesh.material as Material)?.dispose();
					}
				}
			});
		};
	}, [scene]);

	if (!cameraRadius || !slideGap || !slideWidth || !slideHeight || !totalRadius) return null;

	return (
		<>
			<Background />
			<CameraHandler cameraRadius={cameraRadius} totalRadius={totalRadius} startIntro={true} />
			<HoverLight totalRadius={totalRadius} />
			<Ground positionY={groundY} />
			<Slides totalRadius={totalRadius} slideWidth={slideWidth} slideHeight={slideHeight} />
		</>
	);
};
