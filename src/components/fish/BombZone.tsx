import { useEffect, useMemo, useRef, useCallback, memo, RefObject, Dispatch, SetStateAction, useState } from "react";
import { BoxGeometry, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";
import gsap from "gsap";
import { useFrame } from "@react-three/fiber";
import { useFishStore } from "@/store/useFishStore";
import { GrowingFeed } from "./GrowingFeed";

export type Feed = { id: string; position: [number, number, number]; active: boolean };

interface BombZoneProps {
	fishRef: RefObject<Object3D>;
	setIsGameOver: Dispatch<SetStateAction<boolean>>;
	setIsInBombZone: Dispatch<SetStateAction<boolean>>;
	isInBombZone: boolean;
	bombActive: boolean;
	isGameOver: boolean;
	feeds: Feed[];
	setFeeds: Dispatch<SetStateAction<Feed[]>>;
	setBombActive: Dispatch<SetStateAction<boolean>>;
	meshRefs: RefObject<Mesh[]>;
	hitTilesRef: RefObject<number[]>;
	blinkTweens: RefObject<gsap.core.Tween[]>;
	cellTweens: RefObject<{ [index: number]: gsap.core.Tween | undefined }>;
	setDeathPosition: Dispatch<SetStateAction<[number, number, number] | null>>;
	score: number;
	incrementScore: () => void;
}

const CELL_SIZE = 6;
const GRID_HALF = 3;
const MAX_SCORE = 1000;
const FEED_POOL_SIZE = 1;

export const BombZone = memo((props: BombZoneProps) => {
	const {
		fishRef,
		setIsGameOver,
		setIsInBombZone,
		isInBombZone,
		bombActive,
		isGameOver,
		meshRefs,
		hitTilesRef,
		setDeathPosition,
		score,
		incrementScore,
	} = props;

	const fishScale = useFishStore((s) => s.fishScale);
	const activeBombsRef = useRef(new Set<number>());
	const bombProgressRef = useRef<{ [index: number]: number }>({});

	const [feeds, internalSetFeeds] = useState<Feed[]>(
		Array.from({ length: FEED_POOL_SIZE }, (_, i) => ({ id: `feed-${i}`, position: [0, 1, 0], active: false }))
	);

	const CELLS = useMemo(() => {
		return Array.from({ length: (GRID_HALF * 2 + 1) ** 2 }, (_, i) => {
			const x = (i % (GRID_HALF * 2 + 1)) - GRID_HALF;
			const z = Math.floor(i / (GRID_HALF * 2 + 1)) - GRID_HALF;
			return [x * CELL_SIZE, 0.1, z * CELL_SIZE] as [number, number, number];
		});
	}, []);

	const checkCollision = useCallback(
		(fish: Object3D, cellIndex: number) => {
			const fishPos = fish.position.clone();
			const cellWorld = new Vector3(...CELLS[cellIndex]).add(new Vector3(-50, 0, 0));
			const fishDir = new Vector3(0, 0, 1).applyEuler(fish.rotation).normalize();
			const toCell = new Vector3().subVectors(cellWorld, fishPos);
			const hitWidth = fishScale * 2;
			const hitLength = fishScale * 5;
			const forwardDist = Math.abs(toCell.dot(fishDir));
			const sideDist = Math.abs(toCell.dot(new Vector3().crossVectors(fishDir, new Vector3(0, 1, 0))));
			return forwardDist < CELL_SIZE / 2 + hitLength / 2 && sideDist < CELL_SIZE / 2 + hitWidth / 2;
		},
		[fishScale, CELLS]
	);

	const handleFishHit = useCallback(
		(index: number) => {
			if (fishRef.current) {
				const pos = fishRef.current.position;
				setDeathPosition([pos.x, pos.y, pos.z]);
				gsap.killTweensOf(pos);
			}
			setIsGameOver(true);
			setIsInBombZone(false);
			hitTilesRef.current.push(index);
		},
		[fishRef, setIsGameOver, setIsInBombZone, setDeathPosition, hitTilesRef]
	);

	const animateBomb = useCallback(
		(index: number, fish: Object3D) => {
			const MAX_BOMBS = 15;
			if (isGameOver || activeBombsRef.current.has(index) || activeBombsRef.current.size >= MAX_BOMBS) return;

			const mesh = meshRefs.current[index];
			if (!mesh) return;

			bombProgressRef.current[index] = 0;
			activeBombsRef.current.add(index);
		},
		[isGameOver, meshRefs]
	);

	useFrame((_, delta) => {
		for (const index of Object.keys(bombProgressRef.current)) {
			const i = Number(index);
			const mesh = meshRefs.current[i];
			if (!mesh) continue;

			const progress = bombProgressRef.current[i] ?? 0;
			const nextProgress = progress + delta / 3;
			bombProgressRef.current[i] = nextProgress;

			const color = (mesh.material as MeshStandardMaterial).color;
			color.setRGB(1, Math.max(1 - nextProgress, 0), Math.max(1 - nextProgress, 0));

			if (nextProgress >= 1) {
				if (!isGameOver && fishRef.current && checkCollision(fishRef.current, i)) {
					handleFishHit(i);
				}
				color.set("white");
				delete bombProgressRef.current[i];
				activeBombsRef.current.delete(i);
			}
		}
	});

	useEffect(() => {
		if (!bombActive || !isInBombZone || isGameOver) return;

		const interval = setInterval(() => {
			incrementScore();

			if (score >= MAX_SCORE) {
				setIsGameOver(true);
				setIsInBombZone(false);
				internalSetFeeds((prev) => prev.map((f) => ({ ...f, active: false })));
				return;
			}

			internalSetFeeds((prev) =>
				prev.map((f, i) => {
					if (i === 0) {
						const x = (Math.floor(Math.random() * 7) - 3) * CELL_SIZE - 50;
						const z = (Math.floor(Math.random() * 7) - 3) * CELL_SIZE;
						return { ...f, position: [x, 1, z], active: true };
					}
					return f;
				})
			);

			const bombCount = Math.floor(4 + (score / MAX_SCORE) * 6);
			const indexes = new Set<number>();
			while (indexes.size < bombCount) {
				indexes.add(Math.floor(Math.random() * CELLS.length));
			}
			fishRef.current && [...indexes].forEach((i) => animateBomb(i, fishRef.current!));
		}, Math.max(1000 - (score / MAX_SCORE) * 700, 500));

		return () => clearInterval(interval);
	}, [bombActive, isInBombZone, isGameOver, score, incrementScore, animateBomb]);

	const memoizedMeshes = useMemo(() => {
		return CELLS.map((pos, i) => (
			<group key={i} position={pos}>
				<mesh
					ref={(el) => {
						if (el) meshRefs.current[i] = el;
					}}
				>
					<boxGeometry args={[CELL_SIZE, 0.1, CELL_SIZE]} />
					<meshStandardMaterial color="white" />
				</mesh>
				<lineSegments>
					<edgesGeometry args={[new BoxGeometry(CELL_SIZE, 0.1, CELL_SIZE)]} />
					<lineBasicMaterial color="black" />
				</lineSegments>
			</group>
		));
	}, [CELLS]);

	return (
		<>
			<group position={[-50, 0, 0]}>{memoizedMeshes}</group>

			{feeds.map(({ id, position, active }) => (
				<GrowingFeed
					key={id}
					position={position}
					fishRef={fishRef}
					isGameOver={isGameOver}
					active={active}
					onCollected={() => {
						incrementScore();
						internalSetFeeds((prev) => prev.map((f) => (f.id === id ? { ...f, active: false } : f)));
					}}
					onExpire={() => {
						internalSetFeeds((prev) => prev.map((f) => (f.id === id ? { ...f, active: false } : f)));
					}}
				/>
			))}
		</>
	);
});
