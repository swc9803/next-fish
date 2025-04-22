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
	feeds: { id: string; position: [number, number, number] }[];
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
	isGameOver,
	onExpire,
}: {
	position: [number, number, number];
	fishRef: React.RefObject<Object3D>;
	onCollected: () => void;
	isGameOver: boolean;
	onExpire: () => void;
}) => {
	const meshRef = useRef<Mesh>(null);
	const scaleRef = useRef(0.1);

	const MAX_SCALE = 1;
	const MIN_SCALE = 0;
	const INCREASE_FEED_SPEED = 0.005;
	const DECREASE_FEED_SPEED = 0.05;

	const [isVisible, setIsVisible] = useState(true);

	// 최대 크기에서 0.5초 대기
	useEffect(() => {
		if (scaleRef.current >= MAX_SCALE) {
			setTimeout(shrinkFeed, 500);
		}
	}, [scaleRef.current]);

	useFrame(() => {
		if (isGameOver || !meshRef.current || !fishRef.current || !isVisible) return;

		// scale 증가
		if (scaleRef.current < MAX_SCALE) {
			scaleRef.current += INCREASE_FEED_SPEED;
			if (meshRef.current) {
				meshRef.current.scale.setScalar(scaleRef.current);
			}
		}

		// 충돌 감지
		const feedPos = meshRef.current.position;
		const fishPos = fishRef.current.position;
		const dist = feedPos.distanceTo(fishPos);
		if (dist < 1.5) {
			onCollected();
		}
	});

	// scale 감소
	const shrinkFeed = () => {
		if (!meshRef.current || isGameOver || !isVisible) return;

		const shrinkInterval = setInterval(() => {
			if (scaleRef.current <= MIN_SCALE) {
				clearInterval(shrinkInterval);
				setIsVisible(false);
				onExpire();
			} else {
				scaleRef.current = Math.max(MIN_SCALE, scaleRef.current - DECREASE_FEED_SPEED);
				meshRef.current.scale.setScalar(scaleRef.current);
			}
		}, 1000 / 60);
	};

	useEffect(() => {
		if (meshRef.current) {
			meshRef.current.position.set(...position);
		}
	}, [position]);

	if (!isVisible) return null;
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
	const [activeBombs, setActiveBombs] = useState<Set<number>>(new Set());

	useEffect(() => {
		if (!bombActive || isGameOver || !isInBombZone || feeds.length > 0) return;

		const interval = setInterval(() => {
			if (feeds.length === 0) {
				const x = (Math.floor(Math.random() * (GRID_HALF * 2 + 1)) - GRID_HALF) * CELL_SIZE - 50;
				const z = (Math.floor(Math.random() * (GRID_HALF * 2 + 1)) - GRID_HALF) * CELL_SIZE;
				const newFeed = {
					id: crypto.randomUUID(),
					position: [x, 1, z] as [number, number, number],
				};
				setFeeds([newFeed]);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [bombActive, isGameOver, isInBombZone, feeds, setFeeds]);

	// 폭탄 애니메이션
	const animateCell = useCallback(
		async (color: any, fish: Object3D, index: number) => {
			// 중복 연속 폭탄 타일 방지
			if (activeBombs.has(index)) return;

			await gsap.to(color, {
				r: 1,
				g: 0,
				b: 0,
				duration: 3,
				ease: "power1.inOut",
			});

			setActiveBombs((prev) => new Set(prev.add(index)));

			if (checkCollision(fish, index)) {
				setIsGameOver(true);
				setIsInBombZone(false);
			}

			color.set("white");
		},
		[fishScale, activeBombs]
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

	// 폭탄 생성
	useEffect(() => {
		if (!bombActive || isGameOver) return;

		const fish = fishRef.current;
		if (!fish) return;

		const intervalTime = Math.max(1000, 2500 - score * 10);
		const bombWave = Math.min(1 + Math.floor(score / 20), 3);

		const launch = () => {
			// 중복 연속 폭탄 타일 방지
			const indexes = [...Array(CELLS.length).keys()].filter((index) => !activeBombs.has(index));

			for (let i = 0; i < bombWave; i++) {
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
	}, [animateCell, checkCollision, bombActive, isGameOver, score, fishRef, activeBombs]);

	// 먹이 재생성
	useEffect(() => {
		if (feeds.length === 0) {
			const resetTimeout = setTimeout(() => {
				if (!bombActive || !isInBombZone) return;

				const x = (Math.floor(Math.random() * (GRID_HALF * 2 + 1)) - GRID_HALF) * CELL_SIZE - 50;
				const z = (Math.floor(Math.random() * (GRID_HALF * 2 + 1)) - GRID_HALF) * CELL_SIZE;
				const newFeed = {
					id: crypto.randomUUID(),
					position: [x, 1, z] as [number, number, number],
				};
				setFeeds([newFeed]);
			}, 500);

			return () => clearTimeout(resetTimeout);
		}
	}, [feeds, setFeeds, bombActive, isInBombZone]);

	return (
		<>
			{/* Bomb Zone */}
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

			{/* 먹이 생성 */}
			{feeds.map(({ id, position }) => (
				<GrowingFeed
					key={id}
					position={position}
					fishRef={fishRef}
					isGameOver={isGameOver}
					onCollected={() => {
						if (isGameOver) return;

						setFeeds([]);

						setTimeout(() => {
							const x = (Math.floor(Math.random() * (GRID_HALF * 2 + 1)) - GRID_HALF) * CELL_SIZE - 50;
							const z = (Math.floor(Math.random() * (GRID_HALF * 2 + 1)) - GRID_HALF) * CELL_SIZE;
							const newFeed = {
								id: crypto.randomUUID(),
								position: [x, 1, z] as [number, number, number],
							};
							setFeeds([newFeed]);
						}, 500);

						// score 배율
						const currentScale = useFishStore.getState().fishScale;
						const scoreGain = Math.floor(currentScale * 20);
						useFishStore.setState((state) => ({ score: state.score + scoreGain }));

						// scale 배율
						const added = 0.1 * Math.exp(-currentScale);
						const newScale = Math.min(3, parseFloat((currentScale + added).toFixed(2)));
						useFishStore.getState().setFishScale(newScale);

						// speed 배율
						const newSpeed = Math.max(10, 50 - newScale * 8);
						useFishStore.getState().setFishSpeed(parseFloat(newSpeed.toFixed(2)));
					}}
					onExpire={() => {
						setFeeds([]);
					}}
				/>
			))}
		</>
	);
};
