import { useReducer, useEffect, useMemo, useCallback, useRef } from "react";
import { Texture } from "three";
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
		isFading: false,
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
				isFading: true,
			};
			return updated;
		}
		case "INCREMENT_OPACITY": {
			return state.map((s) => {
				if (!s.isFading || !s.next) return s;
				const newOpacity = Math.min(s.opacity + 0.05, 1);
				if (newOpacity >= 1) {
					return {
						current: s.next,
						next: null,
						opacity: 0,
						index: (s.index + 1) % slideArray[0].imagePaths.length,
						isFading: false,
					};
				}
				return { ...s, opacity: newOpacity };
			});
		}
		default:
			return state;
	}
}

export const Slides = ({ totalRadius, slideWidth, slideHeight }) => {
	const { freemode, focusIndex, hoverIndex, isSliding, setFocusIndex, setSlide, setHoverIndex, slide, isIntroPlaying } = useGallerySlide();

	const allImagePaths = useMemo(() => slideArray.flatMap((s) => s.imagePaths), []);
	const texturesArray = useTexture(allImagePaths) as Texture[];

	const slideTextures = useMemo(() => {
		let index = 0;
		return slideArray.map((slide) => slide.imagePaths.map(() => texturesArray[index++]));
	}, [texturesArray]);

	const [slideStates, dispatch] = useReducer(slideReducer, slideTextures, initialState);

	const slideStatesRef = useRef(slideStates);
	useEffect(() => {
		slideStatesRef.current = slideStates;
	}, [slideStates]);

	const lastActiveSlideIndexRef = useRef<number | null>(null);

	const calculatedTargetIndex = useMemo(() => {
		return !freemode ? slide : hoverIndex ?? focusIndex ?? null;
	}, [freemode, slide, hoverIndex, focusIndex]);

	useEffect(() => {
		if (calculatedTargetIndex !== null) {
			lastActiveSlideIndexRef.current = calculatedTargetIndex;
		}
	}, [calculatedTargetIndex]);

	const activeSlideIndex = calculatedTargetIndex ?? lastActiveSlideIndexRef.current;

	useEffect(() => {
		const interval = setInterval(() => {
			if (isIntroPlaying || activeSlideIndex === null) return;

			const textures = slideTextures[activeSlideIndex];
			const currentIndex = slideStatesRef.current[activeSlideIndex].index;
			const nextIndex = (currentIndex + 1) % textures.length;

			dispatch({
				type: "SET_NEXT",
				index: activeSlideIndex,
				nextTexture: textures[nextIndex],
			});
		}, SLIDE_CHANGE_INTERVAL);

		return () => clearInterval(interval);
	}, [activeSlideIndex, slideTextures, isIntroPlaying]);

	useFrame(() => {
		dispatch({ type: "INCREMENT_OPACITY" });
	});

	const handleClick = useCallback(
		(index: number) => {
			if (freemode && !isSliding) {
				if (focusIndex !== index) {
					setFocusIndex(index);
					setSlide(index);
				} else {
					setFocusIndex(null);
					requestAnimationFrame(() => setFocusIndex(index));
				}
			}
		},
		[freemode, isSliding, focusIndex, setFocusIndex, setSlide]
	);

	const handleHover = useCallback(
		(index: number) => {
			if (freemode && focusIndex === null && hoverIndex !== index) {
				setHoverIndex(index);
			}
		},
		[freemode, focusIndex, hoverIndex, setHoverIndex]
	);

	return (
		<>
			{slideArray.map((slide, index) => {
				const { x, z, angleInRadians } = getSlidePosition(index, totalRadius);
				const rotationY = angleInRadians + Math.PI;
				const state = slideStates[index];

				return (
					<group
						key={index}
						position={[x, 0, z]}
						rotation={[0, rotationY, 0]}
						onClick={() => handleClick(index)}
						onPointerOver={() => handleHover(index)}
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
