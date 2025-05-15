import { useRef, useReducer, useEffect, useMemo } from "react";
import { Group, Texture } from "three";
import { useTexture } from "@react-three/drei";
import { useGallerySlide } from "@/store/useGallerySlide";
import { slideArray, getSlidePosition } from "@/utils/slideUtils";
import { useFrame } from "@react-three/fiber";

const SLIDE_CHANGE_INTERVAL = 3000;

const initialState = (slideTextures: Texture[][]) =>
	slideTextures.map((textures) => ({
		current: textures[0],
		next: null,
		opacity: 0,
		index: 0,
	}));

function slideReducer(state, action) {
	switch (action.type) {
		case "SET_NEXT": {
			const { index, nextTexture } = action;
			const updated = [...state];
			updated[index] = {
				...updated[index],
				next: nextTexture,
				opacity: 0,
			};
			return updated;
		}
		case "INCREMENT_OPACITY": {
			return state.map((s) => {
				if (!s.next) return s;
				const opacity = Math.min(s.opacity + 0.05, 1);
				if (opacity >= 1) {
					return {
						current: s.next,
						next: null,
						opacity: 0,
						index: (s.index + 1) % slideArray[0].imagePaths.length,
					};
				}
				return { ...s, opacity };
			});
		}
		default:
			return state;
	}
}

export const Slides = ({ totalRadius, slideWidth, slideHeight }) => {
	const { freemode, focusIndex, hoverIndex, isSliding, setFocusIndex, setSlide, setHoverIndex, slide, isIntroPlaying } = useGallerySlide();
	const groupRefs = useRef<(Group | null)[]>([]);

	const allImagePaths = useMemo(() => slideArray.flatMap((s) => s.imagePaths), []);
	const texturesArray = useTexture(allImagePaths) as Texture[];

	const slideTextures = useMemo(() => {
		let index = 0;
		return slideArray.map((slide) => {
			const textures = slide.imagePaths.map(() => texturesArray[index++]);
			return textures;
		});
	}, [texturesArray]);

	const [slideStates, dispatch] = useReducer(slideReducer, slideTextures, initialState);

	const activeSlideIndex = useMemo(() => (!freemode ? slide : hoverIndex ?? null), [freemode, slide, hoverIndex]);

	useEffect(() => {
		const interval = setInterval(() => {
			if (isIntroPlaying || activeSlideIndex === null) return;
			const textures = slideTextures[activeSlideIndex];
			const nextIndex = (slideStates[activeSlideIndex].index + 1) % textures.length;
			dispatch({ type: "SET_NEXT", index: activeSlideIndex, nextTexture: textures[nextIndex] });
		}, SLIDE_CHANGE_INTERVAL);
		return () => clearInterval(interval);
	}, [activeSlideIndex, slideTextures, isIntroPlaying, slideStates]);

	useFrame(() => {
		if (activeSlideIndex !== null) {
			dispatch({ type: "INCREMENT_OPACITY" });
		}
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
