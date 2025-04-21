import { useEffect, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { MeshStandardMaterial, Mesh, Object3D, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { useFishStore } from "@/store/useFishStore";

interface FishModelProps {
	fishRef: React.RefObject<Object3D>;
	setIsInBombZone: React.Dispatch<React.SetStateAction<boolean>>;
	setCountdown: React.Dispatch<React.SetStateAction<number | null>>;
}

const GRID_CENTER = new Vector3(-50, 0, 0);
const GRID_SIZE_X = 42;
const GRID_SIZE_Z = 42;

export const FishModel = ({ fishRef, setIsInBombZone, setCountdown }: FishModelProps) => {
	const { scene } = useGLTF("/models/fish.glb");
	const { camera } = useThree();
	const { fishColor, fishScale } = useFishStore();

	const [isMobile, setIsMobile] = useState(false);
	const [showHitBox, setShowHitBox] = useState(false);
	const hitBoxRef = useRef<Mesh>(null);
	const meshMaterials = useRef<MeshStandardMaterial[]>([]);
	const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastInBombZone = useRef<boolean | null>(null);

	// 모바일 검사
	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth <= 480);
		};
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

		fishRef.current.scale.set(fishScale, fishScale, fishScale);
		const fishPosition = fishRef.current.position as Vector3;

		if (hitBoxRef.current && fishRef.current) {
			const fish = fishRef.current;
			const hitBox = hitBoxRef.current;
			hitBox.position.copy(fish.position);

			const offset = new Vector3(0, 0, -fishScale * 0.5);
			offset.applyEuler(fish.rotation);
			hitBox.position.add(offset);
			hitBox.rotation.copy(fish.rotation);
			hitBox.scale.set(1, 1, 1);
		}

		const inBombZone = Math.abs(fishPosition.x - GRID_CENTER.x) < GRID_SIZE_X / 2 && Math.abs(fishPosition.z - GRID_CENTER.z) < GRID_SIZE_Z / 2;

		// 입장
		if (inBombZone) {
			camera.position.set(GRID_CENTER.x, isMobile ? 40 : 30, GRID_CENTER.z);
			camera.lookAt(GRID_CENTER);
		} else {
			camera.position.set(fishPosition.x, 20, fishPosition.z + 14);
			camera.lookAt(fishPosition);
		}

		if (lastInBombZone.current !== inBombZone) {
			lastInBombZone.current = inBombZone;

			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}

			debounceTimeoutRef.current = setTimeout(() => {
				setIsInBombZone(inBombZone);
				if (inBombZone) {
					setCountdown(3);
				}
			}, 100);
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
