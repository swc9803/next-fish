import { useRef, useState, useEffect } from "react";
import { Group, Texture } from "three";
import { useTexture } from "@react-three/drei";
import { useGallerySlide } from "@/store/useGallerySlide";
import { slideArray, getSlidePosition } from "@/utils/slideUtils";

interface SlidesProps {
	totalRadius: number;
	slideWidth: number;
	slideHeight: number;
}

export const Slides = ({ totalRadius, slideWidth, slideHeight }: SlidesProps) => {
	const { freemode, focusIndex, hoverIndex, isSliding, setFocusIndex, setSlide, setHoverIndex, slide, isIntroPlaying } = useGallerySlide();

	const texturesArray = slideArray.map((slide) => useTexture(slide.imagePaths));
	const groupRefs = useRef<(Group | null)[]>([]);

	const [imageIndices, setImageIndices] = useState<number[]>(() => slideArray.map(() => 0));

	const [currentTextures, setCurrentTextures] = useState(() => slideArray.map((_, i) => texturesArray[i][0]));
	const [nextTextures, setNextTextures] = useState<(Texture | null)[]>(() => slideArray.map(() => null));
	const [opacities, setOpacities] = useState<number[]>(() => slideArray.map(() => 0));

	// 현재 활성 슬라이드 추적
	const [activeSlideIndex, setActiveSlideIndex] = useState<number | null>(null);

	useEffect(() => {
		if (!freemode) {
			setActiveSlideIndex(slide);
		} else if (hoverIndex !== null) {
			setActiveSlideIndex(hoverIndex);
		}
	}, [freemode, slide, hoverIndex]);

	useEffect(() => {
		const interval = setInterval(() => {
			if (isIntroPlaying || activeSlideIndex === null) return;

			const i = activeSlideIndex;
			const nextIndex = (imageIndices[i] + 1) % slideArray[i].imagePaths.length;
			const nextTexture = texturesArray[i][nextIndex];

			setNextTextures((prev) => {
				const updated = [...prev];
				updated[i] = nextTexture;
				return updated;
			});

			setOpacities((prev) => {
				const updated = [...prev];
				updated[i] = 0;
				return updated;
			});

			let frame = 0;
			const fadeFrames = 30;

			const fade = () => {
				frame++;
				const alpha = frame / fadeFrames;

				setOpacities((prev) => {
					const updated = [...prev];
					updated[i] = alpha;
					return updated;
				});

				if (frame < fadeFrames) {
					requestAnimationFrame(fade);
				} else {
					setCurrentTextures((prev) => {
						const updated = [...prev];
						updated[i] = nextTexture;
						return updated;
					});
					setNextTextures((prev) => {
						const updated = [...prev];
						updated[i] = null;
						return updated;
					});
					setImageIndices((prev) => {
						const updated = [...prev];
						updated[i] = nextIndex;
						return updated;
					});
				}
			};

			fade();
		}, 3000);

		return () => clearInterval(interval);
	}, [activeSlideIndex, imageIndices, texturesArray, isIntroPlaying]);

	return (
		<>
			{slideArray.map((slide, index) => {
				const { x, z, angleInRadians } = getSlidePosition(index, totalRadius);
				const rotationY = angleInRadians + Math.PI;
				const borderColor = slide.borderColor;

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
								<planeGeometry args={[slideWidth + 0.05, slideHeight + 0.05]} />
								<meshLambertMaterial color={borderColor} />
							</mesh>
							<mesh position={[0, 0, 0]}>
								<planeGeometry args={[slideWidth, slideHeight]} />
								<meshBasicMaterial map={currentTextures[index]} toneMapped={false} transparent />
							</mesh>
							{nextTextures[index] && (
								<mesh position={[0, 0, 0]}>
									<planeGeometry args={[slideWidth, slideHeight]} />
									<meshBasicMaterial map={nextTextures[index]!} toneMapped={false} transparent opacity={opacities[index]} />
								</mesh>
							)}
						</group>
					</group>
				);
			})}
		</>
	);
};
