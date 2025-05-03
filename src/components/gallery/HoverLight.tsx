"use client";

import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import { useGallerySlide } from "@/store/useGallerySlide";
import { getSlidePosition } from "@/utils/slideUtils";
import { useLightTransition } from "@/hooks/useLightTransition";

interface HoverLightProps {
	totalRadius: number;
}

export const HoverLight = ({ totalRadius }: HoverLightProps) => {
	const { bloomRef, lightRef, setTarget } = useLightTransition();

	const { freemode, hoverIndex, focusIndex, slide } = useGallerySlide();

	const lastIndexRef = useRef<number | null>(null);
	const lastModeRef = useRef<boolean | null>(null);

	useEffect(() => {
		let targetIndex: number | null = null;

		if (!freemode) {
			targetIndex = slide;
		} else {
			if (hoverIndex !== null) {
				targetIndex = hoverIndex;
			} else if (focusIndex !== null) {
				targetIndex = focusIndex;
			}
		}

		const currentMode = freemode;

		if (targetIndex === lastIndexRef.current && currentMode === lastModeRef.current) {
			return;
		}

		lastIndexRef.current = targetIndex;
		lastModeRef.current = currentMode;

		if (targetIndex !== null) {
			const { x, z } = getSlidePosition(targetIndex, totalRadius);
			const targetPos = new Vector3(x, 0.5, z);
			setTarget(targetPos);
		}
	}, [hoverIndex, focusIndex, slide, freemode, totalRadius, setTarget]);

	return (
		<group ref={bloomRef}>
			<pointLight ref={lightRef} position={[0, 0, -1]} intensity={30} distance={5} color="#ffffff" />
		</group>
	);
};
