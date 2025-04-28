import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, PointLight } from "three";
import { useGallerySlide } from "@/store/useGallerySlide";
import { slideArray } from "@/utils/slideUtils";

export const useLightTransition = (totalRadius: number) => {
	const bloomRef = useRef<Group>(null);
	const lightRef = useRef<PointLight>(null);

	const targetIndex = useRef(0);
	const currentIndex = useRef(0);
	const moveStartTime = useRef<number | null>(null);
	const fromIndex = useRef(0);
	const toIndex = useRef(0);

	const { freemode, slide, hoverIndex } = useGallerySlide();

	const FREE_MODE_DURATION = 1;
	const SLIDE_MODE_DURATION = 2;

	function easeInOut(t: number): number {
		return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
	}

	function getShortestDirection(from: number, to: number, length: number) {
		let diff = (to - from) % length;
		if (diff > length / 2) diff -= length;
		if (diff < -length / 2) diff += length;
		return diff;
	}

	useEffect(() => {
		if (freemode && hoverIndex !== null) {
			targetIndex.current = hoverIndex;
		} else if (!freemode) {
			moveStartTime.current = performance.now();
			fromIndex.current = currentIndex.current;
			toIndex.current = slide;
			targetIndex.current = slide;
		}
	}, [freemode, hoverIndex, slide]);

	useFrame((_, delta) => {
		if (!bloomRef.current || !lightRef.current) return;

		const slideLength = slideArray.length;
		const isSlideMode = !freemode;
		let target;

		if (isSlideMode && moveStartTime.current !== null) {
			const now = performance.now();
			const elapsed = (now - moveStartTime.current) / 1000;
			const t = Math.min(elapsed / SLIDE_MODE_DURATION, 1);
			const easedT = easeInOut(t);

			const diff = getShortestDirection(fromIndex.current, toIndex.current, slideLength);
			target = (fromIndex.current + diff * easedT + slideLength) % slideLength;

			if (t === 1) moveStartTime.current = null;
		} else {
			const ease = 1 - Math.pow(0.001, delta / FREE_MODE_DURATION);
			const diff = getShortestDirection(currentIndex.current, targetIndex.current, slideLength);
			target = (currentIndex.current + diff * ease + slideLength) % slideLength;
		}

		currentIndex.current = target;

		const angle = -(2 * Math.PI * target) / slideLength;
		const x = totalRadius * Math.sin(angle);
		const z = totalRadius * Math.cos(angle);

		const easePos = isSlideMode ? 0.2 : 1 - Math.pow(0.001, delta / FREE_MODE_DURATION);

		bloomRef.current.position.x += (x - bloomRef.current.position.x) * easePos;
		bloomRef.current.position.z += (z - bloomRef.current.position.z) * easePos;
		bloomRef.current.rotation.y += (angle + Math.PI - bloomRef.current.rotation.y) * easePos;
	});

	return {
		bloomRef,
		lightRef,
	};
};
