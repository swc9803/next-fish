"use client";

import { useEffect, useRef, JSX } from "react";
import { CameraControls } from "@react-three/drei";
import { useGallerySlide } from "@/store/useGallerySlide";
import { getSlidePosition } from "@/utils/slideUtils";

interface CameraHandlerProps {
	cameraRadius: number;
	totalRadius: number;
}

export const CameraHandler = ({ cameraRadius, totalRadius }: CameraHandlerProps): JSX.Element => {
	const cameraControlsRef = useRef<CameraControls>(null);
	const prevFreemodeRef = useRef(false);
	const hasInitializedRef = useRef(false);
	const lastSlideIndexRef = useRef<number>(-1);

	const { slide, freemode, focusIndex, setLastFocusTarget, lastFocusTarget, setIsSliding, setIsZoom } = useGallerySlide();
	const zoomOutRadius = cameraRadius + 2;

	const getCameraPosition = (targetX: number, targetZ: number, angleInRadians: number, radius: number) => ({
		x: targetX + radius * Math.sin(angleInRadians + Math.PI),
		z: targetZ + radius * Math.cos(angleInRadians + Math.PI),
	});

	const moveToSlide = async (targetIndex: number, isInitial = false) => {
		if (!cameraControlsRef.current || freemode) return;
		setIsSliding(true);

		const { x: targetX, z: targetZ, angleInRadians: targetAngle } = getSlidePosition(targetIndex, totalRadius);
		const closeCameraPos = getCameraPosition(targetX, targetZ, targetAngle, cameraRadius);
		const farCameraPos = getCameraPosition(targetX, targetZ, targetAngle, zoomOutRadius);

		setLastFocusTarget({ x: targetX, z: targetZ });

		if (isInitial) {
			cameraControlsRef.current.setLookAt(closeCameraPos.x, 0, closeCameraPos.z, targetX, 0, targetZ, false);
			requestAnimationFrame(() => {
				cameraControlsRef.current?.setLookAt(closeCameraPos.x, 0, closeCameraPos.z, targetX, 0, targetZ, true);
				setIsSliding(false);
			});
			return;
		}

		const { x: lastTargetX, z: lastTargetZ, angleInRadians: lastAngle } = getSlidePosition(lastSlideIndexRef.current, totalRadius);
		const lastFarCameraPos = getCameraPosition(lastTargetX, lastTargetZ, lastAngle, zoomOutRadius);

		setIsZoom(true);

		// 줌 아웃
		await cameraControlsRef.current.setLookAt(lastFarCameraPos.x, 0, lastFarCameraPos.z, lastTargetX, 0, lastTargetZ, true);
		// 회전
		await cameraControlsRef.current.setLookAt(farCameraPos.x, 0, farCameraPos.z, targetX, 0, targetZ, true);
		// 줌 인
		await cameraControlsRef.current.setLookAt(closeCameraPos.x, 0, closeCameraPos.z, targetX, 0, targetZ, true);

		setIsZoom(false);
		setIsSliding(false);
	};

	useEffect(() => {
		if (!hasInitializedRef.current && !freemode && focusIndex === null) {
			if (slide === 0) moveToSlide(slide, true);
			lastSlideIndexRef.current = slide;
			hasInitializedRef.current = true;
		}
	}, [freemode, focusIndex]);

	// 슬라이드 모드에서 이동
	useEffect(() => {
		if (!freemode && lastSlideIndexRef.current !== slide) {
			moveToSlide(slide);
			lastSlideIndexRef.current = slide;
		}
	}, [slide, freemode]);

	// 자유모드에서 슬라이드 클릭 시 이동
	useEffect(() => {
		if (!freemode || focusIndex === null || !cameraControlsRef.current) return;

		const { x: focusX, z: focusZ, angleInRadians: focusAngle } = getSlidePosition(focusIndex, totalRadius);
		const focusCameraPos = getCameraPosition(focusX, focusZ, focusAngle, cameraRadius);

		setLastFocusTarget({ x: focusX, z: focusZ });
		cameraControlsRef.current.setLookAt(focusCameraPos.x, 0, focusCameraPos.z, focusX, 0, focusZ, true);

		if (slide === focusIndex) lastSlideIndexRef.current = slide;
	}, [freemode, focusIndex, slide]);

	// 자유모드 변경 시 줌아웃
	useEffect(() => {
		const prevWasFreemode = prevFreemodeRef.current;
		const currentIsFreemode = freemode;
		prevFreemodeRef.current = freemode;

		const enteredFreemodeNow = !prevWasFreemode && currentIsFreemode;
		const needZoomOutToOverview = enteredFreemodeNow || (freemode && focusIndex === null);

		if (needZoomOutToOverview && cameraControlsRef.current) {
			const { x: focusX, z: focusZ } = lastFocusTarget ?? { x: 0, z: 0 };
			const angle = Math.atan2(focusX, focusZ);
			const distance = cameraRadius * 2.5;
			const camX = focusX + distance * Math.sin(angle + Math.PI);
			const camZ = focusZ + distance * Math.cos(angle + Math.PI);
			cameraControlsRef.current.setLookAt(camX, 0, camZ, 0, 0, 0, true);
		}
		if (!freemode && focusIndex !== null) {
			lastSlideIndexRef.current = focusIndex;
		}
	}, [freemode, focusIndex, cameraRadius, lastFocusTarget]);

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
