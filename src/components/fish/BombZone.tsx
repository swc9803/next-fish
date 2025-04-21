import { useEffect, useRef } from "react";
import { BoxGeometry, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";
import gsap from "gsap";
import { useFishStore } from "@/store/useFishStore";

interface BombZoneProps {
	fishRef: React.RefObject<Object3D>;
	setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>;
	setIsInBombZone: React.Dispatch<React.SetStateAction<boolean>>;
	isInBombZone: boolean;
	bombActive: boolean;
	isGameOver: boolean;
}

type Vec3 = [number, number, number];

export const BombZone = ({ fishRef, setIsGameOver, setIsInBombZone, isInBombZone, bombActive, isGameOver }: BombZoneProps) => {
	const fishScale = useFishStore((state) => state.fishScale);
	const score = useFishStore((state) => state.score);

	const cellSize = 6;
	const gridHalf = 3;

	const cells: Vec3[] = [];
	for (let x = -gridHalf; x <= gridHalf; x++) {
		for (let z = -gridHalf; z <= gridHalf; z++) {
			cells.push([x * cellSize, 0.1, z * cellSize]);
		}
	}

	const meshRefs = useRef<Mesh[]>([]);

	useEffect(() => {
		if (!bombActive || isGameOver) return;

		const groupOffset = new Vector3(-50, 0, 0);

		const isHitDetected = (fish: Object3D, cellIndex: number) => {
			const fishPos = fish.position.clone();
			const cellLocal = new Vector3(...cells[cellIndex]);
			const cellWorld = cellLocal.add(groupOffset);
			const fishDir = new Vector3(0, 0, 1).applyEuler(fish.rotation).normalize();

			const toCell = new Vector3().subVectors(cellWorld, fishPos);

			const hitWidth = fishScale * 2;
			const hitLength = fishScale * 5;

			const halfWidth = hitWidth / 2;
			const halfLength = hitLength / 2;

			const forwardDist = Math.abs(toCell.dot(fishDir));
			const rightDir = new Vector3().crossVectors(fishDir, new Vector3(0, 1, 0));
			const sideDist = Math.abs(toCell.dot(rightDir));

			const cellHalf = cellSize / 2;

			return forwardDist < cellHalf + halfLength && sideDist < cellHalf + halfWidth;
		};

		// score에 따라 폭탄 생성 주기 및 개수 조정
		const intervalTime = Math.max(1000, 2500 - score * 10);
		const bombsPerWave = Math.min(1 + Math.floor(score / 20), 3);

		const startBombWave = () => {
			const fish = fishRef.current;
			if (!fish) return;

			const indexes = Array.from({ length: cells.length }, (_, i) => i);

			for (let i = 0; i < bombsPerWave; i++) {
				const index = indexes.splice(Math.floor(Math.random() * indexes.length), 1)[0];
				const mesh = meshRefs.current[index];
				if (!mesh) continue;

				const material = mesh.material as MeshStandardMaterial;
				const color = material.color;

				const animateCell = async (color: any, fish: Object3D, index: number) => {
					await gsap.to(color, {
						r: 1,
						g: 0,
						b: 0,
						duration: 3,
						ease: "power1.inOut",
					});

					if (isHitDetected(fish, index)) {
						setIsGameOver(true);
						setIsInBombZone(false);
					}

					color.set("white");
				};

				animateCell(color, fish, index);
			}
		};

		startBombWave();

		const interval = setInterval(startBombWave, intervalTime);
		return () => clearInterval(interval);
	}, [cells, fishRef, fishScale, isInBombZone, bombActive, isGameOver, score]);

	return (
		<group position={[-50, 0, 0]}>
			{cells.map((pos, i) => (
				<group key={i} position={pos}>
					<mesh ref={(el) => el && (meshRefs.current[i] = el)}>
						<boxGeometry args={[cellSize, 0.1, cellSize]} />
						<meshStandardMaterial color="white" />
					</mesh>
					<lineSegments>
						<edgesGeometry args={[new BoxGeometry(cellSize, 0.1, cellSize)]} />
						<lineBasicMaterial color="black" />
					</lineSegments>
				</group>
			))}
		</group>
	);
};
