import { useEffect, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { MeshStandardMaterial, Mesh, Object3D, Vector3 } from "three";
import { useFishStore } from "@/store/useFishStore";
import gsap from "gsap";

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

export const FishModel = ({ fishRef, setIsInBombZone, setCountdown }: FishModelProps) => {
	const { scene } = useGLTF("/models/fish.glb");
	const { camera } = useThree();
	const { fishColor, fishScale } = useFishStore();

	const [isMobile, setIsMobile] = useState(false);
	const [showHitBox, setShowHitBox] = useState(false);

	const hitBoxRef = useRef<Mesh>(null);
	const meshMaterials = useRef<MeshStandardMaterial[]>([]);
	const lastInBombZone = useRef<boolean | null>(null);
	const hasMovedToCenter = useRef(false);

	// 모바일 검사
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
					if (mat instanceof MeshStandardMaterial) {
						materials.push(mat);
					}
				});
			}
		});
		meshMaterials.current = materials;
	}, [scene]);

	// 물고기 색상 적용
	useEffect(() => {
		meshMaterials.current.forEach((mat) => mat.color.set(fishColor));
	}, [fishColor]);

	// 디버그용 토글 히트박스
	useEffect(() => {
		const toggleDebug = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() === "d") {
				setShowHitBox((prev) => !prev);
			}
		};
		window.addEventListener("keydown", toggleDebug);
		return () => window.removeEventListener("keydown", toggleDebug);
	}, []);

	// 프레임마다 fish 위치 및 카메라 조정
	useFrame(() => {
		if (!fishRef.current) return;
		const fish = fishRef.current;
		const fishPosition = fish.position as Vector3;

		fish.scale.set(fishScale, fishScale, fishScale);

		if (hitBoxRef.current) {
			hitBoxRef.current.position.copy(fishPosition);
			const offset = new Vector3(0, 0, -fishScale * 0.5).applyEuler(fish.rotation);
			hitBoxRef.current.position.add(offset);
			hitBoxRef.current.rotation.copy(fish.rotation);
			hitBoxRef.current.scale.set(1, 1, 1);
		}

		const inBombZone = Math.abs(fishPosition.x - GRID_CENTER.x) < GRID_HALF_SIZE_X && Math.abs(fishPosition.z - GRID_CENTER.z) < GRID_HALF_SIZE_Z;

		// BombZone 진입 시 카메라 이동
		if (inBombZone) {
			camera.position.set(GRID_CENTER.x, isMobile ? 40 : 30, GRID_CENTER.z);
			camera.lookAt(GRID_CENTER);
		} else {
			camera.position.set(fishPosition.x, 20, fishPosition.z + 14);
			camera.lookAt(fishPosition);
		}

		if (lastInBombZone.current !== inBombZone) {
			lastInBombZone.current = inBombZone;
			setIsInBombZone(inBombZone);

			if (inBombZone && !hasMovedToCenter.current) {
				hasMovedToCenter.current = true;

				gsap.killTweensOf(fish.position);
				const target = new Vector3(GRID_CENTER.x, fishPosition.y, GRID_CENTER.z);
				fish.lookAt(target);

				const speed = useFishStore.getState().fishSpeed;
				const distance = fishPosition.distanceTo(target);
				const duration = distance / speed;

				gsap.to(fish.position, {
					x: target.x,
					z: target.z,
					duration,
					ease: "power2.out",
				});

				setCountdown(3);
			}

			if (!inBombZone) {
				hasMovedToCenter.current = false;
			}
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
