import { useEffect, useRef, useState, useCallback } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { MeshStandardMaterial, Mesh, Object3D, Vector3, AnimationMixer, AnimationAction, LoopRepeat } from "three";
import gsap from "gsap";

import { useFishStore } from "@/store/useFishStore";

interface FishModelProps {
	fishRef: React.RefObject<Object3D>;
	setIsInBombZone: React.Dispatch<React.SetStateAction<boolean>>;
	setCountdown: React.Dispatch<React.SetStateAction<number | null>>;
}

const GRID_CENTER = new Vector3(-50, 0, 0);
const GRID_SIZE_X = 42;
const GRID_SIZE_Z = 42;
const GRID_HALF_SIZE_X = GRID_SIZE_X / 2;
const GRID_HALF_SIZE_Z = GRID_SIZE_Z / 2;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const FishModel = ({ fishRef, setIsInBombZone, setCountdown }: FishModelProps) => {
	const { scene, animations } = useGLTF("/models/fish.glb");
	const { camera } = useThree();
	const { fishColor, fishScale } = useFishStore();

	const [isMobile, setIsMobile] = useState(false);
	const [showHitBox, setShowHitBox] = useState(false);

	const hitBoxRef = useRef<Mesh>(null);
	const meshMaterials = useRef<MeshStandardMaterial[]>([]);
	const lastInBombZone = useRef<boolean | null>(null);
	const hasMovedToCenter = useRef(false);

	const mixerRef = useRef<AnimationMixer | null>(null);
	const swimActionRef = useRef<AnimationAction | null>(null);
	const prevPositionRef = useRef<Vector3 | null>(null);
	const lerpTimeScale = useRef<number>(0.01);
	const decayedSpeed = useRef<number>(0);

	const offsetVec = useRef(new Vector3());
	const tempTarget = useRef(new Vector3());
	const currentPosition = useRef(new Vector3());

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth <= 480);
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		const materials: MeshStandardMaterial[] = [];
		scene.traverse((child) => {
			if (child instanceof Mesh && child.name === "Mesh") {
				const mats = Array.isArray(child.material) ? child.material : [child.material];
				mats.forEach((mat) => {
					if (mat instanceof MeshStandardMaterial) materials.push(mat);
				});
			}
		});
		meshMaterials.current = materials;
	}, [scene]);

	useEffect(() => {
		meshMaterials.current.forEach((mat) => mat.color.set(fishColor));
	}, [fishColor]);

	const toggleDebug = useCallback((e: KeyboardEvent) => {
		if (e.key.toLowerCase() === "d") {
			setShowHitBox((prev) => !prev);
		}
	}, []);
	useEffect(() => {
		window.addEventListener("keydown", toggleDebug);
		return () => window.removeEventListener("keydown", toggleDebug);
	}, [toggleDebug]);

	// 애니메이션 초기화
	useEffect(() => {
		if (!fishRef.current) return;
		const mixer = new AnimationMixer(fishRef.current);
		mixerRef.current = mixer;

		const swimClip = animations.find((clip) => clip.name.toLowerCase().includes("swim"));
		if (swimClip) {
			const action = mixer.clipAction(swimClip);
			action.setLoop(LoopRepeat, Infinity);
			action.play();
			swimActionRef.current = action;
		}
	}, [animations, fishRef]);

	// 위치 기반 처리
	useFrame((_, delta) => {
		if (!fishRef.current) return;
		const fish = fishRef.current;
		const pos = fish.position;

		fish.scale.set(fishScale, fishScale, fishScale);

		// 히트박스 위치 갱신
		if (hitBoxRef.current) {
			hitBoxRef.current.position.copy(pos);
			offsetVec.current.set(0, 0, -fishScale * 0.5).applyEuler(fish.rotation);
			hitBoxRef.current.position.add(offsetVec.current);
			hitBoxRef.current.rotation.copy(fish.rotation);
			hitBoxRef.current.scale.set(1, 1, 1);
		}

		const inBombZone = Math.abs(pos.x - GRID_CENTER.x) < GRID_HALF_SIZE_X && Math.abs(pos.z - GRID_CENTER.z) < GRID_HALF_SIZE_Z;

		// 카메라 위치
		if (inBombZone) {
			camera.position.set(GRID_CENTER.x, isMobile ? 40 : 30, GRID_CENTER.z);
			camera.lookAt(GRID_CENTER);
		} else {
			camera.position.set(pos.x, 20, pos.z + 14);
			camera.lookAt(pos);
		}

		if (lastInBombZone.current !== inBombZone) {
			lastInBombZone.current = inBombZone;
			setIsInBombZone(inBombZone);

			if (inBombZone && !hasMovedToCenter.current) {
				hasMovedToCenter.current = true;

				gsap.killTweensOf(pos);
				tempTarget.current.set(GRID_CENTER.x, pos.y, GRID_CENTER.z);
				fish.lookAt(tempTarget.current);

				const speed = useFishStore.getState().fishSpeed;
				const distance = pos.distanceTo(tempTarget.current);
				const duration = distance / speed;

				gsap.to(pos, {
					x: tempTarget.current.x,
					z: tempTarget.current.z,
					duration,
					ease: "power2.out",
				});

				setCountdown(3);
			}

			if (!inBombZone) {
				hasMovedToCenter.current = false;
			}
		}

		mixerRef.current?.update(delta);

		// 이동 속도에 비례한 애니메이션 속도 조절
		if (swimActionRef.current) {
			const prev = prevPositionRef.current;
			currentPosition.current.copy(pos);

			if (prev) {
				const distance = currentPosition.current.distanceTo(prev);
				const instantSpeed = distance / delta;

				// 감속
				decayedSpeed.current = lerp(decayedSpeed.current, instantSpeed, 0.15);

				const targetTimeScale = Math.min(Math.max(decayedSpeed.current * 0.3, 0.01), 1.5);
				lerpTimeScale.current = lerp(lerpTimeScale.current, targetTimeScale, 0.1);
				swimActionRef.current.timeScale = lerpTimeScale.current;
			}

			prevPositionRef.current = currentPosition.current.clone();
		}
	});

	return (
		<>
			<primitive ref={fishRef} object={scene} position={[0, 1, 0]} castShadow />
			{showHitBox && (
				<mesh ref={hitBoxRef}>
					<boxGeometry args={[fishScale * 1.5, 1, fishScale * 5]} />
					<meshBasicMaterial color="red" wireframe transparent opacity={0.5} />
				</mesh>
			)}
		</>
	);
};
