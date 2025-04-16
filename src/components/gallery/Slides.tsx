"use client";

import { useRef } from "react";
import { useTexture } from "@react-three/drei";
import { useGallerySlide } from "@/store/useGallerySlide";
import { slideArray, getSlidePosition } from "@/utils/slideUtils";
import { useThree } from "@react-three/fiber";

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
								<planeGeometry args={[viewport.height * aspectRatio + 0.25, viewport.height + 0.2]} />
								<meshBasicMaterial color="#111111" toneMapped={false} />
							</mesh>
							<mesh position={[0, 0, -0.02]}>
								<planeGeometry args={[viewport.height * aspectRatio + 0.075, viewport.height + 0.075]} />
								<meshBasicMaterial color="#ffffff" toneMapped={false} />
							</mesh>
							<mesh position={[0, 0, -0.01]}>
								<planeGeometry args={[viewport.height * aspectRatio, viewport.height]} />
								<meshBasicMaterial map={textures[index]} toneMapped={false} />
							</mesh>
						</group>
					</group>
				);
			})}
		</>
	);
};
