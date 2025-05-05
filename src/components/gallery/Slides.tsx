"use client";

import { useTexture } from "@react-three/drei";
import { useGallerySlide } from "@/store/useGallerySlide";
import { slideArray, getSlidePosition } from "@/utils/slideUtils";

interface SlidesProps {
	totalRadius: number;
	slideWidth: number;
	slideHeight: number;
}

export const Slides = ({ totalRadius, slideWidth, slideHeight }: SlidesProps) => {
	const { freemode, focusIndex, setFocusIndex, setSlide, hoverIndex, setHoverIndex } = useGallerySlide();

	const texturesArray = slideArray.map((slide) => useTexture(slide.imagePaths));

	return (
		<>
			{slideArray.map((slide, index) => {
				const { x, z, angleInRadians } = getSlidePosition(index, totalRadius);
				const rotationY = angleInRadians + Math.PI;
				const texture = texturesArray[index][0];

				return (
					<group
						key={index}
						position={[x, 0, z]}
						rotation={[0, rotationY, 0]}
						onClick={() => {
							if (freemode) {
								setFocusIndex(index);
								setSlide(index);
							}
						}}
						onPointerOver={() => {
							if (freemode && focusIndex === null && hoverIndex !== index) {
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
							<mesh position={[0, 0, 0]}>
								<planeGeometry args={[slideWidth, slideHeight]} />
								<meshBasicMaterial map={texture} toneMapped={false} />
							</mesh>
						</group>
					</group>
				);
			})}
		</>
	);
};
