"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, PointLight } from "three";
import { useGallerySlide } from "@/store/useGallerySlide";
import { slideArray } from "@/utils/slideUtils";

export const HoverLight = ({ totalRadius }: { totalRadius: number }) => {
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

	// 슬라이드, hoverIndex 변경 시 target index 변경
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

	// free view mode에서 slide view mode로 변경
	useEffect(() => {
		let previousFreemode = freemode;

		const unsubscribe = useGallerySlide.subscribe((state) => {
			const newFreemode = state.freemode;

			if (previousFreemode && !newFreemode) {
				slideMoveStartTime.current = performance.now();
				slideFromIndex.current = Math.round(currentLightIndex.current);
				slideToIndex.current = state.slide;
				targetLightIndex.current = state.slide;
			}

			previousFreemode = newFreemode;
		});

		return () => unsubscribe();
	}, [freemode]);

	useFrame((_, delta) => {
		if (!bloomRef.current || !lightRef.current) return;

		const isSlideMode = !freemode;
		const slideLength = slideArray.length;

		const getNearestDirection = (from: number, to: number, length: number): number => {
			let diff = (to - from) % length;
			if (diff > length / 2) diff -= length;
			if (diff < -length / 2) diff += length;
			return diff;
		};

		let lightTargetIndex: number;

		if (isSlideMode && slideMoveStartTime.current !== null) {
			const now = performance.now();
			const elapsed = (now - slideMoveStartTime.current) / 1000;
			const t = Math.min(elapsed / SLIDE_MODE_LIGHT_MOVE_DURATION, 1);
			const easedT = easeInOut(t);

			const diff = getNearestDirection(slideFromIndex.current, slideToIndex.current, slideLength);
			lightTargetIndex = (slideFromIndex.current + diff * easedT + slideLength) % slideLength;

			if (t === 1) {
				slideMoveStartTime.current = null;
			}
			currentLightIndex.current = lightTargetIndex;
		} else {
			const ease = 1 - Math.pow(0.001, delta / FREE_MODE_LIGHT_MOVE_DURATION);
			const diff = getNearestDirection(currentLightIndex.current, targetLightIndex.current, slideLength);
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

		if (isSlideMode && slideMoveStartTime.current === null) {
			currentLightIndex.current = Math.round(currentLightIndex.current);
		}
	});

	return (
		<group ref={bloomRef}>
			<pointLight ref={lightRef} position={[0, 0, -1]} intensity={30} distance={5} color="#ffffff" />
		</group>
	);
};
