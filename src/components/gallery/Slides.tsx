import { useEffect, useMemo, useCallback, useRef, useState, memo } from "react";
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

const SlideMesh = memo(({ index, state, position, rotation, slideWidth, slideHeight, borderColor, getUniforms, handleClick, handleHover }: any) => (
	<group position={position} rotation={rotation} onClick={() => handleClick(index)} onPointerOver={() => handleHover(index)}>
		<group>
			<mesh position={[0, 0, -0.03]}>
				<planeGeometry args={[slideWidth + 0.05, slideHeight + 0.05]} />
				<meshLambertMaterial color={borderColor} />
			</mesh>
			<mesh position={[0, 0, 0]}>
				<planeGeometry args={[slideWidth, slideHeight]} />
				<shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={getUniforms(index, state)} transparent />
			</mesh>
		</group>
	</group>
));

export const Slides = ({ totalRadius, slideWidth, slideHeight }: SlidesProps) => {
	const freemode = useGallerySlide((s) => s.freemode);
	const focusIndex = useGallerySlide((s) => s.focusIndex);
	const hoverIndex = useGallerySlide((s) => s.hoverIndex);
	const isSliding = useGallerySlide((s) => s.isSliding);
	const isIntroPlaying = useGallerySlide((s) => s.isIntroPlaying);
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

	useFrame((_, delta) => {
		const speed = 1.5;
		let updated = false;

		const updatedStates = slideStatesRef.current.map((s) => {
			if (!s.isFading || !s.next) return s;

			const newOpacity = Math.min(s.opacity + delta * speed, 1);
			if (newOpacity >= 1) {
				updated = true;
				return {
					current: s.next,
					next: null,
					opacity: 0,
					index: (s.index + 1) % slideArray[0].imagePaths.length,
					isFading: false,
				};
			}
			updated = true;
			return { ...s, opacity: newOpacity };
		});

		if (updated) {
			const prev = slideStatesRef.current;
			let isDifferent = false;

			for (let i = 0; i < prev.length; i++) {
				if (
					prev[i].current !== updatedStates[i].current ||
					prev[i].next !== updatedStates[i].next ||
					prev[i].opacity !== updatedStates[i].opacity ||
					prev[i].index !== updatedStates[i].index ||
					prev[i].isFading !== updatedStates[i].isFading
				) {
					isDifferent = true;
					break;
				}
			}

			if (isDifferent) {
				setSlideStates(updatedStates);
			}
		}

		updatedStates.forEach((state, index) => {
			const uniforms = uniformsRef.current[index];
			if (!uniforms) return;

			uniforms.texture1.value = state.current;
			uniforms.texture2.value = state.next || state.current;
			uniforms.progress.value = state.isFading ? state.opacity : 0;
			uniforms.slideIndex.value = state.index;
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
					useGallerySlide.getState().setFocusIndex(index);
				} else {
					useGallerySlide.getState().setFocusIndex(null);
					requestAnimationFrame(() => useGallerySlide.getState().setFocusIndex(index));
				}
			}
		},
		[freemode, isSliding, focusIndex]
	);

	const handleHover = useCallback(
		(index: number) => {
			if (freemode && focusIndex === null && hoverIndex !== index) {
				useGallerySlide.getState().setHoverIndex(index);
			}
		},
		[freemode, focusIndex, hoverIndex]
	);

	return (
		<>
			{slideArray.map((slide, index) => {
				const { x, z, angleInRadians } = getSlidePosition(index, totalRadius);
				const rotationY = angleInRadians + Math.PI;
				const state = slideStates[index];

				return (
					<SlideMesh
						key={index}
						index={index}
						state={state}
						position={[x, 0, z]}
						rotation={[0, rotationY, 0]}
						slideWidth={slideWidth}
						slideHeight={slideHeight}
						borderColor={slide.borderColor}
						getUniforms={getUniforms}
						handleClick={handleClick}
						handleHover={handleHover}
					/>
				);
			})}
		</>
	);
};

SlideMesh.displayName = "SlideMesh";
