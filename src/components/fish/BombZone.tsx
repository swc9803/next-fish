import { useCallback, useEffect, useMemo, useRef } from "react";
import { BoxGeometry, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";
import gsap from "gsap";
import { useFishStore } from "@/store/useFishStore";
import { GrowingFeed } from "./GrowingFeed";

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
	meshRefs: React.MutableRefObject<Mesh[]>;
	hitTilesRef: React.MutableRefObject<number[]>;
	blinkTweens: React.MutableRefObject<gsap.core.Tween[]>;
	cellTweens: React.MutableRefObject<{ [index: number]: gsap.core.Tween | undefined }>;
}

type Feed = { id: string; position: [number, number, number] };

const CELL_SIZE = 6;
const GRID_HALF = 3;

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
	meshRefs,
	hitTilesRef,
	blinkTweens,
	cellTweens,
}: BombZoneProps) => {
	const fishScale = useFishStore((state) => state.fishScale);
	const score = useFishStore((state) => state.score);

	const activeBombsRef = useRef<Set<number>>(new Set());

	const bombSpawnIntervalRef = useRef(Math.max(500, 2500 - score * 15));
	const bombSpawnCountRef = useRef(Math.max(3, Math.min(1 + Math.floor(score / 15), 5)));

	const CELLS = useMemo(() => {
		return Array.from({ length: (GRID_HALF * 2 + 1) ** 2 }, (_, i) => {
			const x = (i % (GRID_HALF * 2 + 1)) - GRID_HALF;
			const z = Math.floor(i / (GRID_HALF * 2 + 1)) - GRID_HALF;
			return [x * CELL_SIZE, 0.1, z * CELL_SIZE] as [number, number, number];
		});
	}, []);

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
	}, [countdown, setCountdown, setBombActive]);

	// 생존 점수
	useEffect(() => {
		if (!bombActive || !isInBombZone || isGameOver) return;
		const interval = setInterval(() => {
			useFishStore.setState((state) => ({ score: state.score + 1 }));
		}, 1000);
		return () => clearInterval(interval);
	}, [bombActive, isInBombZone, isGameOver]);

	// 먹이 생성
	useEffect(() => {
		if (!bombActive || isGameOver || !isInBombZone) return;

		const interval = setInterval(() => {
			setFeeds((prevFeeds) => {
				if (prevFeeds.length === 0) {
					const x = (Math.floor(Math.random() * (GRID_HALF * 2 + 1)) - GRID_HALF) * CELL_SIZE - 50;
					const z = (Math.floor(Math.random() * (GRID_HALF * 2 + 1)) - GRID_HALF) * CELL_SIZE;

					return [{ id: crypto.randomUUID(), position: [x, 1, z] }];
				}
				return prevFeeds;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [bombActive, isGameOver, isInBombZone]);

	// 충돌 검사
	const checkCollision = useCallback(
		(fish: Object3D, cellIndex: number) => {
			const fishPos = fish.position.clone();
			const cellWorld = new Vector3(...CELLS[cellIndex]).add(new Vector3(-50, 0, 0));
			const fishDir = new Vector3(0, 0, 1).applyEuler(fish.rotation).normalize();
			const toCell = new Vector3().subVectors(cellWorld, fishPos);

			const hitWidth = fishScale * 2;
			const hitLength = fishScale * 5;

			const forwardDist = Math.abs(toCell.dot(fishDir));
			const rightDir = new Vector3().crossVectors(fishDir, new Vector3(0, 1, 0));
			const sideDist = Math.abs(toCell.dot(rightDir));

			return forwardDist < CELL_SIZE / 2 + hitLength / 2 && sideDist < CELL_SIZE / 2 + hitWidth / 2;
		},
		[fishScale, CELLS]
	);

	// 폭탄 타일 애니메이션
	const animateBomb = useCallback(
		(indexes: number[], fish: Object3D) => {
			if (isGameOver) return;

			const newActive = new Set(activeBombsRef.current);
			indexes.forEach((index) => {
				if (newActive.has(index)) return;
				const mesh = meshRefs.current[index];
				if (!mesh) return;

				const material = mesh.material as MeshStandardMaterial;
				const color = material.color;

				if (cellTweens.current[index]) {
					cellTweens.current[index].kill();
				}

				const tween = gsap.to(color, {
					r: 1,
					g: 0,
					b: 0,
					duration: 3,
					ease: "power1.inOut",
					onComplete: () => {
						if (!isGameOver && fish) {
							if (checkCollision(fish, index)) {
								setIsGameOver(true);
								setIsInBombZone(false);
								hitTilesRef.current.push(index);
							}
						}
						color.set("white");
						cellTweens.current[index] = undefined;
						const updatedActive = new Set(activeBombsRef.current);
						updatedActive.delete(index);
						activeBombsRef.current = updatedActive;
					},
				});

				cellTweens.current[index] = tween;
				newActive.add(index);
			});

			activeBombsRef.current = newActive;

			setTimeout(() => {
				if (isGameOver) return;
				const updatedActive = new Set(activeBombsRef.current);
				indexes.forEach((index) => {
					const mesh = meshRefs.current[index];
					if (mesh) {
						const material = mesh.material as MeshStandardMaterial;
						const color = material.color;

						if (cellTweens.current[index]) {
							cellTweens.current[index].kill();
							cellTweens.current[index] = undefined;
						}

						color.set("white");
					}

					if (!mesh || !fish) return;

					if (checkCollision(fish, index)) {
						setIsGameOver(true);
						setIsInBombZone(false);
						hitTilesRef.current.push(index);
					}

					updatedActive.delete(index);
				});
				activeBombsRef.current = updatedActive;
			}, 3000);
		},
		[checkCollision, isGameOver, meshRefs, hitTilesRef, setIsGameOver, setIsInBombZone, cellTweens]
	);

	// 게임 오버 시
	useEffect(() => {
		if (!isGameOver || hitTilesRef.current.length === 0) return;

		blinkTweens.current.forEach((t) => t.kill());
		blinkTweens.current = [];

		Object.values(cellTweens.current).forEach((tween) => {
			if (tween) tween.kill();
		});
		cellTweens.current = {};

		hitTilesRef.current.forEach((index) => {
			const mesh = meshRefs.current[index];
			if (mesh) {
				const color = (mesh.material as MeshStandardMaterial).color;
				const tween = gsap.to(color, {
					r: 1,
					g: 0,
					b: 0,
					duration: 0.5,
					repeat: -1,
					yoyo: true,
					ease: "sine.inOut",
				});
				blinkTweens.current.push(tween);
			}
		});
	}, [isGameOver, hitTilesRef, meshRefs, blinkTweens, cellTweens]);

	useEffect(() => {
		if (!bombActive || isGameOver) return;
		const fish = fishRef.current;
		if (!fish) return;

		const intervalId = setInterval(() => {
			if (isGameOver) {
				clearInterval(intervalId);
				return;
			}

			const availableIndexes = [...Array(CELLS.length).keys()].filter((i) => !activeBombsRef.current.has(i));
			if (availableIndexes.length === 0) return;

			const selected: number[] = [];
			for (let i = 0; i < bombSpawnCountRef.current && availableIndexes.length > 0; i++) {
				const idx = availableIndexes.splice(Math.floor(Math.random() * availableIndexes.length), 1)[0];
				selected.push(idx);
			}
			animateBomb(selected, fish);
		}, bombSpawnIntervalRef.current);

		return () => clearInterval(intervalId);
	}, [bombActive, isGameOver, fishRef, animateBomb]);

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

						const currentScale = useFishStore.getState().fishScale;

						// score 배율
						const scoreGain = Math.floor(currentScale * 10);
						useFishStore.setState((state) => ({ score: state.score + scoreGain }));

						// scale 배율
						const added = 0.141 * Math.exp(-currentScale);
						const newScale = Math.min(2, parseFloat((currentScale + added).toFixed(2)));

						// speed 배율
						const BASE_SPEED = 20;
						const newSpeed = Math.max(10, BASE_SPEED * Math.exp(-1.2 * (newScale - 1)));

						useFishStore.getState().setFishScale(newScale);
						useFishStore.getState().setFishSpeed(parseFloat(newSpeed.toFixed(2)));
					}}
					onExpire={() => setFeeds([])}
				/>
			))}
		</>
	);
};
