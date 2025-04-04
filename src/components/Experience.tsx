"use client";

// library
import { Suspense, useRef, useState, useEffect, useMemo, JSX } from "react";
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
	setIsInGrid: React.Dispatch<React.SetStateAction<boolean>>;
}

const FishModel = ({ fishRef, sphereRefs, setIsInGrid }: FishModelProps) => {
	const { scene } = useGLTF("/models/fish.glb");
	const { camera } = useThree();
	const { fishColor, fishScale } = useFishStore();

	const [showHitBox, setShowHitBox] = useState(false);
	const [isNearSphere, setIsNearSphere] = useState<boolean[]>([false, false, false, false]);
	const hitBoxRef = useRef<Mesh>(null);
	const sphereTimelines = useRef<gsap.core.Timeline[]>([]);

	// D 키 눌러 히트박스 표시 토글
	useEffect(() => {
		const toggleDebug = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() === "d") {
				setShowHitBox((prev) => !prev);
			}
		};
		window.addEventListener("keydown", toggleDebug);
		return () => window.removeEventListener("keydown", toggleDebug);
	}, []);

	useEffect(() => {
		scene.traverse((child) => {
			if (!(child instanceof Mesh)) return;
			child.castShadow = true;

			if (child.name === "Mesh") {
				const material = child.material;

				if (Array.isArray(material)) {
					material.forEach((mat) => {
						if (mat instanceof MeshStandardMaterial && mat.color) {
							mat.color.set(fishColor);
						}
					});
				} else if (material instanceof MeshStandardMaterial && material.color) {
					material.color.set(fishColor);
				}
			}
		});
	}, [fishColor, scene]);

	useEffect(() => {
		sphereRefs.forEach((ref, i) => {
			if (ref.current) {
				const tl = gsap.timeline({ paused: true });
				tl.to(ref.current.scale, { x: 2, y: 2, z: 2, duration: 0.5 });
				sphereTimelines.current[i] = tl;
			}
		});
	}, [sphereRefs]);

	useFrame(() => {
		if (!fishRef.current) return;

		fishRef.current.scale.set(fishScale, fishScale, fishScale);
		const fishPosition = fishRef.current.position as Vector3;

		if (hitBoxRef.current) {
			hitBoxRef.current.position.copy(fishPosition);
			hitBoxRef.current.scale.set(fishScale * 2, fishScale * 2, fishScale * 2);
		}

		sphereRefs.forEach((sphereRef, index) => {
			const sphere = sphereRef.current;
			if (!sphere) return;

			const distance = fishPosition.distanceTo(sphere.position);
			const isNear = isNearSphere[index];
			const timeline = sphereTimelines.current[index];

			if (distance < 5 && !isNear) {
				timeline?.play();
				setIsNearSphere((prev) => {
					const next = [...prev];
					next[index] = true;
					return next;
				});
			} else if (distance >= 5 && isNear) {
				timeline?.reverse();
				setIsNearSphere((prev) => {
					const next = [...prev];
					next[index] = false;
					return next;
				});
			}
		});

		const gridCenter = new Vector3(-50, 0, 0);
		const gridSizeX = 6 * 7;
		const gridSizeZ = 6 * 7;

		const inGrid = Math.abs(fishPosition.x - gridCenter.x) < gridSizeX / 2 && Math.abs(fishPosition.z - gridCenter.z) < gridSizeZ / 2;

		setIsInGrid(inGrid);

		if (inGrid) {
			camera.position.set(gridCenter.x, 60, gridCenter.z);
			camera.lookAt(gridCenter);
		} else {
			camera.position.set(fishPosition.x, 17, fishPosition.z + 14);
			camera.lookAt(fishPosition);
		}
	});

	return (
		<>
			<primitive ref={fishRef} object={scene} position={[0, 1, 0]} castShadow />

			{showHitBox && (
				<mesh ref={hitBoxRef}>
					<boxGeometry args={[1, 1, 1]} />
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
	isInGrid: boolean;
}

const ClickHandler = ({ fishRef, planeRef, isInGrid }: ClickHandlerProps): JSX.Element => {
	const { camera, gl } = useThree();
	const raycaster = useRef(new Raycaster());
	const mouse = useRef(new Vector2());
	const [isClicked, setIsClicked] = useState(false);
	const fishSpeed = useFishStore((state) => state.fishSpeed);

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
		if (isClicked && fishRef.current && planeRef.current) {
			raycaster.current.setFromCamera(mouse.current, camera);
			const intersects = raycaster.current.intersectObject(planeRef.current);

			if (intersects.length > 0) {
				const point = intersects[0].point;

				const gridCenter = new Vector3(-50, 0, 0);
				const gridSizeX = 6 * 7;
				const gridSizeZ = 6 * 7;

				const isPointInGrid = Math.abs(point.x - gridCenter.x) < gridSizeX / 2 && Math.abs(point.z - gridCenter.z) < gridSizeZ / 2;

				if (isInGrid && !isPointInGrid) return;

				const distance = fishRef.current.position.distanceTo(point);
				const duration = distance / fishSpeed;

				const target = new Vector3(point.x, fishRef.current.position.y, point.z);
				fishRef.current.lookAt(target);

				gsap.killTweensOf(fishRef.current.position);
				gsap.to(fishRef.current.position, {
					x: point.x,
					z: point.z,
					duration,
				});
			}
		}
	});
	return <></>;
};

interface GridProps {
	fishRef: RefAny;
	setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>;
	setIsInGrid: React.Dispatch<React.SetStateAction<boolean>>;
}

const Grid = ({ fishRef, setIsGameOver, setIsInGrid }: GridProps) => {
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
		const groupOffset = new Vector3(-50, 0, 0);

		const isHitDetected = (fish: Object3D, cellIndex: number, radius: number) => {
			const fishPos = fish.position.clone();
			const cellLocal = new Vector3(...cells[cellIndex]);
			const cellWorld = cellLocal.add(groupOffset);
			const distance = fishPos.distanceTo(cellWorld);
			return distance < radius;
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
					if (fish && isHitDetected(fish, index, radius)) {
						console.log("HIT");
						setIsGameOver(true);
						setIsInGrid(false);
					}
					color.set("white"); // temp
				},
			});
		}, 2500);

		return () => clearInterval(interval);
	}, [cells, fishRef, fishScale]);

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

	const [isInGrid, setIsInGrid] = useState(false);
	const [isGameOver, setIsGameOver] = useState(false);

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
					<FishModel fishRef={fishRef} sphereRefs={sphereRefs} setIsInGrid={setIsInGrid} />
					<Plane planeRef={planeRef} />
					<Grid fishRef={fishRef} setIsGameOver={setIsGameOver} setIsInGrid={setIsInGrid} />
					{sphereRefs.map((ref, i) => (
						<Sphere key={i} sphereRef={ref} position={spherePositions[i]} />
					))}
					<ClickHandler fishRef={fishRef} planeRef={planeRef} isInGrid={isInGrid} />
				</Suspense>
			</Canvas>

			<FishConfig />

			{isGameOver && (
				<div
					onClick={() => {
						if (fishRef.current) {
							fishRef.current.position.set(0, 1, 0);
						}
						setIsGameOver(false);
						setIsInGrid(false);
					}}
					className="gameover_overlay"
				>
					<h1>YOU'RE COOKED</h1>
					<p>화면을 클릭해 다시 시작하세요</p>
				</div>
			)}
		</>
	);
};

export default Experience;
