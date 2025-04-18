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
	setScore: React.Dispatch<React.SetStateAction<number>>;
}

type Vec3 = [number, number, number];

export const BombZone = ({ fishRef, setIsGameOver, setIsInBombZone, isInBombZone, bombActive, setScore }: BombZoneProps) => {
	const fishScale = useFishStore((state) => state.fishScale);
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
		if (!bombActive) return;

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

		const interval = setInterval(() => {
			const index = Math.floor(Math.random() * cells.length);
			const mesh = meshRefs.current[index];
			if (!mesh) return;

			const material = mesh.material as MeshStandardMaterial;
			const color = material.color;
			const fish = fishRef.current;

			gsap.to(color, {
				r: 1,
				g: 0,
				b: 0,
				duration: 3,
				ease: "power1.inOut",
				onComplete: () => {
					if (fish && !isHitDetected(fish, index)) {
						setScore((prev) => prev + 1);
					} else if (fish && isHitDetected(fish, index)) {
						setIsGameOver(true);
						setIsInBombZone(false);
					}

					color.set("white");
				},
			});
		}, 2500);

		return () => clearInterval(interval);
	}, [cells, fishRef, fishScale, isInBombZone, bombActive]);

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
