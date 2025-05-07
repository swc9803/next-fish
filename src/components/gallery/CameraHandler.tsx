"use client";

import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import { CameraControls } from "@react-three/drei";
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
	const prevFocusRef = useRef<number | null>(null);
	const isIntroPlating = useRef(false);
	const { setIsIntroPlaying } = useGallerySlide.getState();

	// 인트로 애니메이션
	useEffect(() => {
		if (isIntroPlating.current || !cameraControlsRef.current) return;
		isIntroPlating.current = true;
		setIsIntroPlaying(true);

		const controls = cameraControlsRef.current;
		let timeoutId: NodeJS.Timeout;
		let animationFrameId: number;

		const playIntroAnimation = () => {
			const { x: slideX, z: slideZ } = getSlidePosition(0, totalRadius);
			const introRadius = Math.hypot(slideX, slideZ);

			const slide0Angle = Math.atan2(slideZ, slideX);
			const startAngle = slide0Angle + Math.PI * 3;
			const endAngle = slide0Angle;
			const startTime = performance.now();
			const INTRO_DURATION = 2500;
			// const INTRO_DURATION = 500;

			const animate = () => {
				const elapsed = performance.now() - startTime;
				const t = Math.min(elapsed / INTRO_DURATION, 1);
				const easedT = 1 - Math.pow(1 - t, 3);

				const angle = startAngle + (1 - easedT) * (endAngle - startAngle);
				const camX = introRadius * Math.cos(angle);
				const camZ = introRadius * Math.sin(angle);

				controls.setLookAt(camX, 0, camZ, 0, 0, 0, false);

				if (t < 1) {
					animationFrameId = requestAnimationFrame(animate);
				} else {
					const finalCamPos = new Vector3(slideX, 0, slideZ - cameraRadius);

					controls.setLookAt(finalCamPos.x, 0, finalCamPos.z, slideX, 0, slideZ, true);

					setSlide(0);

					setTimeout(() => {
						setIsIntroPlaying(false);
					}, 550);
				}
			};

			animate();
		};

		timeoutId = setTimeout(playIntroAnimation, 1000);

		return () => {
			clearTimeout(timeoutId);
			cancelAnimationFrame(animationFrameId);
		};
	}, [cameraRadius, totalRadius, setSlide]);

	// 슬라이드 이동
	useEffect(() => {
		if (!freemode && lastSlideIndexRef.current !== slide) {
			moveToSlide(slide);
			lastSlideIndexRef.current = slide;
		}
	}, [slide, freemode, moveToSlide]);

	// 포커스 상태 이동
	useEffect(() => {
		if (freemode && focusIndex !== null && focusIndex !== lastSlideIndexRef.current) {
			moveToSlide(focusIndex, true);
			lastSlideIndexRef.current = focusIndex;
		} else if (freemode && focusIndex === null && prevFocusRef.current !== null) {
			moveToFreeModePosition(lastFocusTarget);
		}
		prevFocusRef.current = focusIndex;
	}, [freemode, focusIndex, moveToSlide, moveToFreeModePosition, lastFocusTarget]);

	// 모드 전환 시 정면에서 가까운 슬라이드 줌인
	useEffect(() => {
		const prev = prevFreemodeRef.current;
		const now = freemode;
		prevFreemodeRef.current = now;

		if (prev && !now && cameraControlsRef.current?.camera) {
			const camera = cameraControlsRef.current.camera;
			const direction = new Vector3();
			camera.getWorldDirection(direction);

			const cameraPos = camera.position.clone();
			let nearest = 0;
			let maxDot = -Infinity;

			for (let i = 0; i < slideArray.length; i++) {
				const { x, z } = getSlidePosition(i, totalRadius);
				const toSlide = new Vector3(x - cameraPos.x, 0, z - cameraPos.z).normalize();
				const dot = direction.dot(toSlide);
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
	}, [freemode, totalRadius, moveToSlide, moveToFreeModePosition, lastFocusTarget, setSlide, setFocusIndex, setHoverIndex]);

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
