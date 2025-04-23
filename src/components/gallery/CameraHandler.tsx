"use client";

import { useEffect, useRef, JSX, useCallback } from "react";
import { CameraControls } from "@react-three/drei";
import { Vector3 } from "three";

import { useGallerySlide } from "@/store/useGallerySlide";
import { getSlidePosition, slideArray } from "@/utils/slideUtils";

interface CameraHandlerProps {
	cameraRadius: number;
	totalRadius: number;
}

export const CameraHandler = ({ cameraRadius, totalRadius }: CameraHandlerProps): JSX.Element => {
	const cameraControlsRef = useRef<CameraControls>(null);
	const prevFreemodeRef = useRef(false);
	const hasInitializedRef = useRef(false);
	const lastSlideIndexRef = useRef<number>(-1);

	const { slide, setSlide, freemode, focusIndex, setLastFocusTarget, lastFocusTarget, isSliding, setIsSliding, setIsZoom } = useGallerySlide();
	const zoomOutRadius = cameraRadius + 2;

	// 슬라이드 인덱스에 해당하는 카메라 위치 계산
	const getCameraPosition = (targetX: number, targetZ: number, angleInRadians: number, radius: number) => ({
		x: targetX + radius * Math.sin(angleInRadians + Math.PI),
		z: targetZ + radius * Math.cos(angleInRadians + Math.PI),
	});

	// 슬라이드 이동
	const moveToSlide = useCallback(
		async (targetIndex: number, isInitial = false, skipZoom = false, skipFreemodeCheck = false) => {
			if (!cameraControlsRef.current) return;

			setIsSliding(true);

			const { x: targetX, z: targetZ, angleInRadians: targetAngle } = getSlidePosition(targetIndex, totalRadius);
			const nearCameraPos = getCameraPosition(targetX, targetZ, targetAngle, cameraRadius);
			const farCameraPos = getCameraPosition(targetX, targetZ, targetAngle, zoomOutRadius);

			setLastFocusTarget({ x: targetX, z: targetZ });

			if (isInitial || skipZoom) {
				await cameraControlsRef.current.setLookAt(nearCameraPos.x, 0, nearCameraPos.z, targetX, 0, targetZ, !isInitial);
				setIsSliding(false);
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
			await cameraControlsRef.current.setLookAt(nearCameraPos.x, 0, nearCameraPos.z, targetX, 0, targetZ, true);

			setIsZoom(false);
			setIsSliding(false);
		},
		[cameraRadius, zoomOutRadius, setIsSliding, setIsZoom, setLastFocusTarget, totalRadius]
	);

	// 초기 로드 시 slide view mode
	useEffect(() => {
		if (!hasInitializedRef.current && !freemode && focusIndex === null) {
			if (slide === 0) moveToSlide(slide, true);
			lastSlideIndexRef.current = slide;
			hasInitializedRef.current = true;
		}
	}, [freemode, focusIndex, moveToSlide, slide]);

	// slide 변경 시 카메라 이동
	useEffect(() => {
		if (!freemode && lastSlideIndexRef.current !== slide) {
			if (slideArray[slide]) {
				moveToSlide(slide);
				lastSlideIndexRef.current = slide;
			}
		}
	}, [slide, freemode, moveToSlide]);

	// free view mode에서 슬라이드 클릭 시 이동
	useEffect(() => {
		if (!freemode || focusIndex === null || !cameraControlsRef.current) return;

		setIsSliding(true);

		const { x: focusX, z: focusZ, angleInRadians: focusAngle } = getSlidePosition(focusIndex, totalRadius);
		const focusCameraPos = getCameraPosition(focusX, focusZ, focusAngle, cameraRadius);

		setLastFocusTarget({ x: focusX, z: focusZ });

		cameraControlsRef.current.setLookAt(focusCameraPos.x, 0, focusCameraPos.z, focusX, 0, focusZ, true).then(() => {
			setIsSliding(false);
		});

		if (slide === focusIndex) lastSlideIndexRef.current = slide;
	}, [freemode, focusIndex, slide, cameraRadius, setIsSliding, setLastFocusTarget, totalRadius]);

	// slide view mode로 변경 시 카메라 정면에 가장 가까운 슬라이드로 이동
	useEffect(() => {
		const prevWasFreemode = prevFreemodeRef.current;
		const currentIsFreemode = freemode;
		prevFreemodeRef.current = freemode;

		const enteredFreemodeNow = !prevWasFreemode && currentIsFreemode;
		const exitedFreemodeNow = prevWasFreemode && !currentIsFreemode;

		// free view mode 진입 시 카메라 뒤로 이동
		if (enteredFreemodeNow || (freemode && focusIndex === null)) {
			if (cameraControlsRef.current) {
				setIsSliding(true);

				const { x: focusX, z: focusZ } = lastFocusTarget ?? { x: 0, z: 0 };
				const angle = Math.atan2(focusX, focusZ);
				const distance = cameraRadius * 2.5;
				const camX = focusX + distance * Math.sin(angle + Math.PI);
				const camZ = focusZ + distance * Math.cos(angle + Math.PI);

				cameraControlsRef.current.setLookAt(camX, 0, camZ, 0, 0, 0, true).then(() => {
					setIsSliding(false);
				});
			}
		}

		// slide view mode 진입 시 현재 시선 방향 기준 가장 가까운 슬라이드로 이동
		if (exitedFreemodeNow && cameraControlsRef.current) {
			setIsSliding(true);

			const camera = cameraControlsRef.current.camera;
			const direction = new Vector3();
			camera.getWorldDirection(direction);

			const cameraPos = camera.position.clone();
			let minAngle = Infinity;
			let nearestIndex = 0;

			for (let i = 0; i < slideArray.length; i++) {
				const { x, z } = getSlidePosition(i, totalRadius);
				const slideVec = new Vector3(x - cameraPos.x, 0, z - cameraPos.z).normalize();
				const angle = direction.angleTo(slideVec);
				if (angle < minAngle) {
					minAngle = angle;
					nearestIndex = i;
				}
			}

			setSlide(nearestIndex);

			const wasZoomedIn = focusIndex !== null;
			moveToSlide(nearestIndex, false, !wasZoomedIn, true).then(() => {
				setIsSliding(false);
			});

			lastSlideIndexRef.current = nearestIndex;
		}
	}, [freemode, focusIndex, cameraRadius, lastFocusTarget, moveToSlide, setIsSliding, setSlide, totalRadius]);

	const isInteractive = freemode && focusIndex === null;

	useEffect(() => {
		if (hasInitializedRef.current && !freemode && focusIndex === null && slide === 0) {
			moveToSlide(slide, true);
		}
	}, [cameraRadius, totalRadius, freemode, focusIndex, moveToSlide, slide]);

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
