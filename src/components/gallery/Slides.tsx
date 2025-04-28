"use client";

import { useTexture } from "@react-three/drei";

import { useGallerySlide } from "@/store/useGallerySlide";
import { slideArray, getSlidePosition } from "@/utils/slideUtils";

export const Slides = ({ totalRadius, slideWidth, slideHeight }: { totalRadius: number; slideWidth: number; slideHeight: number }) => {
	const { freemode, focusIndex, setFocusIndex, setSlide, setHoverIndex } = useGallerySlide();
	const texturesArray = slideArray.map((slide) => useTexture(slide.imagePaths));

	return (
		<>
			{slideArray.map((slide, index) => {
				const { x, z, angleInRadians } = getSlidePosition(index, totalRadius);
				const slideRotationY = angleInRadians + Math.PI;
				const currentTexture = texturesArray[index][0];
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
