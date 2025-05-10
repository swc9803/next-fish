import { useRef } from "react";
import { Group } from "three";
import { useTexture } from "@react-three/drei";
import { useGallerySlide } from "@/store/useGallerySlide";
import { slideArray, getSlidePosition } from "@/utils/slideUtils";

interface SlidesProps {
	totalRadius: number;
	slideWidth: number;
	slideHeight: number;
}

export const Slides = ({ totalRadius, slideWidth, slideHeight }: SlidesProps) => {
	const { freemode, focusIndex, hoverIndex, isSliding, setFocusIndex, setSlide, setHoverIndex } = useGallerySlide();

	const texturesArray = slideArray.map((slide) => useTexture(slide.imagePaths));

	const groupRefs = useRef<(Group | null)[]>([]);

	return (
		<>
			{slideArray.map((slide, index) => {
				const { x, z, angleInRadians } = getSlidePosition(index, totalRadius);
				const rotationY = angleInRadians + Math.PI;
				const texture = texturesArray[index]?.[0];

				return (
					<group
						key={index}
						ref={(ref) => (groupRefs.current[index] = ref)}
						position={[x, 0, z]}
						rotation={[0, rotationY, 0]}
						onClick={() => {
							if (freemode && !isSliding) {
								if (focusIndex !== index) {
									setFocusIndex(index);
									setSlide(index);
								} else {
									setFocusIndex(null);
									requestAnimationFrame(() => setFocusIndex(index));
								}
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
								<planeGeometry args={[slideWidth + 0.1, slideHeight + 0.1]} />
								<meshLambertMaterial color="#9CB5ED" />
							</mesh>
							<mesh position={[0, 0, 0]}>
								<planeGeometry args={[slideWidth, slideHeight]} />
								<meshBasicMaterial map={texture} toneMapped={false} transparent={false} />
							</mesh>
						</group>
					</group>
				);
			})}
		</>
	);
};
