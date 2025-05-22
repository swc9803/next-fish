import { useGLTF, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { AnimationAction, AnimationMixer, LoopRepeat, Object3D, Vector3 } from "three";
import { useEffect, useRef, useState } from "react";
import { useTyping } from "@/hooks/useTyping";

interface TalkativeModelProps {
	modelPath: string;
	modelPosition: [number, number, number];
	bubblePosition?: [number, number, number];
	text: string;
	fishRef: React.RefObject<Object3D>;
	scale?: number;
	distanceThreshold?: number;
}

export const TalkativeModel = ({
	modelPath,
	modelPosition,
	bubblePosition,
	text,
	fishRef,
	scale = 1,
	distanceThreshold = 12,
}: TalkativeModelProps) => {
	const { scene, animations } = useGLTF(modelPath);
	const objRef = useRef<Object3D>(null);
	const mixerRef = useRef<AnimationMixer | null>(null);
	const actionRef = useRef<AnimationAction | null>(null);

	const [visible, setVisible] = useState(false);
	const typedText = useTyping(text, visible);
	const bubbleVec = useRef(new Vector3(...(bubblePosition || modelPosition)));

	// 애니메이션 초기화
	useEffect(() => {
		if (!objRef.current || animations.length === 0) return;

		const mixer = new AnimationMixer(objRef.current);
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
			if (objRef.current) {
				mixer.uncacheRoot(objRef.current);
			}
		};
	}, [animations]);

	// 애니메이션 scrub
	useEffect(() => {
		const action = actionRef.current;
		if (!action) return;

		if (visible) {
			action.reset().fadeIn(0.4).play();
		} else {
			action.fadeOut(0.5);
		}
	}, [visible]);

	// 접근 거리 계산
	useFrame((_, delta) => {
		const fish = fishRef.current;
		if (!fish) return;

		const dist = fish.position.distanceTo(bubbleVec.current);
		setVisible(dist < distanceThreshold);

		mixerRef.current?.update(delta);
	});

	return (
		<>
			<primitive object={scene} position={modelPosition} scale={scale} ref={objRef} />
			{visible && (
				<Html position={bubblePosition || modelPosition} distanceFactor={10} wrapperClass="prevent-click">
					<div className="speech_bubble">{typedText}</div>
				</Html>
			)}
		</>
	);
};
