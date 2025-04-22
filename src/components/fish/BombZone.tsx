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
	feeds: Feed[];
	setFeeds: React.Dispatch<React.SetStateAction<Feed[]>>;
	countdown: number | null;
	setCountdown: React.Dispatch<React.SetStateAction<number | null>>;
	setBombActive: React.Dispatch<React.SetStateAction<boolean>>;
}

type Feed = { id: string; position: [number, number, number] };

const CELL_SIZE = 6;
const GRID_HALF = 3;
const CELLS: [number, number, number][] = Array.from({ length: (GRID_HALF * 2 + 1) ** 2 }, (_, i) => {
	const x = (i % (GRID_HALF * 2 + 1)) - GRID_HALF;
	const z = Math.floor(i / (GRID_HALF * 2 + 1)) - GRID_HALF;
	return [x * CELL_SIZE, 0.1, z * CELL_SIZE];
});

export const BombZone = ({
	fishRef,
	setIsGameOver,
	setIsInBombZone,
	isInBombZone,
	bombActive,
	isGameOver,
	feeds,
	setFeeds,
	countdown,
	setCountdown,
	setBombActive,
}: BombZoneProps) => {
	const fishScale = useFishStore((state) => state.fishScale);
	const score = useFishStore((state) => state.score);
	const meshRefs = useRef<Mesh[]>([]);
	const [activeBombs, setActiveBombs] = useState<Set<number>>(new Set());

	const bombSpawnIntervalRef = useRef(Math.max(500, 2500 - score * 15));
	const bombSpawnCountRef = useRef(Math.max(3, Math.min(1 + Math.floor(score / 15), 5)));

	useEffect(() => {
		bombSpawnIntervalRef.current = Math.max(500, 2500 - score * 15);
		bombSpawnCountRef.current = Math.max(3, Math.min(1 + Math.floor(score / 15), 5));
	}, [score]);

	// 폭탄 카운트다운
	useEffect(() => {
		let isCancelled = false;
		const countdownAsync = async () => {
			let current = countdown;
			while (current && current > 0 && !isCancelled) {
				await new Promise((res) => setTimeout(res, 1000));
				current--;
				setCountdown(current);
			}
			if (!isCancelled) {
				setCountdown(null);
				setBombActive(true);
			}
		};
		if (countdown !== null) countdownAsync();
		return () => {
			isCancelled = true;
		};
	}, [countdown]);

	// 생존 점수
	useEffect(() => {
		if (!bombActive || !isInBombZone || isGameOver) return;
		const interval = setInterval(() => {
			useFishStore.setState((state) => ({ score: state.score + 1 }));
		}, 1000);
		return () => clearInterval(interval);
	}, [bombActive, isInBombZone, isGameOver]);

	// 먹이 자동 생성
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

	const animateCells = (indexes: number[], fish: Object3D) => {
		const newActive = new Set(activeBombs);

		indexes.forEach((index) => {
			if (newActive.has(index)) return;
			const mesh = meshRefs.current[index];
			if (!mesh) return;
			const color = (mesh.material as MeshStandardMaterial).color;
			gsap.to(color, { r: 1, g: 0, b: 0, duration: 3, ease: "power1.inOut" });
			newActive.add(index);
		});

		setActiveBombs(newActive);

		setTimeout(() => {
			indexes.forEach((index) => {
				const mesh = meshRefs.current[index];
				if (mesh) {
					const color = (mesh.material as MeshStandardMaterial).color;
					color.set("white");
				}

				if (!mesh || !fish) return;

				if (checkCollision(fish, index)) {
					setIsGameOver(true);
					setIsInBombZone(false);
				}
			});
		}, 3000);
	};

	// 폭탄 생성
	useEffect(() => {
		if (!bombActive || isGameOver) return;
		const fish = fishRef.current;
		if (!fish) return;
		const intervalId = setInterval(() => {
			const indexes = [...Array(CELLS.length).keys()].filter((i) => !activeBombs.has(i));
			if (indexes.length === 0) return;
			const selected: number[] = [];
			for (let i = 0; i < bombSpawnCountRef.current && indexes.length > 0; i++) {
				const idx = indexes.splice(Math.floor(Math.random() * indexes.length), 1)[0];
				selected.push(idx);
			}
			animateCells(selected, fish);
		}, bombSpawnIntervalRef.current);
		return () => clearInterval(intervalId);
	}, [bombActive, isGameOver, fishRef]);

	return (
		<>
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
						const currentScale = useFishStore.getState().fishScale;
						const scoreGain = Math.floor(currentScale * 20);
						useFishStore.setState((state) => ({ score: state.score + scoreGain }));
						const added = 0.1 * Math.exp(-currentScale);
						const newScale = Math.min(3, parseFloat((currentScale + added).toFixed(2)));
						useFishStore.getState().setFishScale(newScale);
						const newSpeed = Math.max(10, 50 - newScale * 8);
						useFishStore.getState().setFishSpeed(parseFloat(newSpeed.toFixed(2)));
					}}
					onExpire={() => setFeeds([])}
				/>
			))}
		</>
	);
};

export const resetGameState = (
	fishRef: React.RefObject<Object3D>,
	setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>,
	setIsInBombZone: React.Dispatch<React.SetStateAction<boolean>>,
	setBombActive: React.Dispatch<React.SetStateAction<boolean>>,
	setScore: (value: number) => void,
	setCountdown: React.Dispatch<React.SetStateAction<number | null>>,
	setFeeds: React.Dispatch<React.SetStateAction<Feed[]>>
) => {
	if (fishRef.current) {
		fishRef.current.position.set(0, 1, 0);
	}
	setIsGameOver(false);
	setIsInBombZone(false);
	setBombActive(false);
	setScore(0);
	setCountdown(null);
	setFeeds([]);
	useFishStore.getState().setFishScale(1);
	useFishStore.getState().setFishSpeed(50);
};

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
			setTimeout(decreaseFeed, 500);
		}
	}, [scaleRef.current]);

	useFrame(() => {
		if (isGameOver || !meshRef.current || !fishRef.current || !isVisible) return;

		// scale 증가
		if (scaleRef.current < MAX_SCALE) {
			scaleRef.current += INCREASE_FEED_SPEED;
			meshRef.current.scale.setScalar(scaleRef.current);
		}

		// 충돌 감지
		const feedPos = meshRef.current.position;
		const fishPos = fishRef.current.position;
		const dist = feedPos.distanceTo(fishPos);
		if (dist < 1.5 && isVisible) {
			setIsVisible(false);
			onCollected();
		}
	});

	const decreaseFeed = () => {
		if (!meshRef.current || isGameOver || !isVisible) return;

		const shrinkInterval = setInterval(() => {
			if (!meshRef.current || !isVisible) {
				clearInterval(shrinkInterval);
				return;
			}
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
