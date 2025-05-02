"use client";

import { useEffect, useRef } from "react";
import { CameraControls } from "@react-three/drei";
import { Vector3 } from "three";
import { useCameraTransition } from "@/hooks/useCameraTransition";
import { useGallerySlide } from "@/store/useGallerySlide";
import { getSlidePosition, slideArray } from "@/utils/slideUtils";

interface CameraHandlerProps {
	cameraRadius: number;
	totalRadius: number;
}

export const CameraHandler = ({ cameraRadius, totalRadius }: CameraHandlerProps) => {
	const { cameraControlsRef, moveToSlide, moveToFreeModePosition } = useCameraTransition(cameraRadius, totalRadius);

	const { slide, setSlide, freemode, focusIndex, lastFocusTarget, setHoverIndex, setFocusIndex } = useGallerySlide();

	const lastSlideIndexRef = useRef<number>(-1);
	const prevFreemodeRef = useRef(false);

	// 초기 진입 (slide 이동)
	useEffect(() => {
		moveToSlide(slide, true);
		lastSlideIndexRef.current = slide;
	}, []);

	// 슬라이드 변경 감지
	useEffect(() => {
		if (!freemode && lastSlideIndexRef.current !== slide) {
			moveToSlide(slide);
			lastSlideIndexRef.current = slide;
		}
	}, [slide, freemode, moveToSlide]);

	// 자유 모드에서 슬라이드 클릭 시 이동
	useEffect(() => {
		if (freemode && focusIndex !== null) {
			moveToSlide(focusIndex, true);
		}
	}, [freemode, focusIndex, moveToSlide]);

	// 모드 전환 감지
	useEffect(() => {
		const prev = prevFreemodeRef.current;
		const now = freemode;
		prevFreemodeRef.current = now;

		if (prev && !now) {
			// free -> slide 모드 전환
			const camera = cameraControlsRef.current?.camera;
			if (!camera) return;

			const direction = new Vector3();
			camera.getWorldDirection(direction);

			const cameraPos = camera.position.clone();
			let nearest = 0;
			let maxDot = -Infinity;

			for (let i = 0; i < slideArray.length; i++) {
				const { x, z } = getSlidePosition(i, totalRadius);
				const vec = new Vector3(x - cameraPos.x, 0, z - cameraPos.z).normalize();
				const dot = direction.dot(vec);
				if (dot > maxDot) {
					maxDot = dot;
					nearest = i;
				}
			}

			setFocusIndex(null);
			setHoverIndex(null);
			setSlide(nearest);
			moveToSlide(nearest, true);
			lastSlideIndexRef.current = nearest;
		}

		if (!prev && now) {
			// slide -> free 모드 전환
			moveToFreeModePosition(lastFocusTarget);
		}
	}, [freemode, lastFocusTarget, setSlide, setHoverIndex, moveToSlide, moveToFreeModePosition, totalRadius]);

	const isInteractive = freemode && focusIndex === null;

	return (
		<CameraControls
			ref={cameraControlsRef}
			mouseButtons={{
				left: isInteractive ? 1 : 0, // 1 = rotate
				middle: 0,
				right: 0,
				wheel: 0,
			}}
			touches={{
				one: isInteractive ? 32 : 0, // 32 = touch rotate
				two: 0,
				three: 0,
			}}
			minPolarAngle={Math.PI / 2}
			maxPolarAngle={Math.PI / 2}
			azimuthRotateSpeed={-0.5}
			polarRotateSpeed={-0.5}
			draggingSmoothTime={0.25}
			dollySpeed={0.3}
		/>
	);
};
