import { useMemo, useRef, useCallback, RefObject, Dispatch, SetStateAction, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BoxGeometry, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";
import gsap from "gsap";

import { useFishStore } from "@/store/useFishStore";
import { useDeathPositionGrow } from "@/hooks/useDeathPositionGrow";
import { GrowingFeed } from "./GrowingFeed";

interface BombZoneProps {
	fishRef: RefObject<Object3D | null>;
	setIsGameOver: Dispatch<SetStateAction<boolean>>;
	setIsInBombZone: Dispatch<SetStateAction<boolean>>;
	isInBombZone: boolean;
	bombActive: boolean;
	isGameOver: boolean;
	feed: {
		position: [number, number, number];
		active: boolean;
	};
	setFeed: Dispatch<SetStateAction<{ position: [number, number, number]; active: boolean }>>;
	setBombActive: Dispatch<SetStateAction<boolean>>;
	meshRefs: RefObject<Mesh[]>;
	hitTilesRef: RefObject<number[]>;
	blinkTweens: RefObject<gsap.core.Tween[]>;
	cellTweens: RefObject<{ [index: number]: gsap.core.Tween | undefined }>;
	setDeathPosition: Dispatch<SetStateAction<[number, number, number] | null>>;
	score: number;
	incrementScore: () => void;
	onResetRef?: RefObject<() => void>;
}

const CELL_SIZE = 6;
const GRID_HALF = 3;
const MAX_SCORE = 1000;

const CELLS: [number, number, number][] = Array.from({ length: (GRID_HALF * 2 + 1) ** 2 }, (_, i) => {
	const x = (i % (GRID_HALF * 2 + 1)) - GRID_HALF;
	const z = Math.floor(i / (GRID_HALF * 2 + 1)) - GRID_HALF;
	return [x * CELL_SIZE, 0.1, z * CELL_SIZE];
});

const cameraShakeRef = {
	time: 0,
	intensity: 0,
	basePosition: new Vector3(),
};

const BOMB_ZONE_POSITION_X = -75;

export const BombZone = (props: BombZoneProps) => {
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
		feed,
		setFeed,
		blinkTweens,
		onResetRef,
	} = props;

	const { camera } = useThree();
	const fishScale = useFishStore((s) => s.fishScale);

	const activeBombsRef = useRef(new Set<number>());
	const bombProgressRef = useRef<{ [index: number]: number }>({});
	const bombTimer = useRef(0);
	const lastDelayRef = useRef(1.5);

	const checkCollision = useCallback(
		(fish: Object3D, cellIndex: number) => {
			const fishPos = fish.position.clone();
			const cellWorld = new Vector3(...CELLS[cellIndex]).add(new Vector3(BOMB_ZONE_POSITION_X, 0, 0));
			const fishDir = new Vector3(0, 0, 1).applyEuler(fish.rotation).normalize();
			const toCell = new Vector3().subVectors(cellWorld, fishPos);
			const hitWidth = fishScale * 2;
			const hitLength = fishScale * 5;
			const forwardDist = Math.abs(toCell.dot(fishDir));
			const sideDist = Math.abs(toCell.dot(new Vector3().crossVectors(fishDir, new Vector3(0, 1, 0))));
			return forwardDist < CELL_SIZE / 2 + hitLength / 2 && sideDist < CELL_SIZE / 2 + hitWidth / 2;
		},
		[fishScale]
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
		(index: number) => {
			if (isGameOver || activeBombsRef.current.has(index)) return;

			const mesh = meshRefs.current[index];
			if (!mesh) return;

			bombProgressRef.current[index] = 0;
			activeBombsRef.current.add(index);
		},
		[isGameOver, meshRefs]
	);

	useEffect(() => {
		if (!onResetRef) return;
		onResetRef.current = () => {
			activeBombsRef.current.clear();
			bombProgressRef.current = {};
			meshRefs.current.forEach((mesh) => {
				if (mesh && mesh.material) {
					(mesh.material as MeshStandardMaterial).color.set("white");
				}
			});
		};
	}, [onResetRef, meshRefs]);

	useDeathPositionGrow({
		isGameOver,
		hitTilesRef,
		meshRefs,
		blinkTweens,
	});

	useFrame((_, delta) => {
		if (!bombActive || !isInBombZone || isGameOver) return;

		bombTimer.current += delta;
		const currentDelay = Math.max(1.5 - (score / MAX_SCORE) * 0.5, 1);
		lastDelayRef.current = currentDelay;

		while (bombTimer.current >= currentDelay) {
			bombTimer.current -= currentDelay;

			if (score >= MAX_SCORE) {
				setIsGameOver(true);
				setIsInBombZone(false);
				setFeed((prev) => {
					return { ...prev, active: false };
				});
				return;
			}

			if (!feed.active) {
				const x = (Math.floor(Math.random() * 7) - 3) * CELL_SIZE + BOMB_ZONE_POSITION_X;
				const z = (Math.floor(Math.random() * 7) - 3) * CELL_SIZE;
				setFeed({ position: [x, 1, z], active: true });
			}

			const bombCount = Math.floor(5 + (score / MAX_SCORE) * 5);
			const availableIndexes = CELLS.map((_, i) => i).filter((i) => !activeBombsRef.current.has(i) && meshRefs.current[i]);

			const randomIndexes = availableIndexes.sort(() => 0.5 - Math.random()).slice(0, bombCount);

			randomIndexes.forEach((i) => animateBomb(i));
		}

		// 폭탄 색상 변화 및 충돌 체크
		const explodedThisFrame: number[] = [];
		for (const index in bombProgressRef.current) {
			const i = Number(index);
			const mesh = meshRefs.current[i];
			if (!mesh) continue;

			const progress = bombProgressRef.current[i] ?? 0;
			const nextProgress = progress + delta / 3;
			bombProgressRef.current[i] = nextProgress;

			const color = (mesh.material as MeshStandardMaterial).color;
			color.setRGB(1, Math.max(1 - nextProgress, 0), Math.max(1 - nextProgress, 0));

			if (nextProgress >= 1) {
				explodedThisFrame.push(i);

				if (!isGameOver && fishRef.current && checkCollision(fishRef.current, i)) {
					handleFishHit(i);
				} else {
					incrementScore();
				}

				color.set("white");
				delete bombProgressRef.current[i];
				activeBombsRef.current.delete(i);
			}
		}

		if (explodedThisFrame.length > 0) {
			cameraShakeRef.intensity = Math.min(explodedThisFrame.length * 0.02, 0.2);
			cameraShakeRef.time = 0;
			cameraShakeRef.basePosition.copy(camera.position);
		}
	});

	useFrame((_, delta) => {
		if (cameraShakeRef.intensity > 0) {
			cameraShakeRef.time += delta;

			const decay = Math.exp(-cameraShakeRef.time * 15);
			const shakeAmount = cameraShakeRef.intensity * decay;

			const t = cameraShakeRef.time * 60;
			const offsetX = Math.sin(t) * shakeAmount;
			const offsetY = Math.sin(t * 1.3) * shakeAmount * 0.6;

			camera.position.copy(cameraShakeRef.basePosition.clone().add(new Vector3(offsetX, offsetY, 0)));

			if (shakeAmount < 0.001) {
				cameraShakeRef.intensity = 0;
				cameraShakeRef.time = 0;
				camera.position.copy(cameraShakeRef.basePosition);
			}
		}
	});

	const memoizedMeshes = useMemo(() => {
		return CELLS.map((pos, i) => (
			<group key={i} position={pos}>
				<mesh
					ref={(el) => {
						if (el && meshRefs.current[i] !== el) {
							meshRefs.current[i] = el;
						}
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
	}, [meshRefs]);

	return (
		<>
			<group position={[BOMB_ZONE_POSITION_X, 0, 0]}>{memoizedMeshes}</group>

			{feed.active && (
				<GrowingFeed
					position={feed.position}
					fishRef={fishRef}
					isGameOver={isGameOver}
					active={feed.active}
					onCollected={() => {
						const scale = useFishStore.getState().fishScale;
						const bonus = Math.round(scale * 20);
						for (let i = 0; i < bonus; i++) incrementScore();
						setFeed((prev) => ({ ...prev, active: false }));
					}}
					onExpire={() => setFeed((prev) => ({ ...prev, active: false }))}
				/>
			)}
		</>
	);
};
