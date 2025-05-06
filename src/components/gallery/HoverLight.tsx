"use client";

import { useEffect, useRef, useState } from "react";
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

	const [lightProps, setLightProps] = useState({ intensity: 30, distance: 5 });

	useEffect(() => {
		const updateLightProps = () => {
			const width = window.innerWidth;
			const minWidth = 320;
			const maxWidth = 1920;
			const clampedWidth = Math.max(minWidth, Math.min(maxWidth, width));
			const ratio = (clampedWidth - minWidth) / (maxWidth - minWidth);

			const intensity = 10 + ratio * (30 - 10);
			const distance = 1 + ratio * (5 - 1);
			setLightProps({ intensity, distance });
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

	const updateTarget = () => {
		const targetIndex = !freemode ? slide : hoverIndex ?? focusIndex;
		if (targetIndex !== null) {
			const { x, z } = getSlidePosition(targetIndex, totalRadius);
			setTarget(new Vector3(x, 0.5, z));
		}
	};

	useEffect(() => {
		const targetIndex = !freemode ? slide : hoverIndex ?? focusIndex;

		if (targetIndex === lastIndexRef.current && freemode === lastModeRef.current) return;

		lastIndexRef.current = targetIndex;
		lastModeRef.current = freemode;

		updateTarget();
	}, [hoverIndex, focusIndex, slide, freemode, totalRadius, setTarget]);

	useEffect(() => {
		updateTarget();
	}, [totalRadius]);

	return (
		<group ref={bloomRef}>
			<pointLight ref={lightRef} position={[0, 0, -1]} intensity={lightProps.intensity} distance={lightProps.distance} color="#ffffff" />
		</group>
	);
};
