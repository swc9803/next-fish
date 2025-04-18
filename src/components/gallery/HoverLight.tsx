"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, PointLight } from "three";
import { useGallerySlide } from "@/store/useGallerySlide";
import { slideArray } from "@/utils/slideUtils";

interface HoverLightProps {
	totalRadius: number;
	cameraRadius: number;
}

export const HoverLight = ({ totalRadius }: HoverLightProps) => {
	const bloomRef = useRef<Group>(null);
	const lightRef = useRef<PointLight>(null);
	const targetLightIndex = useRef<number>(0);
	const currentLightIndex = useRef<number>(0);
	const slideMoveStartTime = useRef<number | null>(null);
	const slideFromIndex = useRef<number>(0);
	const slideToIndex = useRef<number>(0);

	const { freemode, slide, hoverIndex } = useGallerySlide();

	const FREE_MODE_LIGHT_MOVE_DURATION = 1;
	const SLIDE_MODE_LIGHT_MOVE_DURATION = 2;

	function easeInOut(t: number): number {
		return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
	}

	useEffect(() => {
		if (freemode) {
			if (hoverIndex !== null) {
				targetLightIndex.current = hoverIndex;
			}
		} else {
			slideMoveStartTime.current = performance.now();
			slideFromIndex.current = currentLightIndex.current;
			slideToIndex.current = slide;

			targetLightIndex.current = slide;
		}
	}, [freemode, slide, hoverIndex]);

	useFrame((_, delta) => {
		if (!bloomRef.current || !lightRef.current) return;

		const isSlideMode = !freemode;
		const slideLength = slideArray.length;

		const getShortestDirection = (from: number, to: number) => {
			const diff = ((to - from + slideLength / 2) % slideLength) - slideLength / 2;
			return diff < -slideLength / 2 ? diff + slideLength : diff;
		};

		let lightTargetIndex: number;

		if (isSlideMode && slideMoveStartTime.current !== null) {
			const now = performance.now();
			const elapsed = (now - slideMoveStartTime.current) / 1000;
			const t = Math.min(elapsed / SLIDE_MODE_LIGHT_MOVE_DURATION, 1);
			const easedT = easeInOut(t);

			const diff = getShortestDirection(slideFromIndex.current, slideToIndex.current);
			lightTargetIndex = (slideFromIndex.current + diff * easedT + slideLength) % slideLength;

			if (t === 1) {
				slideMoveStartTime.current = null;
			}
			currentLightIndex.current = lightTargetIndex;
		} else {
			const ease = 1 - Math.pow(0.001, delta / FREE_MODE_LIGHT_MOVE_DURATION);
			const diff = getShortestDirection(currentLightIndex.current, targetLightIndex.current);
			currentLightIndex.current = (currentLightIndex.current + diff * ease + slideLength) % slideLength;
			lightTargetIndex = currentLightIndex.current;
		}

		const angle = -(2 * Math.PI * lightTargetIndex) / slideLength;
		const x = totalRadius * Math.sin(angle);
		const z = totalRadius * Math.cos(angle);

		const easePos = isSlideMode ? 0.2 : 1 - Math.pow(0.001, delta / FREE_MODE_LIGHT_MOVE_DURATION);

		bloomRef.current.position.x += (x - bloomRef.current.position.x) * easePos;
		bloomRef.current.position.z += (z - bloomRef.current.position.z) * easePos;

		const targetY = angle + Math.PI;
		bloomRef.current.rotation.y += (targetY - bloomRef.current.rotation.y) * easePos;
	});

	return (
		<group ref={bloomRef}>
			<pointLight ref={lightRef} position={[0, 0, -1]} intensity={30} distance={5} color="#ffffff" />
		</group>
	);
};
