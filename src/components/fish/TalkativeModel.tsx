import { useGLTF, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { AnimationAction, AnimationClip, AnimationMixer, LoopRepeat, Object3D, Vector3 } from "three";
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

	// 애니메이션 이름 매핑
	const getAnimationKeyword = (path: string): string | null => {
		if (path.includes("fish_game")) return "Swim";
		if (path.includes("fish_logo")) return "Swimming_Normal";
		return null;
	};

	// 이름 포함 검색으로 clip 찾기
	const getAnimationClip = (animations: AnimationClip[], keyword: string) => {
		return animations.find((clip) => clip.name.toLowerCase().includes(keyword.toLowerCase()));
	};

	// 애니메이션 초기화
	useEffect(() => {
		if (!objRef.current || animations.length === 0) return;

		const mixer = new AnimationMixer(objRef.current);
		mixerRef.current = mixer;

		const keyword = getAnimationKeyword(modelPath);
		if (!keyword) return;

		const clip = getAnimationClip(animations, keyword);
		if (clip && clip.duration > 0) {
			const action = mixer.clipAction(clip);
			action.setLoop(LoopRepeat, Infinity);
			action.clampWhenFinished = true;
			actionRef.current = action;
		}

		return () => {
			mixer.stopAllAction();
			mixer.uncacheRoot(objRef.current as Object3D);
		};
	}, [animations, modelPath]);

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

	// 거리 계산
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
				<Html position={bubblePosition || modelPosition} distanceFactor={10}>
					<div className="speech_bubble">{typedText}</div>
				</Html>
			)}
		</>
	);
};
