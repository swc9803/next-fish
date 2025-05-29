import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Texture, Mesh } from "three";

import { useGallerySlide } from "@/store/useGallerySlide";
import { useActiveSlideIndex } from "@/hooks/useActiveSlideIndex";
import { slideArray, getSlidePosition } from "@/utils/slideUtils";

import vertex from "@/shaders/slideVertex.glsl";
import fragment from "@/shaders/slideFragment.glsl";

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
	isFading: boolean;
}

const SLIDE_CHANGE_INTERVAL = 3000;

export const Slides = ({ totalRadius, slideWidth, slideHeight }: SlidesProps) => {
	const { freemode, focusIndex, hoverIndex, isSliding, setFocusIndex, setHoverIndex, isIntroPlaying } = useGallerySlide();
	const activeSlideIndex = useActiveSlideIndex();
	const { scene } = useThree();

	const allImagePaths = useMemo(() => slideArray.flatMap((s) => s.imagePaths), []);

	const texturesArray = useTexture(allImagePaths) as Texture[];
	const displacementMap = useTexture("/textures/displacement.png");

	const slideTextures = useMemo(() => {
		let index = 0;
		return slideArray.map((slide) => slide.imagePaths.map(() => texturesArray[index++]));
	}, [texturesArray]);

	const initialStates: SlideState[] = slideTextures.map((textures) => ({
		current: textures[0],
		next: null,
		opacity: 0,
		index: 0,
		isFading: false,
	}));

	const [slideStates, setSlideStates] = useState<SlideState[]>(initialStates);
	const slideStatesRef = useRef(slideStates);
	const uniformsRef = useRef<{ [index: number]: any }>({});

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

	useEffect(() => {
		if (isIntroPlaying) return;

		const interval = setInterval(() => {
			setSlideStates((prev) => {
				const index = activeSlideIndex;
				const current = prev[index];
				const nextIndex = (current.index + 1) % slideTextures[index].length;
				const nextTexture = slideTextures[index][nextIndex];

				return prev.map((s, i) => (i === index ? { ...s, next: nextTexture, opacity: 0, isFading: true } : s));
			});
		}, SLIDE_CHANGE_INTERVAL);

		return () => clearInterval(interval);
	}, [activeSlideIndex, slideTextures, isIntroPlaying]);

	useFrame(() => {
		setSlideStates((prev) =>
			prev.map((s) => {
				if (!s.isFading || !s.next) return s;
				const newOpacity = Math.min(s.opacity + 0.03, 1);
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
			})
		);

		slideStatesRef.current.forEach((state, index) => {
			const uniforms = uniformsRef.current[index];
			if (!uniforms) return;

			const nextTex = state.next || state.current;
			if (
				uniforms.texture1.value !== state.current ||
				uniforms.texture2.value !== nextTex ||
				uniforms.progress.value !== (state.isFading ? state.opacity : 0) ||
				uniforms.slideIndex.value !== state.index
			) {
				uniforms.texture1.value = state.current;
				uniforms.texture2.value = nextTex;
				uniforms.progress.value = state.isFading ? state.opacity : 0;
				uniforms.slideIndex.value = state.index;
			}
		});
	});

	const getUniforms = (index: number, state: SlideState) => {
		if (!uniformsRef.current[index]) {
			uniformsRef.current[index] = {
				texture1: { value: state.current },
				texture2: { value: state.next || state.current },
				dispMap: { value: displacementMap },
				progress: { value: state.isFading ? state.opacity : 0 },
				slideIndex: { value: state.index },
			};
		}
		return uniformsRef.current[index];
	};

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
								<shaderMaterial key={index} vertexShader={vertex} fragmentShader={fragment} uniforms={getUniforms(index, state)} transparent />
							</mesh>
						</group>
					</group>
				);
			})}
		</>
	);
};
