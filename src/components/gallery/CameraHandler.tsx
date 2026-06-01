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

const INTRO_ORBIT_DURATION = 7000;
const INTRO_APPROACH_DURATION = 900;
const INTRO_APPROACH_START = INTRO_ORBIT_DURATION;
const INTRO_TOTAL_DURATION = INTRO_ORBIT_DURATION + INTRO_APPROACH_DURATION;
const easeOutSine = (t: number) => Math.sin((t * Math.PI) / 2);
const easeInQuart = (t: number) => t * t * t * t;

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
	const readyFrameRef = useRef<number | null>(null);
	const introFrameRef = useRef<number | null>(null);
	const zoomFrameRef = useRef<number | null>(null);

	useEffect(() => {
		readyFrameRef.current = requestAnimationFrame(() => setIsReadyToStart(true));
		return () => {
			if (readyFrameRef.current !== null) cancelAnimationFrame(readyFrameRef.current);
			if (introFrameRef.current !== null) cancelAnimationFrame(introFrameRef.current);
			if (zoomFrameRef.current !== null) cancelAnimationFrame(zoomFrameRef.current);
		};
	}, []);

	const playIntroAnimation = useCallback(() => {
		setHasIntroPlayed(true);
		setIsIntroPlaying(true);
		setIntroStarted(true);

		const controls = cameraControlsRef.current!;
		const { x, z } = getSlidePosition(0, totalRadius);
		const introRadius = Math.hypot(x, z);
		const angleStart = Math.atan2(z, x);
		const angleEnd = angleStart + Math.PI * 5;
		const finalCamera = new Vector3(x, 0, z - cameraRadius);
		const finalTarget = new Vector3(x, 0, z);
		const startTime = performance.now();

		const completeIntro = () => {
			lastSlideIndexRef.current = 0;
			setLastFocusTarget({ x, z });
			setSlide(0);
			setIsIntroPlaying(false);
			setCameraIntroDone(true);
		};

		const applyLookAt = (desiredCamera: Vector3, desiredTarget: Vector3) => {
			controls.setLookAt(desiredCamera.x, desiredCamera.y, desiredCamera.z, desiredTarget.x, desiredTarget.y, desiredTarget.z, false);
			controls.update(0);
		};

		const animate = () => {
			const elapsed = Math.min(performance.now() - startTime, INTRO_TOTAL_DURATION);
			const orbitElapsed = Math.min(elapsed, INTRO_ORBIT_DURATION);
			const orbitT = Math.min(orbitElapsed / INTRO_ORBIT_DURATION, 1);
			const orbitEasedT = easeOutSine(orbitT);
			const approachT = Math.min(Math.max((elapsed - INTRO_APPROACH_START) / INTRO_APPROACH_DURATION, 0), 1);
			const approachEasedT = easeInQuart(approachT);
			const angle = angleStart + orbitEasedT * (angleEnd - angleStart);
			const orbitX = introRadius * Math.cos(angle);
			const orbitZ = introRadius * Math.sin(angle);
			const orbitY = 5 + (0 - 5) * orbitEasedT;
			const orbitCamera = new Vector3(orbitX, orbitY, orbitZ);
			const orbitTarget = new Vector3(0, orbitY, 0);
			const cameraPosition = orbitCamera.clone().lerp(finalCamera, approachEasedT);
			const target = orbitTarget.clone().lerp(finalTarget, approachEasedT);

			applyLookAt(cameraPosition, target);

			if (elapsed < INTRO_TOTAL_DURATION) {
				introFrameRef.current = requestAnimationFrame(animate);
			} else {
				applyLookAt(finalCamera, finalTarget);
				completeIntro();
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
			if (zoomFrameRef.current !== null) cancelAnimationFrame(zoomFrameRef.current);
			zoomFrameRef.current = requestAnimationFrame(() => zoomToNearestSlide());
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
				one: (isInteractive ? 1 : 0) as 0, // 1 = TOUCH.ROTATE
				two: 0 as 0,
				three: 0 as 0,
			}}
			minPolarAngle={Math.PI / 2 - 0.001}
			maxPolarAngle={Math.PI / 2 + 0.001}
			azimuthRotateSpeed={-0.5}
			polarRotateSpeed={-0.5}
			draggingSmoothTime={0.25}
			dollySpeed={0.3}
		/>
	);
};
