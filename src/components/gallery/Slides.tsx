"use client";

import { useTexture } from "@react-three/drei";
import { useGallerySlide } from "@/store/useGallerySlide";
import { slideArray, getSlidePosition } from "@/utils/slideUtils";
import { useEffect, useRef } from "react";

interface SlideState {
	currentImageIndex: number;
	intervalId: NodeJS.Timeout | null;
	isActive: boolean;
}

export const Slides = ({ totalRadius, slideWidth, slideHeight }: { totalRadius: number; slideWidth: number; slideHeight: number }) => {
	const { freemode, focusIndex, currentLightIndex, setFocusIndex, setSlide, setHoverIndex } = useGallerySlide();
	const texturesArray = slideArray.map((slide) => useTexture(slide.imagePaths));

	const slideStates = useRef<SlideState[]>(
		slideArray.map(() => ({
			currentImageIndex: 0,
			intervalId: null,
			isActive: false,
		}))
	);

	const startAnimation = (index: number) => {
		const slide = slideStates.current[index];
		if (slide.intervalId) return;

		const textures = texturesArray[index];
		if (!textures.length) return;

		console.log(`[start] 슬라이드 ${index}번 시작`);

		slide.intervalId = setInterval(() => {
			slide.currentImageIndex = (slide.currentImageIndex + 1) % textures.length;
			console.log(`[slide ${index}] 이미지 변경: ${slide.currentImageIndex}`);
		}, 4000);
	};

	const stopAnimation = (index: number) => {
		const slide = slideStates.current[index];
		if (slide.intervalId) {
			clearInterval(slide.intervalId);
			slide.intervalId = null;
			console.log(`[stop] 슬라이드 ${index}번 중지`);
		}
	};

	useEffect(() => {
		slideStates.current.forEach((slide, index) => {
			const isFocused = focusIndex === index;
			const isHovered = Math.round(currentLightIndex ?? -1) === index;
			const shouldActivate = (freemode && (isFocused || isHovered)) || (!freemode && isFocused);

			if (shouldActivate && !slide.isActive) {
				slide.isActive = true;
				startAnimation(index);
			} else if (!shouldActivate && slide.isActive) {
				slide.isActive = false;
				stopAnimation(index);
			}
		});
	}, [freemode, focusIndex, currentLightIndex, texturesArray]);

	useEffect(() => {
		if (focusIndex !== null && !slideStates.current[focusIndex].isActive) {
			startAnimation(focusIndex);
			slideStates.current[focusIndex].isActive = true;
		}
	}, [focusIndex]);

	return (
		<>
			{slideArray.map((slide, index) => {
				const { x, z, angleInRadians } = getSlidePosition(index, totalRadius);
				const slideRotationY = angleInRadians + Math.PI;
				const currentTexture = texturesArray[index][slideStates.current[index].currentImageIndex];

				return (
					<group
						key={index}
						position={[x, 0, z]}
						rotation={[0, slideRotationY, 0]}
						onClick={() => {
							if (freemode) {
								setFocusIndex(index);
								setSlide(index);
							}
						}}
						onPointerOver={() => {
							if (freemode && focusIndex === null) {
								setHoverIndex(index);
							}
						}}
					>
						<group>
							<mesh position={[0, 0, -0.03]}>
								<planeGeometry args={[slideWidth + 0.15, slideHeight + 0.1]} />
								<meshBasicMaterial color="#111111" toneMapped={false} />
							</mesh>
							<mesh position={[0, 0, -0.02]}>
								<planeGeometry args={[slideWidth + 0.05, slideHeight + 0.05]} />
								<meshLambertMaterial color="#ffffff" toneMapped={false} />
							</mesh>
							<mesh position={[0, 0, -0.01]}>
								<planeGeometry args={[slideWidth, slideHeight]} />
								<meshBasicMaterial map={currentTexture} toneMapped={false} />
							</mesh>
						</group>
					</group>
				);
			})}
		</>
	);
};
