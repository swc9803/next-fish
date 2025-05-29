import { RefObject, useEffect, useRef, useState, useMemo } from "react";
import { useGLTF, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { AnimationAction, AnimationMixer, LoopRepeat, Mesh, Object3D, Vector3 } from "three";

import { useTyping } from "@/hooks/useTyping";

interface TalkativeModelProps {
	fishRef: RefObject<Object3D | null>;
	modelPath: string;
	modelPosition: [number, number, number];
	bubblePosition?: [number, number, number];
	text: string;
	scale?: number;
	speed: number;
	distanceThreshold?: number;
}

export const TalkativeModel = ({
	modelPath,
	modelPosition,
	bubblePosition,
	text,
	speed,
	fishRef,
	scale = 1,
	distanceThreshold = 12,
}: TalkativeModelProps) => {
	const { scene, animations } = useGLTF(modelPath);
	const objRef = useRef<Object3D>(null);
	const mixerRef = useRef<AnimationMixer | null>(null);
	const actionRef = useRef<AnimationAction | null>(null);

	const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

	// 말풍선 위치 계산
	const adjustedBubblePosition: [number, number, number] = useMemo(() => {
		const [x, y, z] = bubblePosition || modelPosition;
		return isMobile ? [x, y - 0.5, z - 0.5] : [x, y, z];
	}, [isMobile, bubblePosition, modelPosition]);

	const bubbleVec = useRef(new Vector3(...(bubblePosition || modelPosition)));
	const bubbleElemRef = useRef<HTMLDivElement>(null);
	const isVisibleRef = useRef(false);
	const [isVisible, setIsVisible] = useState(false);

	const typedText = useTyping(text, isVisible, speed); // visible 상태로 typing 제어

	// 그림자
	useEffect(() => {
		scene.traverse((child) => {
			if ((child as Mesh).isMesh) {
				child.castShadow = true;
			}
		});
	}, [scene]);

	useEffect(() => {
		const object = objRef.current;

		if (!object || animations.length === 0) return;

		const mixer = new AnimationMixer(object);
		mixerRef.current = mixer;

		const clip = animations.find((clip) => clip.name.toLowerCase().includes("swim"));
		if (clip && clip.duration > 0) {
			const action = mixer.clipAction(clip);
			action.setLoop(LoopRepeat, Infinity);
			action.clampWhenFinished = true;
			action.play();
			actionRef.current = action;
		}

		return () => {
			mixer.stopAllAction();
			mixer.uncacheRoot(object);
		};
	}, [animations]);

	// 거리 계산
	useFrame((_, delta) => {
		const fish = fishRef.current;
		const model = objRef.current;
		if (!fish || !model) return;

		const dist = fish.position.distanceTo(bubbleVec.current);
		const shouldBeVisible = dist < distanceThreshold;

		if (bubbleElemRef.current) {
			bubbleElemRef.current.style.display = shouldBeVisible ? "block" : "none";
		}

		if (isVisibleRef.current !== shouldBeVisible) {
			isVisibleRef.current = shouldBeVisible;
			setIsVisible(shouldBeVisible);
		}

		mixerRef.current?.update(delta);
	});

	return (
		<>
			<primitive object={scene} position={modelPosition} scale={scale} ref={objRef} />
			<Html position={adjustedBubblePosition} distanceFactor={10} wrapperClass="prevent_click">
				<div className="speech_bubble" ref={bubbleElemRef}>
					{typedText}
				</div>
			</Html>
		</>
	);
};
