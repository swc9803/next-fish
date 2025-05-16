import { useReducer, useEffect, useMemo, useCallback, useRef } from "react";
import { Texture, Mesh } from "three";
import { useTexture } from "@react-three/drei";
import { useGallerySlide } from "@/store/useGallerySlide";
import { slideArray, getSlidePosition } from "@/utils/slideUtils";
import { useFrame, useThree } from "@react-three/fiber";

interface SlideState {
	current: Texture;
	next: Texture | null;
	opacity: number;
	index: number;
	isFading: boolean;
}
type SlideAction = { type: "SET_NEXT"; index: number; nextTexture: Texture } | { type: "INCREMENT_OPACITY" };

const SLIDE_CHANGE_INTERVAL = 3000;

const initialState = (slideTextures: Texture[][]) =>
	slideTextures.map((textures) => ({
		current: textures[0],
		next: null,
		opacity: 0,
		index: 0,
		isFading: false,
	}));

function slideReducer(state: SlideState[], action: SlideAction): SlideState[] {
	switch (action.type) {
		case "SET_NEXT": {
			const { index, nextTexture } = action;
			return state.map((s: SlideState, i: number) => (i === index ? { ...s, next: nextTexture, opacity: 0, isFading: true } : s));
		}
		case "INCREMENT_OPACITY": {
			return state.map((s: SlideState, i: number) => {
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

	const { scene } = useThree();

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

	useEffect(() => {
		return () => {
			slideTextures.flat().forEach((texture) => texture.dispose());
			scene.traverse((child) => {
				if (child instanceof Mesh) {
					child.geometry?.dispose();
					if (Array.isArray(child.material)) {
						child.material.forEach((m) => m.dispose());
					} else {
						child.material?.dispose();
					}
				}
			});
		};
	}, [slideTextures, scene]);

	const calculatedTargetIndex = useMemo(() => {
		if (!freemode) return slide;
		if (focusIndex !== null) return focusIndex;
		if (hoverIndex !== null) return hoverIndex;
		return null;
	}, [freemode, slide, hoverIndex, focusIndex]);

	const lastActiveSlideIndexRef = useRef<number | null>(null);

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

	useFrame(() => dispatch({ type: "INCREMENT_OPACITY" }));

	const handleClick = useCallback(
		(index: number) => {
			if (freemode && !isSliding) {
				if (focusIndex !== index) {
					setFocusIndex(index);
				} else {
					setFocusIndex(null);
					requestAnimationFrame(() => setFocusIndex(index));
				}
			}
		},
		[freemode, isSliding, focusIndex, setFocusIndex]
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
