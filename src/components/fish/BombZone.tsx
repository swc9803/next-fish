import { useCallback, useEffect, useRef, useState } from "react";
import { BoxGeometry, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { useFishStore } from "@/store/useFishStore";

interface BombZoneProps {
	fishRef: React.RefObject<Object3D>;
	setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>;
	setIsInBombZone: React.Dispatch<React.SetStateAction<boolean>>;
	isInBombZone: boolean;
	bombActive: boolean;
	isGameOver: boolean;
	feeds: { id: string; position: [number, number, number] }[]; // ✅ 추가
	setFeeds: React.Dispatch<React.SetStateAction<{ id: string; position: [number, number, number] }[]>>;
}

const CELL_SIZE = 6;
const GRID_HALF = 3;
const CELLS: [number, number, number][] = Array.from({ length: (GRID_HALF * 2 + 1) ** 2 }, (_, i) => {
	const x = (i % (GRID_HALF * 2 + 1)) - GRID_HALF;
	const z = Math.floor(i / (GRID_HALF * 2 + 1)) - GRID_HALF;
	return [x * CELL_SIZE, 0.1, z * CELL_SIZE];
});

const GrowingFeed = ({
	position,
	fishRef,
	onCollected,
}: {
	position: [number, number, number];
	fishRef: React.RefObject<Object3D>;
	onCollected: () => void;
}) => {
	const meshRef = useRef<Mesh>(null);
	const scaleRef = useRef(0.1);
	const maxScale = 1;
	const minScale = 0;
	const growthSpeed = 0.005;

	// 생성 여부 상태
	const [isVisible, setIsVisible] = useState(true);

	useFrame(() => {
		if (!meshRef.current || !fishRef.current) return;

		// 먹이 제거
		if (scaleRef.current <= minScale) {
			setIsVisible(false);
			return;
		}

		// scale 증가 및 감소
		if (isVisible && scaleRef.current < maxScale) {
			scaleRef.current += growthSpeed;
			meshRef.current.scale.setScalar(scaleRef.current);
		}

		// 충돌 감지
		const feedPos = meshRef.current.position;
		const fishPos = fishRef.current.position;
		const dist = feedPos.distanceTo(fishPos);
		if (dist < 1.5) {
			onCollected();
		}
	});

	// 먹이 제거 후
	useEffect(() => {
		if (!isVisible) {
			setTimeout(() => {
				setIsVisible(true);
				scaleRef.current = 0.1;
				meshRef.current.position.set((Math.random() - 0.5) * 50, 1, (Math.random() - 0.5) * 50);
			}, 1000);
		}
	}, [isVisible]);

	useEffect(() => {
		if (meshRef.current) {
			meshRef.current.position.set(...position);
		}
	}, [position]);

	return (
		<mesh ref={meshRef}>
			<sphereGeometry args={[0.5, 16, 16]} />
			<meshStandardMaterial color="limegreen" />
		</mesh>
	);
};

export const BombZone = ({ fishRef, setIsGameOver, setIsInBombZone, isInBombZone, bombActive, isGameOver, feeds, setFeeds }: BombZoneProps) => {
	const fishScale = useFishStore((state) => state.fishScale);
	const score = useFishStore((state) => state.score);
	const meshRefs = useRef<Mesh[]>([]);

	// 먹이 생성
	useEffect(() => {
		if (!bombActive || isGameOver || !isInBombZone) return;

		const interval = setInterval(() => {
			const x = (Math.floor(Math.random() * (GRID_HALF * 2 + 1)) - GRID_HALF) * CELL_SIZE - 50;
			const z = (Math.floor(Math.random() * (GRID_HALF * 2 + 1)) - GRID_HALF) * CELL_SIZE;
			const newFeed = {
				id: crypto.randomUUID(),
				position: [x, 1, z] as [number, number, number],
			};
			setFeeds((prev) => (prev.length === 0 ? [newFeed] : prev));
		}, 2000);

		return () => clearInterval(interval);
	}, [bombActive, isGameOver, isInBombZone, setFeeds]);

	// 폭탄 애니메이션 실행
	const animateCell = useCallback(
		async (color: any, fish: Object3D, index: number) => {
			await gsap.to(color, {
				r: 1,
				g: 0,
				b: 0,
				duration: 3,
				ease: "power1.inOut",
			});

			if (checkCollision(fish, index)) {
				setIsGameOver(true);
				setIsInBombZone(false);
			}

			color.set("white");
		},
		[fishScale]
	);

	// 충돌 검사
	const checkCollision = useCallback(
		(fish: Object3D, cellIndex: number) => {
			const fishPos = fish.position.clone();
			const cellLocal = new Vector3(...CELLS[cellIndex]);
			const cellWorld = cellLocal.add(new Vector3(-50, 0, 0));
			const fishDir = new Vector3(0, 0, 1).applyEuler(fish.rotation).normalize();
			const toCell = new Vector3().subVectors(cellWorld, fishPos);

			const hitWidth = fishScale * 2;
			const hitLength = fishScale * 5;

			const forwardDist = Math.abs(toCell.dot(fishDir));
			const rightDir = new Vector3().crossVectors(fishDir, new Vector3(0, 1, 0));
			const sideDist = Math.abs(toCell.dot(rightDir));

			return forwardDist < CELL_SIZE / 2 + hitLength / 2 && sideDist < CELL_SIZE / 2 + hitWidth / 2;
		},
		[fishScale]
	);

	// 폭탄 생성 및 애니메이션
	useEffect(() => {
		if (!bombActive || isGameOver) return;

		const fish = fishRef.current;
		if (!fish) return;

		const intervalTime = Math.max(1000, 2500 - score * 10);
		const bombsPerWave = Math.min(1 + Math.floor(score / 20), 3);

		const launch = () => {
			const indexes = [...Array(CELLS.length).keys()];

			for (let i = 0; i < bombsPerWave; i++) {
				const index = indexes.splice(Math.floor(Math.random() * indexes.length), 1)[0];
				const mesh = meshRefs.current[index];
				if (!mesh) continue;
				const color = (mesh.material as MeshStandardMaterial).color;
				animateCell(color, fish, index);
			}
		};

		launch();
		const interval = setInterval(launch, intervalTime);
		return () => clearInterval(interval);
	}, [animateCell, checkCollision, bombActive, isGameOver, score, fishRef]);

	return (
		<>
			{/* 폭탄 Zone */}
			<group position={[-50, 0, 0]}>
				{CELLS.map((pos, i) => (
					<group key={i} position={pos}>
						<mesh ref={(el) => el && (meshRefs.current[i] = el)}>
							<boxGeometry args={[CELL_SIZE, 0.1, CELL_SIZE]} />
							<meshStandardMaterial color="white" />
						</mesh>
						<lineSegments>
							<edgesGeometry args={[new BoxGeometry(CELL_SIZE, 0.1, CELL_SIZE)]} />
							<lineBasicMaterial color="black" />
						</lineSegments>
					</group>
				))}
			</group>

			{/* 먹이 렌더링 */}
			{feeds.map(({ id, position }) => (
				<GrowingFeed
					key={id}
					position={position}
					fishRef={fishRef}
					onCollected={() => {
						if (isGameOver) return;
						setFeeds((prev) => prev.filter((f) => f.id !== id));

						// score 배율
						const currentScale = useFishStore.getState().fishScale;
						const scoreGain = Math.floor(currentScale * 15);
						useFishStore.setState((state) => ({ score: state.score + scoreGain }));

						// scale 배율
						const added = 0.1 * Math.exp(-currentScale);
						const newScale = Math.min(3, parseFloat((currentScale + added).toFixed(2)));
						useFishStore.getState().setFishScale(newScale);

						// speed 배율
						const newSpeed = Math.max(10, 50 - newScale * 8);
						useFishStore.getState().setFishSpeed(parseFloat(newSpeed.toFixed(2)));
					}}
				/>
			))}
		</>
	);
};
