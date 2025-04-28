import { useRef, useCallback } from "react";
import { CameraControls } from "@react-three/drei";
import { useGallerySlide } from "@/store/useGallerySlide";
import { getSlidePosition } from "@/utils/slideUtils";

export const useCameraTransition = (cameraRadius: number, totalRadius: number) => {
	const cameraControlsRef = useRef<CameraControls>(null);
	const { setLastFocusTarget, setIsSliding, setIsZoom } = useGallerySlide.getState();

	const zoomOutRadius = cameraRadius + 2;

	const getCameraPosition = (targetX: number, targetZ: number, angle: number, radius: number) => ({
		x: targetX + radius * Math.sin(angle + Math.PI),
		z: targetZ + radius * Math.cos(angle + Math.PI),
	});

	const moveToSlide = useCallback(
		async (targetIndex: number, skipZoom = false) => {
			const controls = cameraControlsRef.current;
			if (!controls) return;

			setIsSliding(true);

			const { x: targetX, z: targetZ, angleInRadians: targetAngle } = getSlidePosition(targetIndex, totalRadius);
			const nearPos = getCameraPosition(targetX, targetZ, targetAngle, cameraRadius);
			const farPos = getCameraPosition(targetX, targetZ, targetAngle, zoomOutRadius);

			setLastFocusTarget({ x: targetX, z: targetZ });

			if (skipZoom) {
				await controls.setLookAt(nearPos.x, 0, nearPos.z, targetX, 0, targetZ, true);
				setIsSliding(false);
				return;
			}

			setIsZoom(true);
			await controls.setLookAt(farPos.x, 0, farPos.z, targetX, 0, targetZ, true);
			await controls.setLookAt(nearPos.x, 0, nearPos.z, targetX, 0, targetZ, true);
			setIsZoom(false);

			setIsSliding(false);
		},
		[cameraRadius, zoomOutRadius, totalRadius]
	);

	const moveToFreeModePosition = useCallback(
		async (focus: { x: number; z: number } | null) => {
			const controls = cameraControlsRef.current;
			if (!controls) return;

			const { x, z } = focus ?? { x: 0, z: 0 };
			const angle = Math.atan2(x, z);
			const distance = cameraRadius * 2.5;
			const camX = x + distance * Math.sin(angle + Math.PI);
			const camZ = z + distance * Math.cos(angle + Math.PI);

			setIsSliding(true);
			await controls.setLookAt(camX, 0, camZ, 0, 0, 0, true);
			setIsSliding(false);
		},
		[cameraRadius]
	);

	return {
		cameraControlsRef,
		moveToSlide,
		moveToFreeModePosition,
	};
};
