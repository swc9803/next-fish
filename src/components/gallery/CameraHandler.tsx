import { useEffect, useRef, useState } from "react";
import { Vector3 } from "three";
import { CameraControls } from "@react-three/drei";
import { useCameraTransition } from "@/hooks/useCameraTransition";
import { useGallerySlide } from "@/store/useGallerySlide";
import { getSlidePosition, slideArray } from "@/utils/slideUtils";

interface CameraHandlerProps {
	cameraRadius: number;
	totalRadius: number;
	startIntro?: boolean;
}

export const CameraHandler = ({ cameraRadius, totalRadius, startIntro }: CameraHandlerProps) => {
	const { cameraControlsRef, moveToSlide, moveToFreeModePosition } = useCameraTransition(cameraRadius, totalRadius);

	const {
		slide,
		setSlide,
		freemode,
		focusIndex,
		lastFocusTarget,
		setLastFocusTarget,
		setHoverIndex,
		setFocusIndex,
		isIntroPlaying,
		setIsIntroPlaying,
		hasIntroPlayed,
		setHasIntroPlayed,
		setCameraIntroDone,
		setIntroStarted,
	} = useGallerySlide();

	const [isReadyToStart, setIsReadyToStart] = useState(false);
	const prevFreemodeRef = useRef(false);
	const prevFocusRef = useRef<number | null>(null);
	const lastSlideIndexRef = useRef<number>(-1);

	useEffect(() => {
		requestAnimationFrame(() => setIsReadyToStart(true));
	}, []);

	useEffect(() => {
		if (!isReadyToStart || !startIntro || hasIntroPlayed || !cameraControlsRef.current) return;

		setHasIntroPlayed(true);
		setIsIntroPlaying(true);
		setIntroStarted(true);

		const controls = cameraControlsRef.current;
		const { x: slideX, z: slideZ } = getSlidePosition(0, totalRadius);
		const introRadius = Math.hypot(slideX, slideZ);
		const slide0Angle = Math.atan2(slideZ, slideX);
		const startAngle = slide0Angle + Math.PI * 5;
		const endAngle = slide0Angle;
		const introStartY = 5;
		const introEndY = 0;
		const INTRO_DURATION = 5000;

		const startTime = performance.now();
		let animationFrameId: number;

		const animate = () => {
			const elapsed = performance.now() - startTime;
			const t = Math.min(elapsed / INTRO_DURATION, 1);
			const easedT = 1 - Math.pow(1 - t, 3);

			const angle = startAngle + (1 - easedT) * (endAngle - startAngle);
			const camX = introRadius * Math.cos(angle);
			const camZ = introRadius * Math.sin(angle);
			const camY = introStartY + (introEndY - introStartY) * easedT;

			controls.setLookAt(camX, camY, camZ, 0, camY, 0, false);

			if (t < 1) {
				animationFrameId = requestAnimationFrame(animate);
			} else {
				const finalCamPos = new Vector3(slideX, 0, slideZ - cameraRadius);
				controls.setLookAt(finalCamPos.x, 0, finalCamPos.z, slideX, 0, slideZ, true);

				setLastFocusTarget({ x: slideX, z: slideZ });
				setSlide(0);
				setIsIntroPlaying(false);
				setCameraIntroDone(true);
			}
		};

		animate();

		return () => {
			cancelAnimationFrame(animationFrameId);
		};
	}, [startIntro, isReadyToStart]);

	// 슬라이드 이동
	useEffect(() => {
		if (!isReadyToStart || isIntroPlaying || lastSlideIndexRef.current === slide) return;
		moveToSlide(slide);
		lastSlideIndexRef.current = slide;
	}, [slide, moveToSlide, isReadyToStart, isIntroPlaying]);

	// 포커스 이동
	useEffect(() => {
		if (!isReadyToStart || isIntroPlaying) return;

		const prevFocus = prevFocusRef.current;
		const shouldZoomToSlide = freemode && focusIndex !== null && (focusIndex !== lastSlideIndexRef.current || prevFocus === null);
		const shouldReturnToFreePosition = freemode && focusIndex === null && prevFocus !== null;

		if (shouldZoomToSlide) {
			moveToSlide(focusIndex, true);
			lastSlideIndexRef.current = focusIndex;
		}

		if (shouldReturnToFreePosition) {
			moveToFreeModePosition(lastFocusTarget);
		}

		prevFocusRef.current = focusIndex;
	}, [freemode, focusIndex, moveToSlide, moveToFreeModePosition, lastFocusTarget, isReadyToStart, isIntroPlaying]);

	// 모드 전환시 정면 슬라이드 줌인
	useEffect(() => {
		if (!isReadyToStart || isIntroPlaying) return;

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
			moveToFreeModePosition(lastFocusTarget);
		}
	}, [
		freemode,
		totalRadius,
		moveToSlide,
		moveToFreeModePosition,
		lastFocusTarget,
		setSlide,
		setFocusIndex,
		setHoverIndex,
		isReadyToStart,
		isIntroPlaying,
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
