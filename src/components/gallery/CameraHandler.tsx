import { useCallback, useEffect, useRef, useState } from "react";
import { CameraControls } from "@react-three/drei";
import { Vector3 } from "three";

import { useCameraTransition } from "@/hooks/useCameraTransition";
import { useGallerySlide } from "@/store/useGallerySlide";
import { getSlidePosition, slideArray } from "@/utils/slideUtils";

interface CameraHandlerProps {
	cameraRadius: number;
	totalRadius: number;
	startIntro?: boolean;
}

const INTRO_DURATION = 5000;

export const CameraHandler = ({ cameraRadius, totalRadius, startIntro }: CameraHandlerProps) => {
	const { cameraControlsRef, moveToSlide, moveToFreeModePosition } = useCameraTransition(cameraRadius, totalRadius);

	const slide = useGallerySlide((s) => s.slide);
	const freemode = useGallerySlide((s) => s.freemode);
	const focusIndex = useGallerySlide((s) => s.focusIndex);
	const lastFocusTarget = useGallerySlide((s) => s.lastFocusTarget);
	const setSlide = useGallerySlide((s) => s.setSlide);
	const setFocusIndex = useGallerySlide((s) => s.setFocusIndex);
	const setHoverIndex = useGallerySlide((s) => s.setHoverIndex);
	const setLastFocusTarget = useGallerySlide((s) => s.setLastFocusTarget);
	const setIsIntroPlaying = useGallerySlide((s) => s.setIsIntroPlaying);
	const setHasIntroPlayed = useGallerySlide((s) => s.setHasIntroPlayed);
	const setCameraIntroDone = useGallerySlide((s) => s.setCameraIntroDone);
	const setIntroStarted = useGallerySlide((s) => s.setIntroStarted);
	const isIntroPlaying = useGallerySlide((s) => s.isIntroPlaying);
	const hasIntroPlayed = useGallerySlide((s) => s.hasIntroPlayed);

	const [isReadyToStart, setIsReadyToStart] = useState(false);
	const prevFreemodeRef = useRef(false);
	const prevFocusRef = useRef<number | null>(null);
	const lastSlideIndexRef = useRef<number>(-1);

	useEffect(() => {
		requestAnimationFrame(() => setIsReadyToStart(true));
	}, []);

	const playIntroAnimation = useCallback(() => {
		setHasIntroPlayed(true);
		setIsIntroPlaying(true);
		setIntroStarted(true);

		const controls = cameraControlsRef.current!;
		const { x, z } = getSlidePosition(0, totalRadius);
		const introRadius = Math.hypot(x, z);
		const angleStart = Math.atan2(z, x) + Math.PI * 5;
		const angleEnd = Math.atan2(z, x);
		const startTime = performance.now();

		const animate = () => {
			const elapsed = performance.now() - startTime;
			const t = Math.min(elapsed / INTRO_DURATION, 1);
			const easedT = 1 - Math.pow(1 - t, 3);
			const angle = angleStart + (1 - easedT) * (angleEnd - angleStart);
			const camX = introRadius * Math.cos(angle);
			const camZ = introRadius * Math.sin(angle);
			const camY = 5 + (0 - 5) * easedT;

			controls.setLookAt(camX, camY, camZ, 0, camY, 0, false);

			if (t < 1) {
				requestAnimationFrame(animate);
			} else {
				controls.setLookAt(x, 0, z - cameraRadius, x, 0, z, true);
				setLastFocusTarget({ x, z });
				setSlide(0);
				setIsIntroPlaying(false);
				setCameraIntroDone(true);
			}
		};

		animate();
	}, [
		cameraControlsRef,
		setHasIntroPlayed,
		setIsIntroPlaying,
		setIntroStarted,
		setLastFocusTarget,
		setSlide,
		setCameraIntroDone,
		totalRadius,
		cameraRadius,
	]);

	useEffect(() => {
		if (!isReadyToStart || !startIntro || hasIntroPlayed || !cameraControlsRef.current) return;
		playIntroAnimation();
	}, [startIntro, isReadyToStart, hasIntroPlayed, cameraControlsRef, playIntroAnimation]);

	useEffect(() => {
		if (!isReadyToStart || isIntroPlaying || slide === lastSlideIndexRef.current) return;
		moveToSlide(slide);
		lastSlideIndexRef.current = slide;
	}, [slide, moveToSlide, isReadyToStart, isIntroPlaying]);

	useEffect(() => {
		if (!isReadyToStart || isIntroPlaying) return;

		const prevFocus = prevFocusRef.current;
		const isNewFocus = freemode && focusIndex !== null && (focusIndex !== lastSlideIndexRef.current || prevFocus === null);
		const isFocusCleared = freemode && focusIndex === null && prevFocus !== null;

		if (isNewFocus) {
			moveToSlide(focusIndex, true);
			lastSlideIndexRef.current = focusIndex;
		}
		if (isFocusCleared) {
			moveToFreeModePosition(lastFocusTarget);
		}

		prevFocusRef.current = focusIndex;
	}, [freemode, focusIndex, moveToSlide, moveToFreeModePosition, lastFocusTarget, isReadyToStart, isIntroPlaying]);

	const zoomToNearestSlide = useCallback(() => {
		const camera = cameraControlsRef.current!.camera;
		camera.updateMatrixWorld();

		const direction = new Vector3();
		camera.getWorldDirection(direction);
		const position = camera.position.clone();

		let nearestIndex = 0;
		let maxDot = -Infinity;

		slideArray.forEach((_, i) => {
			const { x, z } = getSlidePosition(i, totalRadius);
			const toSlide = new Vector3(x - position.x, 0, z - position.z).normalize();
			const dot = direction.dot(toSlide);
			if (dot > maxDot) {
				maxDot = dot;
				nearestIndex = i;
			}
		});

		setFocusIndex(null);
		setHoverIndex(null);
		setSlide(nearestIndex);
		moveToSlide(nearestIndex, true);
		lastSlideIndexRef.current = nearestIndex;
	}, [cameraControlsRef, setFocusIndex, setHoverIndex, setSlide, moveToSlide, totalRadius]);

	// 모드 전환시 정면 슬라이드 줌인
	useEffect(() => {
		if (!isReadyToStart || isIntroPlaying) return;

		const prevMode = prevFreemodeRef.current;
		const currentMode = freemode;
		prevFreemodeRef.current = currentMode;

		if (prevMode && !currentMode && cameraControlsRef.current?.camera) {
			requestAnimationFrame(() => zoomToNearestSlide());
		}

		if (!prevMode && currentMode) {
			moveToFreeModePosition(lastFocusTarget);
		}
	}, [
		freemode,
		totalRadius,
		moveToSlide,
		moveToFreeModePosition,
		lastFocusTarget,
		isReadyToStart,
		isIntroPlaying,
		cameraControlsRef,
		zoomToNearestSlide,
	]);

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
				one: isInteractive ? 32 : 0, // 32 = touch
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
