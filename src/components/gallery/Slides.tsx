import { useRef, useState, useEffect, useMemo } from "react";
import { Group, Texture } from "three";
import { useTexture } from "@react-three/drei";
import { useGallerySlide } from "@/store/useGallerySlide";
import { slideArray, getSlidePosition } from "@/utils/slideUtils";
import { useFrame } from "@react-three/fiber";

interface SlidesProps {
	totalRadius: number;
	slideWidth: number;
	slideHeight: number;
}

interface SlideState {
	current: Texture;
	next: Texture | null;
	opacity: number;
	index: number;
}

export const Slides = ({ totalRadius, slideWidth, slideHeight }: SlidesProps) => {
	const { freemode, focusIndex, hoverIndex, isSliding, setFocusIndex, setSlide, setHoverIndex, slide, isIntroPlaying } = useGallerySlide();

	const groupRefs = useRef<(Group | null)[]>([]);

	// 이미지 경로
	const allImagePaths = useMemo(() => slideArray.flatMap((s) => s.imagePaths), []);
	const texturesArray = useTexture(allImagePaths) as Texture[];

	const slideTextures = useMemo(() => {
		let index = 0;
		return slideArray.map((slide) => {
			const textures = slide.imagePaths.map(() => texturesArray[index++]);
			return textures;
		});
	}, [texturesArray]);

	// 슬라이드 상태
	const [slideStates, setSlideStates] = useState<SlideState[]>(() =>
		slideTextures.map((textures) => ({
			current: textures[0],
			next: null,
			opacity: 0,
			index: 0,
		}))
	);

	const activeSlideIndex = useMemo(() => {
		if (!freemode) return slide;
		return hoverIndex !== null ? hoverIndex : null;
	}, [freemode, slide, hoverIndex]);

	// 이미지 전환 주기
	useEffect(() => {
		const interval = setInterval(() => {
			if (isIntroPlaying || activeSlideIndex === null) return;

			setSlideStates((prev) => {
				const updated = [...prev];
				const i = activeSlideIndex;
				const textures = slideTextures[i];
				const nextIdx = (updated[i].index + 1) % textures.length;
				updated[i] = {
					...updated[i],
					next: textures[nextIdx],
					opacity: 0,
					index: updated[i].index,
				};
				return updated;
			});
		}, 3000);

		return () => clearInterval(interval);
	}, [activeSlideIndex, isIntroPlaying, slideTextures]);

	// 이미지 전환
	useFrame(() => {
		if (activeSlideIndex === null) return;

		setSlideStates((prev) => {
			return prev.map((state, i) => {
				if (!state.next) return state;

				const newOpacity = Math.min(state.opacity + 0.05, 1);
				if (newOpacity >= 1) {
					return {
						current: state.next,
						next: null,
						opacity: 0,
						index: (state.index + 1) % slideTextures[i].length,
					};
				}
				return { ...state, opacity: newOpacity };
			});
		});
	});

	return (
		<>
			{slideArray.map((slide, index) => {
				const { x, z, angleInRadians } = getSlidePosition(index, totalRadius);
				const rotationY = angleInRadians + Math.PI;
				const state = slideStates[index];

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
								<meshLambertMaterial color={slide.borderColor} />
							</mesh>
							<mesh position={[0, 0, 0]}>
								<planeGeometry args={[slideWidth, slideHeight]} />
								<meshBasicMaterial map={state.current} toneMapped={false} transparent />
							</mesh>
							{state.next && (
								<mesh position={[0, 0, 0]}>
									<planeGeometry args={[slideWidth, slideHeight]} />
									<meshBasicMaterial map={state.next} toneMapped={false} transparent opacity={state.opacity} />
								</mesh>
							)}
						</group>
					</group>
				);
			})}
		</>
	);
};
