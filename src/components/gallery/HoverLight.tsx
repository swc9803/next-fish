import { useEffect, useRef } from "react";
import { Vector3 } from "three";

import { useGallerySlide } from "@/store/useGallerySlide";
import { getSlidePosition } from "@/utils/slideUtils";
import { useLightTransition } from "@/hooks/useLightTransition";
import { useActiveSlideIndex } from "@/hooks/useActiveSlideIndex";

interface HoverLightProps {
	totalRadius: number;
}

const useResponsiveLightProps = () => {
	const width = window.innerWidth;
	const clampedWidth = Math.min(Math.max(width, 320), 1920);
	const ratio = (clampedWidth - 320) / (1920 - 320);

	return {
		intensity: 5 + ratio * 20,
		distance: 1 + ratio * 4,
	};
};

export const HoverLight = ({ totalRadius }: HoverLightProps) => {
	const { bloomRef, lightRef, setTarget } = useLightTransition();
	const freemode = useGallerySlide((s) => s.freemode);
	const activeSlideIndex = useActiveSlideIndex();

	const lightProps = useResponsiveLightProps();

	const lastIndexRef = useRef<number | null>(null);
	const lastModeRef = useRef<boolean | null>(null);

	useEffect(() => {
		if (activeSlideIndex === null) return;
		if (activeSlideIndex === lastIndexRef.current && freemode === lastModeRef.current) return;

		lastIndexRef.current = activeSlideIndex;
		lastModeRef.current = freemode;

		const { x, z } = getSlidePosition(activeSlideIndex, totalRadius);
		setTarget(new Vector3(x, 0.5, z));
	}, [activeSlideIndex, freemode, totalRadius, setTarget]);

	return (
		<group ref={bloomRef}>
			<pointLight ref={lightRef} intensity={lightProps.intensity} distance={lightProps.distance} color="#ffffff" />
		</group>
	);
};
