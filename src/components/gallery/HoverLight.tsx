import { useEffect, useRef, useMemo, useState } from "react";
import { Vector3 } from "three";
import { useGallerySlide } from "@/store/useGallerySlide";
import { getSlidePosition } from "@/utils/slideUtils";
import { useLightTransition } from "@/hooks/useLightTransition";

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
				intensity: 10 + ratio * 20,
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
	const { freemode, hoverIndex, focusIndex, slide } = useGallerySlide();

	const lightProps = useResponsiveLightProps();

	const targetIndex = useMemo(() => {
		return !freemode ? slide : hoverIndex ?? focusIndex;
	}, [freemode, hoverIndex, focusIndex, slide]);

	const lastTargetRef = useRef<number | null>(null);
	const lastModeRef = useRef<boolean | null>(null);

	useEffect(() => {
		if (targetIndex === null) return;
		if (targetIndex === lastTargetRef.current && freemode === lastModeRef.current) return;

		lastTargetRef.current = targetIndex;
		lastModeRef.current = freemode;

		const { x, z } = getSlidePosition(targetIndex, totalRadius);
		setTarget(new Vector3(x, 0.5, z));
	}, [targetIndex, freemode, totalRadius, setTarget]);

	return (
		<group ref={bloomRef}>
			<pointLight ref={lightRef} intensity={lightProps.intensity} distance={lightProps.distance} color="#ffffff" />
		</group>
	);
};
