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
	const prevFocusRef = useRef<number | null>(null);
	const isFirstRender = useRef(true);
	const introPlaying = useRef(false);

	// 인트로 애니메이션
	useEffect(() => {
		if (introPlaying.current || !cameraControlsRef.current) return;
		introPlaying.current = true;

		const controls = cameraControlsRef.current;
		let timeoutId: NodeJS.Timeout;
		let animationFrameId: number;

		timeoutId = setTimeout(() => {
			const { x: slideX, z: slideZ } = getSlidePosition(0, totalRadius);
			const slide0Pos = new Vector3(slideX, 0, slideZ);
			const center = new Vector3(0, 0, 0);
			const introRadius = slide0Pos.distanceTo(center);
			const angleOffset = Math.PI;
			const duration = 4000;
			const steps = (duration / 1000) * 60;
			let currentStep = 0;

			const animate = () => {
				const angle = angleOffset + (currentStep / steps) * Math.PI * 2;
				const camX = center.x + introRadius * Math.cos(angle);
				const camZ = center.z + introRadius * Math.sin(angle);

				controls.setLookAt(camX, 0, camZ, center.x, 0, center.z, false);

				if (currentStep <= steps) {
					currentStep++;
					animationFrameId = requestAnimationFrame(animate);
				} else {
					const finalCamPos = new Vector3(slideX, 0, slideZ - cameraRadius);
					controls.setLookAt(finalCamPos.x, finalCamPos.y, finalCamPos.z, slideX, 0, slideZ, true);
					controls.dollyTo(cameraRadius * 0.7, true);
					moveToSlide(0);
					setSlide(0);
				}
			};

			animate();
		}, 1000);

		return () => {
			clearTimeout(timeoutId);
			cancelAnimationFrame(animationFrameId);
		};
	}, [cameraRadius, totalRadius, moveToSlide, setSlide]);

	useEffect(() => {
		if (!freemode && lastSlideIndexRef.current !== slide) {
			if (!isFirstRender.current) {
				moveToSlide(slide);
			}
			lastSlideIndexRef.current = slide;
		}
		isFirstRender.current = false;
	}, [slide, freemode, moveToSlide]);

	useEffect(() => {
		if (freemode) {
			if (focusIndex !== null) {
				moveToSlide(focusIndex, true);
			} else if (prevFocusRef.current !== null || focusIndex === null) {
				moveToFreeModePosition(lastFocusTarget);
			}
		}
		prevFocusRef.current = focusIndex;
	}, [freemode, focusIndex, moveToSlide, moveToFreeModePosition, lastFocusTarget]);

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
