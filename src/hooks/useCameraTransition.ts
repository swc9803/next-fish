import { useRef, useCallback } from "react";
import { CameraControls } from "@react-three/drei";
import { useGallerySlide } from "@/store/useGallerySlide";
import { getSlidePosition } from "@/utils/slideUtils";

export const useCameraTransition = (cameraRadius: number, totalRadius: number) => {
	const cameraControlsRef = useRef<CameraControls>(null);
	const setState = useGallerySlide.setState;

	const getCameraPosition = (x: number, z: number, angle: number, radius: number) => ({
		x: x + radius * Math.sin(angle + Math.PI),
		z: z + radius * Math.cos(angle + Math.PI),
	});

	const moveToSlide = useCallback(
		async (index: number, skipZoom = false) => {
			const controls = cameraControlsRef.current;
			if (!controls) return;

			setState({ isSliding: true });

			const { x, z, angleInRadians } = getSlidePosition(index, totalRadius);
			const near = getCameraPosition(x, z, angleInRadians, cameraRadius);
			const far = getCameraPosition(x, z, angleInRadians, cameraRadius + 2);

			setState({ lastFocusTarget: { x, z } });

			if (skipZoom) {
				await controls.setLookAt(near.x, 0, near.z, x, 0, z, true);
			} else {
				setState({ isZoom: true });
				await controls.setLookAt(far.x, 0, far.z, x, 0, z, true);
				await controls.setLookAt(near.x, 0, near.z, x, 0, z, true);
				setState({ isZoom: false });
			}

			setTimeout(() => setState({ isSliding: false }), 300);
		},
		[cameraRadius, totalRadius]
	);

	const moveToFreeModePosition = useCallback(
		async (focus: { x: number; z: number } | null) => {
			const controls = cameraControlsRef.current;
			if (!controls) return;

			const { x, z } = focus ?? { x: 0, z: 0 };
			const angle = Math.atan2(x, z);
			const dist = cameraRadius * 2.5;
			const camX = x + dist * Math.sin(angle + Math.PI);
			const camZ = z + dist * Math.cos(angle + Math.PI);

			setState({ isSliding: true });
			await controls.setLookAt(camX, 0, camZ, 0, 0, 0, true);
			setTimeout(() => setState({ isSliding: false }), 300);
		},
		[cameraRadius]
	);

	return {
		cameraControlsRef,
		moveToSlide,
		moveToFreeModePosition,
	};
};
