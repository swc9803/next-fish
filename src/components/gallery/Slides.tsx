"use client";

import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useGallerySlide } from "@/store/useGallerySlide";
import { slideArray, getSlidePosition } from "@/utils/slideUtils";

interface SlidesProps {
	totalRadius: number;
	aspectRatio: number;
	cameraRadius: number;
}

export const Slides = ({ totalRadius, aspectRatio }: SlidesProps) => {
	const { viewport } = useThree();
	const textures = useTexture(slideArray.map((m) => m.path));

	const { freemode, focusIndex, setFocusIndex, setSlide, setHoverIndex } = useGallerySlide();

	return (
		<>
			{slideArray.map((slide, index) => {
				const { x: slideX, z: slideZ, angleInRadians: slideAngle } = getSlidePosition(index, totalRadius);
				const slideRotationY = slideAngle + Math.PI;

				const slideWidth = viewport.width;
				const slideHeight = viewport.width * (9 / 16);

				return (
					<group
						key={index}
						position={[slideX, 0, slideZ]}
						rotation={[0, slideRotationY, 0]}
						onClick={() => {
							if (freemode) {
								setFocusIndex(index);
								setSlide(index);
							}
						}}
						onPointerOver={() => {
							if (!freemode || focusIndex !== null) return;
							setHoverIndex(index);
						}}
					>
						<mesh position-y={3}>
							<boxGeometry />
							<meshStandardMaterial color={slide.mainColor} />
						</mesh>

						<group>
							<mesh position={[0, 0, -0.03]}>
								<planeGeometry args={[slideWidth + 0.15, slideHeight + 0.1]} />
								<meshBasicMaterial color="#111111" toneMapped={false} />
							</mesh>
							<mesh position={[0, 0, -0.02]}>
								<planeGeometry args={[slideWidth + 0.05, slideHeight + 0.05]} />
								<meshBasicMaterial color="#ffffff" toneMapped={false} />
							</mesh>
							<mesh position={[0, 0, -0.01]}>
								<planeGeometry args={[slideWidth, slideHeight]} />
								<meshBasicMaterial map={textures[index]} toneMapped={false} />
							</mesh>
						</group>
					</group>
				);
			})}
		</>
	);
};
