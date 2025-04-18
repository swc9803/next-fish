"use client";

// library
import { Suspense, useRef, useState, useEffect, useMemo, JSX, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture, useVideoTexture, Stats } from "@react-three/drei";
import { Vector2, Vector3, Raycaster, BoxGeometry, Mesh, Object3D, Color, FogExp2, MeshStandardMaterial, RepeatWrapping } from "three";
import gsap from "gsap";

// store
import { useFishStore } from "@/store/useFishStore";

// utils
import { isWebPSupported } from "@/utils/isWebPSupported";

// types
type RefMesh = React.RefObject<Mesh>;
type RefAny = React.RefObject<Object3D>;
type Vec3 = [number, number, number];

// preload
if (typeof window !== "undefined") {
	const ext = isWebPSupported() ? "webp" : "jpg";
	useTexture.preload([`/textures/sand/sand_02_diff_1k.${ext}`, `/textures/sand/sand_02_nor_gl_1k.${ext}`, `/textures/sand/sand_02_rough_1k.${ext}`]);
}
useGLTF.preload("/models/fish.glb");

const GRID_CENTER = new Vector3(-50, 0, 0);
const GRID_SIZE_X = 42;
const GRID_SIZE_Z = 42;

const FishConfig = () => {
	const { fishColor, fishSpeed, fishScale, darkMode, setFishColor, setFishSpeed, setFishScale, toggleDarkMode } = useFishStore();

	return (
		<div className={`fish_config ${darkMode ? "dark" : ""}`}>
			<div>
				<label>Fish Color: </label>
				<input type="color" value={fishColor} onChange={(e) => setFishColor(e.target.value)} />
			</div>
			<div>
				<label>Fish Speed: </label>
				<input type="number" value={fishSpeed} onChange={(e) => setFishSpeed(Number(e.target.value))} min={10} max={200} />
			</div>
			<div>
				<label>Fish Scale: </label>
				<input type="number" value={fishScale} onChange={(e) => setFishScale(Number(e.target.value))} min={0.1} max={10} step={0.1} />
			</div>
			<button onClick={toggleDarkMode} type="button">
				{darkMode ? "Set LightMode" : "Set DarkMode"}
			</button>
		</div>
	);
};

interface FishModelProps {
	fishRef: React.RefObject<Object3D>;
	setIsInBombZone: React.Dispatch<React.SetStateAction<boolean>>;
	setCountdown: React.Dispatch<React.SetStateAction<number | null>>;
}
const FishModel = ({ fishRef, setIsInBombZone, setCountdown }: FishModelProps) => {
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
	}, []);

	useEffect(() => {
		meshMaterials.current.forEach((mat) => mat.color.set(fishColor));
	}, [fishColor]);

	useEffect(() => {
		const toggleDebug = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() === "d") {
				setShowHitBox((prev) => !prev);
			}
		};
		window.addEventListener("keydown", toggleDebug);
		return () => window.removeEventListener("keydown", toggleDebug);
	}, []);

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
			camera.position.set(fishPosition.x, 17, fishPosition.z + 14);
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

const VideoCaustics = () => {
	const videoTexture = useVideoTexture("/videos/caustics.mp4");
	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} renderOrder={10}>
			<planeGeometry args={[350, 70]} />
			<meshBasicMaterial map={videoTexture} transparent opacity={0.3} depthWrite={false} depthTest={false} />
		</mesh>
	);
};

interface PlaneProps {
	planeRef: RefMesh;
}
const Plane = ({ planeRef }: PlaneProps) => {
	const ext = useMemo(() => (isWebPSupported() ? "webp" : "jpg"), []);
	const [colorMap, normalMap, roughnessMap] = useTexture([
		`/textures/sand/sand_02_diff_1k.${ext}`,
		`/textures/sand/sand_02_nor_gl_1k.${ext}`,
		`/textures/sand/sand_02_rough_1k.${ext}`,
	]);

	useMemo(() => {
		[colorMap, normalMap, roughnessMap].forEach((tex) => {
			tex.wrapS = tex.wrapT = RepeatWrapping;
			tex.repeat.set(20, 4); // planeGeometry args 비율에 맞춰 수정
		});
	}, [colorMap, normalMap, roughnessMap]);

	const geometry = useMemo(() => <planeGeometry args={[350, 70]} />, []);
	const material = useMemo(
		() => <meshStandardMaterial map={colorMap} normalMap={normalMap} roughnessMap={roughnessMap} roughness={1} metalness={0} />,
		[colorMap, normalMap, roughnessMap]
	);

	return (
		<mesh ref={planeRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
			{geometry}
			{material}
		</mesh>
	);
};

interface ClickHandlerProps {
	fishRef: RefAny;
	planeRef: RefMesh;
	isInBombZone: boolean;
	isGameOver: boolean;
}
const ClickHandler = ({ fishRef, planeRef, isInBombZone, isGameOver }: ClickHandlerProps): JSX.Element => {
	const { camera, gl } = useThree();
	const raycaster = useRef(new Raycaster());
	const mouse = useRef(new Vector2());
	const [isClicked, setIsClicked] = useState(false);
	const fishSpeed = useFishStore((state) => state.fishSpeed);
	const fishScaleRef = useRef(useFishStore.getState().fishScale);

	// plane, grid 클릭 제한
	const clampToBounds = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
	const getClampedPlaneCoords = (x: number, z: number) => {
		const halfPlaneX = 350 / 2;
		const halfPlaneZ = 70 / 2;
		const margin = fishScaleRef.current * 2.5;

		return {
			x: clampToBounds(x, -halfPlaneX + margin, halfPlaneX - margin),
			z: clampToBounds(z, -halfPlaneZ + margin, halfPlaneZ - margin),
		};
	};

	useEffect(() => {
		const canvas = gl.domElement;

		const updateMouse = (e: MouseEvent) => {
			mouse.current.x = (e.clientX / canvas.clientWidth) * 2 - 1;
			mouse.current.y = -(e.clientY / canvas.clientHeight) * 2 + 1;
		};

		const onPointerDown = (e: MouseEvent) => {
			setIsClicked(true);
			updateMouse(e);
		};

		canvas.addEventListener("pointerdown", onPointerDown);
		canvas.addEventListener("pointermove", updateMouse);
		window.addEventListener("pointerup", () => setIsClicked(false));

		return () => {
			canvas.removeEventListener("pointerdown", onPointerDown);
			canvas.removeEventListener("pointermove", updateMouse);
			window.removeEventListener("pointerup", () => setIsClicked(false));
		};
	}, [gl]);

	useFrame(() => {
		if (isGameOver || !isClicked || !fishRef.current || !planeRef.current) return;

		raycaster.current.setFromCamera(mouse.current, camera);
		const intersects = raycaster.current.intersectObject(planeRef.current);

		if (intersects.length > 0) {
			const point = intersects[0].point;
			let targetX = point.x;
			let targetZ = point.z;

			if (isInBombZone) {
				targetX = clampToBounds(point.x, GRID_CENTER.x - GRID_SIZE_X / 2 + 1, GRID_CENTER.x + GRID_SIZE_X / 2 - 1);
				targetZ = clampToBounds(point.z, GRID_CENTER.z - GRID_SIZE_Z / 2 + 1, GRID_CENTER.z + GRID_SIZE_Z / 2 - 1);
			} else {
				const clamped = getClampedPlaneCoords(point.x, point.z);
				targetX = clamped.x;
				targetZ = clamped.z;
			}

			const distance = fishRef.current.position.distanceTo(new Vector3(targetX, point.y, targetZ));
			const duration = distance / fishSpeed;

			const target = new Vector3(targetX, fishRef.current.position.y, targetZ);
			fishRef.current.lookAt(target);

			gsap.killTweensOf(fishRef.current.position);
			gsap.to(fishRef.current.position, {
				x: targetX,
				z: targetZ,
				duration,
			});
		}
	});

	return <></>;
};

interface BombZoneProps {
	fishRef: RefAny;
	setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>;
	setIsInBombZone: React.Dispatch<React.SetStateAction<boolean>>;
	isInBombZone: boolean;
	bombActive: boolean;
	setScore: React.Dispatch<React.SetStateAction<number>>;
}
const BombZone = ({ fishRef, setIsGameOver, setIsInBombZone, isInBombZone, bombActive, setScore }: BombZoneProps) => {
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
			const radius = cellSize * 1.5;

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
	}, [cells, fishRef, fishScale, isInBombZone]);

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

type GrowingSphereProps = {
	position: Vec3;
	onCollected: () => void;
	fishRef: RefAny;
};
type BonusSphere = { id: string; position: Vec3 };
const GrowingSphere = ({ position, onCollected, fishRef }: GrowingSphereProps) => {
	const ref = useRef<Mesh>(null);
	const [collected, setCollected] = useState(false);
	const { fishScale, setFishScale } = useFishStore();

	useEffect(() => {
		if (!ref.current || collected) return;
		const timeout = setTimeout(() => {
			gsap.to(ref.current!.scale, {
				x: 0,
				y: 0,
				z: 0,
				duration: 0.5,
				onComplete: onCollected,
			});
		}, 5000);
		return () => clearTimeout(timeout);
	}, [collected, ref.current]);

	useFrame(() => {
		if (collected || !ref.current || !fishRef.current) return;

		const dist = ref.current.position.distanceTo(fishRef.current.position);
		if (dist < 3) {
			setCollected(true);
			gsap.to(ref.current.scale, {
				x: 2,
				y: 2,
				z: 2,
				duration: 0.3,
				onComplete: () => {
					gsap.to(ref.current!.scale, {
						x: 0,
						y: 0,
						z: 0,
						duration: 0.5,
						onComplete: () => {
							onCollected();
							setFishScale((prev) => Math.min(prev + 0.2, 5));
						},
					});
				},
			});
		}
	});

	return (
		<mesh ref={ref} position={position}>
			<sphereGeometry args={[1, 32, 32]} />
			<meshStandardMaterial color="limegreen" />
		</mesh>
	);
};

const Experience = () => {
	const fishRef = useRef<Object3D>(null);
	const planeRef = useRef<Mesh>(null);
	const darkMode = useFishStore((state) => state.darkMode);

	const [isInBombZone, setIsInBombZone] = useState(false);
	const [isGameOver, setIsGameOver] = useState(false);
	const [countdown, setCountdown] = useState<number | null>(null);
	const [bombActive, setBombActive] = useState(false);
	const [score, setScore] = useState(0);
	const [bonusSpheres, setBonusSpheres] = useState<BonusSphere[]>([]);

	// 다크모드 시 배경 트렌지션
	const BackgroundTransition = ({ darkMode }: { darkMode: boolean }) => {
		const { scene } = useThree();

		useEffect(() => {
			if (!scene.background || !(scene.background instanceof Color)) {
				scene.background = new Color(darkMode ? "#0b0b0b" : "#0c6ceb");
			}
			if (!scene.fog) {
				scene.fog = new FogExp2(new Color(darkMode ? "#111111" : "#00bfff"), 0.02);
			}
		}, []);
		useEffect(() => {
			const targetBg = new Color(darkMode ? "#0b0b0b" : "#0c6ceb");
			const targetFog = new Color(darkMode ? "#111111" : "#00bfff");

			gsap.to(scene.background as Color, {
				r: targetBg.r,
				g: targetBg.g,
				b: targetBg.b,
				duration: 0.7,
				ease: "power2.inOut",
			});

			gsap.to(scene.fog!.color, {
				r: targetFog.r,
				g: targetFog.g,
				b: targetFog.b,
				duration: 0.7,
				ease: "power2.inOut",
			});
		}, [darkMode]);

		return null;
	};

	// sphere 생성
	useEffect(() => {
		const interval = setInterval(() => {
			const cellSize = 6;
			const gridHalf = 3;
			const x = (Math.floor(Math.random() * (gridHalf * 2 + 1)) - gridHalf) * cellSize - 50;
			const z = (Math.floor(Math.random() * (gridHalf * 2 + 1)) - gridHalf) * cellSize;
			const newSphere: BonusSphere = {
				id: crypto.randomUUID(),
				position: [x, 1, z],
			};

			setBonusSpheres((prev) => (prev.length === 0 ? [newSphere] : prev));
		}, 3000);

		return () => clearInterval(interval);
	}, []);

	// 폭탄 카운트다운
	useEffect(() => {
		if (countdown === null) return;
		const interval = setInterval(() => {
			setCountdown((prev) => {
				if (prev === 1) {
					clearInterval(interval);
					setCountdown(null);
					setBombActive(true);
					return null;
				}
				return (prev ?? 0) - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [countdown]);

	// 게임 오버 시
	const resetGame = useCallback(() => {
		if (fishRef.current) {
			fishRef.current.position.set(0, 1, 0);
		}
		setIsGameOver(false);
		setIsInBombZone(false);
		setBombActive(false);
		setScore(0);
		setCountdown(null);
	}, []);

	return (
		<>
			<Canvas shadows camera={{ position: [0, 17, 14], fov: 75 }}>
				<Stats />
				<BackgroundTransition darkMode={darkMode} />

				<ambientLight color={0xffffff} intensity={0.8} />
				<directionalLight
					color={0xf8f8ff}
					intensity={4}
					position={[2, 1, 3]}
					castShadow
					shadow-mapSize-width={2048}
					shadow-mapSize-height={2048}
					shadow-camera-left={-200}
					shadow-camera-right={200}
					shadow-camera-top={200}
					shadow-camera-bottom={-200}
					shadow-camera-near={1}
					shadow-camera-far={500}
				/>

				<Suspense fallback={null}>
					<VideoCaustics />
					<FishModel fishRef={fishRef} setIsInBombZone={setIsInBombZone} setCountdown={setCountdown} />
					<Plane planeRef={planeRef} />
					<BombZone
						fishRef={fishRef}
						setIsGameOver={setIsGameOver}
						setIsInBombZone={setIsInBombZone}
						isInBombZone={isInBombZone}
						bombActive={bombActive}
						setScore={setScore}
					/>
					{bonusSpheres.map(({ id, position }) => (
						<GrowingSphere
							key={id}
							position={position}
							fishRef={fishRef}
							onCollected={() => setBonusSpheres((prev) => prev.filter((sphere) => sphere.id !== id))}
						/>
					))}
					<ClickHandler fishRef={fishRef} planeRef={planeRef} isInBombZone={isInBombZone} isGameOver={isGameOver} />
				</Suspense>
			</Canvas>

			<FishConfig />

			<div className="hud">
				{countdown !== null && <div className="countdown">폭탄 시작까지: {countdown}</div>}
				{bombActive && <div className="score">피한 폭탄 수: {score}</div>}
			</div>

			{isGameOver && (
				<div onClick={resetGame} className="gameover_overlay">
					<h1>YOU'RE COOKED</h1>
					<p>화면을 클릭해 다시 시작하세요</p>
				</div>
			)}
		</>
	);
};

export default Experience;
