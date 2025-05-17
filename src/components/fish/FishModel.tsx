import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { MeshStandardMaterial, Mesh, Object3D, Vector3, AnimationMixer, AnimationAction, LoopRepeat } from "three";
import gsap from "gsap";

import { useFishStore } from "@/store/useFishStore";

useGLTF.preload("/models/fish.glb");
useGLTF.preload("/models/fish_bone.glb");

interface FishModelProps {
	fishRef: React.RefObject<Object3D>;
	setIsInBombZone: React.Dispatch<React.SetStateAction<boolean>>;
	setCountdown: React.Dispatch<React.SetStateAction<number | null>>;
	isGameOver: boolean;
	deathPosition: [number, number, number] | null;
}

const GRID_CENTER = new Vector3(-50, 0, 0);
const GRID_HALF_SIZE_X = 21;
const GRID_HALF_SIZE_Z = 21;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const FishModel = ({ fishRef, setIsInBombZone, setCountdown, isGameOver, deathPosition }: FishModelProps) => {
	const { scene: fishScene, animations } = useGLTF("/models/fish.glb");
	const { scene: deadScene } = useGLTF("/models/fish_bone.glb");
	const { camera } = useThree();
	const { fishColor, fishScale } = useFishStore();

	const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 480);
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

	const offsetVec = useMemo(() => new Vector3(), []);
	const tempTarget = useMemo(() => new Vector3(), []);
	const currentPosition = useMemo(() => new Vector3(), []);

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth <= 480);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		const materials: MeshStandardMaterial[] = [];
		fishScene.traverse((child) => {
			if (child instanceof Mesh && child.name === "Mesh") {
				const mats = Array.isArray(child.material) ? child.material : [child.material];
				for (const mat of mats) {
					if (mat instanceof MeshStandardMaterial) materials.push(mat);
				}
			}
		});
		meshMaterials.current = materials;
	}, [fishScene]);

	useEffect(() => {
		for (const mat of meshMaterials.current) {
			mat.color.set(fishColor);
		}
	}, [fishColor]);

	useEffect(() => {
		const toggleDebug = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() === "d") {
				setShowHitBox((prev) => !prev);
			}
		};
		window.addEventListener("keydown", toggleDebug);
		return () => window.removeEventListener("keydown", toggleDebug);
	}, []);

	useEffect(() => {
		if (!fishRef.current || isGameOver) return;
		const mixer = new AnimationMixer(fishRef.current);
		mixerRef.current = mixer;

		const swimClip = animations.find((clip) => clip.name.toLowerCase().includes("swim"));
		if (swimClip) {
			const action = mixer.clipAction(swimClip);
			action.setLoop(LoopRepeat, Infinity);
			action.play();
			swimActionRef.current = action;
		}
	}, [animations, fishRef, isGameOver]);

	useFrame((_, delta) => {
		if (!fishRef.current) return;
		const fish = fishRef.current;
		const pos = fish.position;

		fish.scale.set(fishScale, fishScale, fishScale);

		if (hitBoxRef.current) {
			hitBoxRef.current.position.copy(pos);
			offsetVec.set(0, 0, -fishScale * 0.5).applyEuler(fish.rotation);
			hitBoxRef.current.position.add(offsetVec);
			hitBoxRef.current.rotation.copy(fish.rotation);
			hitBoxRef.current.scale.set(1, 1, 1);
		}

		const inBombZone = Math.abs(pos.x - GRID_CENTER.x) < GRID_HALF_SIZE_X && Math.abs(pos.z - GRID_CENTER.z) < GRID_HALF_SIZE_Z;

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
				tempTarget.set(GRID_CENTER.x, pos.y, GRID_CENTER.z);
				fish.lookAt(tempTarget);

				const speed = useFishStore.getState().fishSpeed;
				const distance = pos.distanceTo(tempTarget);
				const duration = distance / speed;

				gsap.to(pos, {
					x: tempTarget.x,
					z: tempTarget.z,
					duration,
					ease: "power2.out",
				});

				setCountdown(3);
			} else if (!inBombZone) {
				hasMovedToCenter.current = false;
			}
		}

		if (!isGameOver) {
			mixerRef.current?.update(delta);

			if (swimActionRef.current) {
				currentPosition.copy(pos);

				if (prevPositionRef.current) {
					const distance = currentPosition.distanceTo(prevPositionRef.current);
					const instantSpeed = distance / delta;

					decayedSpeed.current = lerp(decayedSpeed.current, instantSpeed, 0.15);
					const targetTimeScale = Math.min(Math.max(decayedSpeed.current * 0.3, 0.01), 1.5);
					lerpTimeScale.current = lerp(lerpTimeScale.current, targetTimeScale, 0.1);
					swimActionRef.current.timeScale = lerpTimeScale.current;
				}

				prevPositionRef.current = currentPosition.clone();
			}
		}
	});

	return (
		<>
			<primitive
				ref={fishRef}
				object={isGameOver ? deadScene : fishScene}
				position={isGameOver && deathPosition ? deathPosition : [0, 1, 0]}
				scale={[fishScale, fishScale, fishScale]}
				castShadow
				key={isGameOver ? "dead" : "alive"}
			/>
			{showHitBox && (
				<mesh ref={hitBoxRef}>
					<boxGeometry args={[fishScale * 1.5, 1, fishScale * 5]} />
					<meshBasicMaterial color="red" wireframe transparent opacity={0.5} />
				</mesh>
			)}
		</>
	);
};
