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

	const [visible, setVisible] = useState(false);
	const prevVisible = useRef<boolean | null>(null);

	// 모바일 말풍선 위치 조정
	const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

	useEffect(() => {
		const onResize = () => {
			setIsMobile(window.innerWidth <= 768);
		};
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	// 말풍선 위치 계산
	const adjustedBubblePosition: [number, number, number] = useMemo(() => {
		const [x, y, z] = bubblePosition || modelPosition;
		return isMobile ? [x, y - 0.5, z - 0.5] : [x, y, z];
	}, [isMobile, bubblePosition, modelPosition]);

	const bubbleVec = useRef(new Vector3(...(bubblePosition || modelPosition)));

	const typedText = useTyping(text, visible, speed);

	// 그림자
	useEffect(() => {
		scene.traverse((child) => {
			if ((child as Mesh).isMesh) {
				child.castShadow = true;
			}
		});
	}, [scene]);

	useEffect(() => {
		if (!objRef.current || animations.length === 0) return;

		const targetObject = objRef.current;
		const mixer = new AnimationMixer(targetObject);
		mixerRef.current = mixer;

		const clip = animations.find((clip) => clip.name.toLowerCase().includes("swim"));
		if (clip && clip.duration > 0) {
			const action = mixer.clipAction(clip);
			action.setLoop(LoopRepeat, Infinity);
			action.clampWhenFinished = true;
			actionRef.current = action;
		}

		return () => {
			mixer.stopAllAction();
			mixer.uncacheRoot(targetObject);
		};
	}, [animations]);

	useEffect(() => {
		const action = actionRef.current;
		if (!action) return;

		if (visible) {
			action.reset().fadeIn(0.4).play();
		} else {
			action.fadeOut(0.5);
		}
	}, [visible]);

	// 거리 계산
	useFrame((_, delta) => {
		const fish = fishRef.current;
		if (!fish) return;

		const dist = fish.position.distanceTo(bubbleVec.current);
		const nextVisible = dist < distanceThreshold;

		if (prevVisible.current !== nextVisible) {
			setVisible(nextVisible);
			prevVisible.current = nextVisible;
		}

		mixerRef.current?.update(delta);
	});

	return (
		<>
			<primitive object={scene} position={modelPosition} scale={scale} ref={objRef} />
			{visible && (
				<Html position={adjustedBubblePosition} distanceFactor={10} wrapperClass="prevent_click">
					<div className="speech_bubble">{typedText}</div>
				</Html>
			)}
		</>
	);
};
