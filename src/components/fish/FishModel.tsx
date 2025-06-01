import { useEffect, useRef, useState, RefObject, Dispatch, SetStateAction } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { MeshStandardMaterial, Mesh, Object3D, Vector3, AnimationMixer, AnimationAction, LoopRepeat, Color } from "three";
import gsap from "gsap";

import { useFishStore } from "@/store/useFishStore";

interface FishModelProps {
	fishRef: RefObject<Object3D | null>;
	setIsInBombZone: Dispatch<SetStateAction<boolean>>;
	setBombActive: Dispatch<SetStateAction<boolean>>;
	isGameOver: boolean;
	deathPosition: [number, number, number] | null;
	onLoaded: () => void;
	startAnimation: boolean;
}

export const FishModel = ({ fishRef, setIsInBombZone, isGameOver, deathPosition, onLoaded, startAnimation }: FishModelProps) => {
	const { scene: fishScene, animations } = useGLTF("/models/fish.glb");
	const { scene: deadScene } = useGLTF("/models/fish_bone.glb");
	const { camera } = useThree();

	const fishColor = useFishStore((s) => s.fishColor);
	const fishScale = useFishStore((s) => s.fishScale);

	const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
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
	const didNotify = useRef(false);

	const BOMB_ZONE_POSITION_X = -75;

	const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

	useEffect(() => {
		if (!didNotify.current && fishRef.current) {
			onLoaded();
			didNotify.current = true;
		}
	}, [onLoaded, fishRef]);

	useEffect(() => {
		if (startAnimation && fishRef.current) {
			fishRef.current.position.set(0, 1, -20);

			gsap.to(fishRef.current.position, {
				x: 0,
				y: 1,
				z: 0,
				duration: 3,
				ease: "power2.out",
			});
		}
	}, [startAnimation, fishRef]);

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth <= 768);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// 그림자
	useEffect(() => {
		fishScene.traverse((child) => {
			if ((child as Mesh).isMesh) child.castShadow = true;
		});
	}, [fishScene]);

	useEffect(() => {
		const materials: MeshStandardMaterial[] = [];
		fishScene.traverse((child) => {
			if (child instanceof Mesh && child.name === "Mesh") {
				const mats = Array.isArray(child.material) ? child.material : [child.material];
				materials.push(...mats.filter((m): m is MeshStandardMaterial => m instanceof MeshStandardMaterial));
			}
		});
		meshMaterials.current = materials;
	}, [fishScene]);

	useEffect(() => {
		const targetColor = new Color(fishColor);
		meshMaterials.current.forEach((mat) => {
			if (!mat.color.equals(targetColor)) {
				gsap.to(mat.color, {
					r: targetColor.r,
					g: targetColor.g,
					b: targetColor.b,
					duration: 1,
					ease: "power2.out",
				});
			}
		});
	}, [fishColor]);

	useEffect(() => {
		const toggleDebug = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() === "d") setShowHitBox((prev) => !prev);
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
		if (isGameOver || !fishRef.current) return;

		const fish = fishRef.current;
		const pos = fish.position;
		fish.scale.set(fishScale, fishScale, fishScale);

		// hitbox
		if (hitBoxRef.current) {
			hitBoxRef.current.position.copy(pos);
			offsetVec.current.set(0, 0, -fishScale * 0.5).applyEuler(fish.rotation);
			hitBoxRef.current.position.add(offsetVec.current);
			hitBoxRef.current.rotation.copy(fish.rotation);
		}

		// bombzone 진입
		const inBombZone = Math.abs(pos.x - BOMB_ZONE_POSITION_X) < 21 && Math.abs(pos.z) < 21;
		if (inBombZone) {
			const camTarget = new Vector3(BOMB_ZONE_POSITION_X, isMobile ? 70 : 30, 0);
			if (camera.position.distanceToSquared(camTarget) > 0.01) {
				camera.position.copy(camTarget);
				camera.lookAt(BOMB_ZONE_POSITION_X, 0, 0);
			}
		} else {
			const camPos = new Vector3(pos.x, isMobile ? 40 : 30, pos.z + 20);
			if (camera.position.distanceToSquared(camPos) > 0.01) {
				camera.position.copy(camPos);
				camera.lookAt(pos);
			}
		}

		if (lastInBombZone.current !== inBombZone) {
			lastInBombZone.current = inBombZone;
			setIsInBombZone(inBombZone);

			if (inBombZone && !hasMovedToCenter.current) {
				hasMovedToCenter.current = true;

				gsap.killTweensOf(pos);
				tempTarget.current.set(BOMB_ZONE_POSITION_X, pos.y, 0);
				fish.lookAt(tempTarget.current);
				const speed = useFishStore.getState().fishSpeed;
				const distance = pos.distanceTo(tempTarget.current);
				gsap.to(pos, {
					x: tempTarget.current.x,
					z: tempTarget.current.z,
					duration: distance / speed,
					ease: "power2.out",
				});
			} else if (!inBombZone) {
				hasMovedToCenter.current = false;
			}
		}

		// 애니메이션 속도 조정
		mixerRef.current?.update(delta);
		if (swimActionRef.current) {
			currentPosition.current.copy(pos);
			if (prevPositionRef.current) {
				const distance = currentPosition.current.distanceTo(prevPositionRef.current);
				const instantSpeed = distance / delta;
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
			<primitive
				ref={fishRef}
				object={isGameOver && deathPosition ? deadScene : fishScene}
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
