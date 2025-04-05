"use client";

// library
import { Suspense, useRef, useState, useEffect, useMemo, JSX, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture, Stats } from "@react-three/drei";
import { Vector2, Vector3, Raycaster, BoxGeometry, Mesh, Object3D, Color, FogExp2, MeshStandardMaterial, TextureLoader, RepeatWrapping } from "three";
import gsap from "gsap";

// store
import { useFishStore } from "@/store/useFishStore";

// types
type RefMesh = React.RefObject<Mesh>;
type RefAny = React.RefObject<Object3D>;
type Vec3 = [number, number, number];

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
	sphereRefs: React.RefObject<Mesh>[];
	setIsInBombZone: React.Dispatch<React.SetStateAction<boolean>>;
	setCountdown: React.Dispatch<React.SetStateAction<number | null>>;
}

const FishModel = ({ fishRef, sphereRefs, setIsInBombZone, setCountdown }: FishModelProps) => {
	const { scene } = useGLTF("/models/fish.glb");
	const { camera } = useThree();
	const { fishColor, fishScale } = useFishStore();

	const [isMobile, setIsMobile] = useState(false);
	const [showHitBox, setShowHitBox] = useState(false);
	const [isNearSphere, setIsNearSphere] = useState<boolean[]>([false, false, false, false]);
	const hitBoxRef = useRef<Mesh>(null);
	const sphereTimelines = useRef<gsap.core.Timeline[]>([]);
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
		sphereRefs.forEach((ref, i) => {
			if (ref.current) {
				const tl = gsap.timeline({ paused: true });
				tl.to(ref.current.scale, { x: 2, y: 2, z: 2, duration: 0.5 });
				sphereTimelines.current[i] = tl;
			}
		});
	}, [sphereRefs]);

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

		sphereRefs.forEach((sphereRef, index) => {
			const sphere = sphereRef.current;
			if (!sphere) return;

			const distance = fishPosition.distanceTo(sphere.position);
			const isNear = isNearSphere[index];
			const timeline = sphereTimelines.current[index];

			if (distance < 5 && !isNear) {
				timeline?.play();
				if (!isNearSphere[index]) {
					setIsNearSphere((prev) => {
						const next = [...prev];
						next[index] = true;
						return next;
					});
				}
			} else if (distance >= 5 && isNear) {
				timeline?.reverse();
				if (isNearSphere[index]) {
					setIsNearSphere((prev) => {
						const next = [...prev];
						next[index] = false;
						return next;
					});
				}
			}
		});

		const gridCenter = new Vector3(-50, 0, 0);
		const gridSizeX = 6 * 7;
		const gridSizeZ = 6 * 7;

		const inBombZone = Math.abs(fishPosition.x - gridCenter.x) < gridSizeX / 2 && Math.abs(fishPosition.z - gridCenter.z) < gridSizeZ / 2;

		// 입장
		if (inBombZone) {
			camera.position.set(gridCenter.x, isMobile ? 40 : 30, gridCenter.z);
			camera.lookAt(gridCenter);
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

interface PlaneProps {
	planeRef: RefMesh;
}

const Plane = ({ planeRef }: PlaneProps) => {
	const [colorMap, normalMap, roughnessMap] = useTexture([
		// 1k
		"/textures/sand/sand_02_diff_1k.jpg",
		"/textures/sand/sand_02_nor_gl_1k.jpg",
		"/textures/sand/sand_02_rough_1k.jpg",
		// 2k
		// "/textures/sand2/sand_02_diff_2k.jpg",
		// "/textures/sand2/sand_02_nor_gl_2k.jpg",
		// "/textures/sand2/sand_02_rough_2k.jpg",
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

interface SphereProps {
	sphereRef: RefMesh;
	position: Vec3;
}

const Sphere = ({ sphereRef, position }: SphereProps) => {
	const geometry = useMemo(() => <sphereGeometry args={[1, 32, 32]} />, []);
	const material = useMemo(() => <meshStandardMaterial color="skyblue" />, []);

	return (
		<mesh ref={sphereRef} position={position} castShadow>
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

	const boundToGrid = (value: number, center: number, size: number) => {
		const half = size / 2;
		return Math.max(center - half + 1, Math.min(center + half - 1, value));
	};

	useEffect(() => {
		const canvas = gl.domElement;

		const updateMousePosition = (e: MouseEvent) => {
			mouse.current.x = (e.clientX / canvas.clientWidth) * 2 - 1;
			mouse.current.y = -(e.clientY / canvas.clientHeight) * 2 + 1;
		};

		const onMouseDown = (e: MouseEvent) => {
			setIsClicked(true);
			updateMousePosition(e);
		};

		canvas.addEventListener("mousedown", onMouseDown);
		canvas.addEventListener("mousemove", updateMousePosition);
		window.addEventListener("mouseup", () => setIsClicked(false));

		return () => {
			canvas.removeEventListener("mousedown", onMouseDown);
			canvas.removeEventListener("mousemove", updateMousePosition);
			window.removeEventListener("mouseup", () => setIsClicked(false));
		};
	}, [gl]);

	useFrame(() => {
		if (isGameOver) return;

		if (isClicked && fishRef.current && planeRef.current) {
			raycaster.current.setFromCamera(mouse.current, camera);
			const intersects = raycaster.current.intersectObject(planeRef.current);

			if (intersects.length > 0) {
				const point = intersects[0].point;

				const gridCenter = new Vector3(-50, 0, 0);
				const gridSizeX = 6 * 7;
				const gridSizeZ = 6 * 7;

				let targetX = point.x;
				let targetZ = point.z;

				// grid 외부 클릭 보정
				if (isInBombZone) {
					targetX = boundToGrid(point.x, gridCenter.x, gridSizeX);
					targetZ = boundToGrid(point.z, gridCenter.z, gridSizeZ);
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

const Experience = () => {
	const sphereRefs: RefMesh[] = [useRef(null), useRef(null), useRef(null), useRef(null)];
	const fishRef = useRef<Object3D>(null);
	const planeRef = useRef<Mesh>(null);
	const darkMode = useFishStore((state) => state.darkMode);

	const [isInBombZone, setIsInBombZone] = useState(false);
	const [isGameOver, setIsGameOver] = useState(false);
	const [countdown, setCountdown] = useState<number | null>(null);
	const [bombActive, setBombActive] = useState(false);
	const [score, setScore] = useState(0);

	const spherePositions: Vec3[] = [
		[70, 1, 0],
		[50, 1, 0],
		[60, 1, 10],
		[60, 1, -10],
	];

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
					<FishModel fishRef={fishRef} sphereRefs={sphereRefs} setIsInBombZone={setIsInBombZone} setCountdown={setCountdown} />{" "}
					<Plane planeRef={planeRef} />
					<BombZone
						fishRef={fishRef}
						setIsGameOver={setIsGameOver}
						setIsInBombZone={setIsInBombZone}
						isInBombZone={isInBombZone}
						bombActive={bombActive}
						setScore={setScore}
					/>
					{sphereRefs.map((ref, i) => (
						<Sphere key={i} sphereRef={ref} position={spherePositions[i]} />
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
