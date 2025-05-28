import { useEffect, useRef, useMemo, useState } from "react";
import { Vector3 } from "three";
import { useGallerySlide } from "@/store/useGallerySlide";
import { getSlidePosition } from "@/utils/slideUtils";
import { useLightTransition } from "@/hooks/useLightTransition";
import { useActiveSlideIndex } from "@/hooks/useActiveSlideIndex";

interface HoverLightProps {
	totalRadius: number;
}

const useResponsiveLightProps = () => {
	const ref = useRef({ intensity: 30, distance: 5 });
	const [, forceRender] = useState(0);

	useEffect(() => {
		const updateLightProps = () => {
			const width = window.innerWidth;
			const clampedWidth = Math.min(Math.max(width, 320), 1920);
			const ratio = (clampedWidth - 320) / (1920 - 320);

			ref.current = {
				intensity: 5 + ratio * 20,
				distance: 1 + ratio * 4,
			};
			forceRender((prev) => prev + 1);
		};

		updateLightProps();

		const timeoutRef = { current: 0 as any };
		const debouncedResize = () => {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = setTimeout(updateLightProps, 100);
		};

		window.addEventListener("resize", debouncedResize);
		return () => {
			clearTimeout(timeoutRef.current);
			window.removeEventListener("resize", debouncedResize);
		};
	}, []);

	return ref.current;
};

export const HoverLight = ({ totalRadius }: HoverLightProps) => {
	const { bloomRef, lightRef, setTarget } = useLightTransition();
	const { freemode } = useGallerySlide();
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
