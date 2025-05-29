import { useRef, useCallback } from "react";
import { CameraControls } from "@react-three/drei";

import { useGallerySlide } from "@/store/useGallerySlide";
import { getSlidePosition } from "@/utils/slideUtils";

const computeCameraPosition = (x: number, z: number, angle: number, radius: number) => ({
	x: x + radius * Math.sin(angle + Math.PI),
	z: z + radius * Math.cos(angle + Math.PI),
});

const performCameraZoom = async (
	controls: CameraControls,
	from: { x: number; z: number },
	to: { x: number; z: number },
	target: { x: number; z: number },
	setState: (state: any) => void
) => {
	setState({ isZoom: true });
	await controls.setLookAt(from.x, 0, from.z, target.x, 0, target.z, true);
	await controls.setLookAt(to.x, 0, to.z, target.x, 0, target.z, true);
	setState({ isZoom: false });
};

export const useCameraTransition = (cameraRadius: number, totalRadius: number) => {
	const cameraControlsRef = useRef<CameraControls>(null);
	const setState = useGallerySlide.setState;

	const moveToSlide = useCallback(
		async (index: number, skipZoom = false) => {
			const controls = cameraControlsRef.current;
			if (!controls) return;

			setState({ isSliding: true });

			const { x, z, angleInRadians } = getSlidePosition(index, totalRadius);
			const near = computeCameraPosition(x, z, angleInRadians, cameraRadius);
			const far = computeCameraPosition(x, z, angleInRadians, cameraRadius + 2);

			setState({ lastFocusTarget: { x, z } });

			if (skipZoom) {
				await controls.setLookAt(near.x, 0, near.z, x, 0, z, true);
			} else {
				await performCameraZoom(controls, far, near, { x, z }, setState);
			}

			setTimeout(() => setState({ isSliding: false }), 300);
		},
		[cameraRadius, totalRadius, setState]
	);

	const moveToFreeModePosition = useCallback(
		async (focus: { x: number; z: number } | null) => {
			const controls = cameraControlsRef.current;
			if (!controls) return;

			const { x, z } = focus ?? { x: 0, z: 0 };
			const angle = Math.atan2(x, z);
			const dist = cameraRadius * 2.5;
			const camPos = computeCameraPosition(x, z, angle, dist);

			setState({ isSliding: true });
			await controls.setLookAt(camPos.x, 0, camPos.z, 0, 0, 0, true);
			setTimeout(() => setState({ isSliding: false }), 300);
		},
		[cameraRadius, setState]
	);

	return {
		cameraControlsRef,
		moveToSlide,
		moveToFreeModePosition,
	};
};
