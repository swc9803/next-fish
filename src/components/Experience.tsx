"use client";

// library
import { Suspense, useRef, useState, useEffect, useMemo, JSX } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture, Stats } from "@react-three/drei";
import { Vector2, Vector3, Raycaster, BoxGeometry, Mesh, Object3D, Color, FogExp2, MeshStandardMaterial, TextureLoader, RepeatWrapping } from "three";
import gsap from "gsap";

// store
import { useFishStore } from "@/store/useFishStore";

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
}

const FishModel = ({ fishRef, sphereRefs }: FishModelProps) => {
	const { scene } = useGLTF("/models/fish.glb");
	const { camera } = useThree();
	const [isNearSphere, setIsNearSphere] = useState<boolean[]>([false, false, false, false]);
	const [showHitBox, setShowHitBox] = useState(false);
	const hitBoxRef = useRef<Mesh>(null);

	const { fishColor, fishScale } = useFishStore();

	const sphereTimelines = useRef<gsap.core.Timeline[]>([]);

	// 테스트용 d 입력 시 hit box 노출
	useEffect(() => {
		const toggleHitBox = (e: KeyboardEvent) => {
			if (e.key === "d") setShowHitBox((prev) => !prev);
		};

		window.addEventListener("keydown", toggleHitBox);
		return () => window.removeEventListener("keydown", toggleHitBox);
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

	// 매 프레임마다 애니메이션, 카메라 위치 업데이트
	useFrame(() => {
		if (!fishRef.current) return;

		fishRef.current.scale.set(fishScale, fishScale, fishScale);

		// 히트박스 위치 동기화
		if (hitBoxRef.current) {
			hitBoxRef.current.position.copy(fishRef.current.position);
			hitBoxRef.current.scale.set(fishScale * 2, fishScale * 2, fishScale * 2);
		}

		const fishPosition = fishRef.current.position as Vector3;

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

		// 카메라 따라가기
		camera.position.set(fishPosition.x, 17, fishPosition.z + 14);
		camera.lookAt(fishPosition);
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
}

const ClickHandler = ({ fishRef, planeRef }: ClickHandlerProps): JSX.Element => {
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
}

const Grid = ({ fishRef }: GridProps) => {
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
		const interval = setInterval(() => {
			const index = Math.floor(Math.random() * cells.length);
			const mesh = meshRefs.current[index];
			if (!mesh) return;

			const material = mesh.material as MeshStandardMaterial;
			const color = material.color;

			gsap.to(color, {
				r: 1,
				g: 0,
				b: 0,
				duration: 3,
				ease: "power1.inOut",
				onComplete: () => {
					const fish = fishRef.current;
					if (fish) {
						const fishPos = fish.position as Vector3;
						const cellPos = new Vector3(...cells[index]);
						const radius = cellSize / 2 + (fishScale * cellSize) / 4;

						const isHit = Math.abs(fishPos.x - cellPos.x) < radius && Math.abs(fishPos.z - cellPos.z) < radius;

						if (isHit) console.log("hit");
					}
					color.set("white");
				},
			});
		}, 2500);

		return () => clearInterval(interval);
	}, [cells, fishRef, fishScale]);

	return (
		<>
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
		</>
	);
};

const Experience = () => {
	const sphereRefs: RefMesh[] = [useRef(null), useRef(null), useRef(null), useRef(null)];
	const fishRef = useRef<Object3D>(null);
	const planeRef = useRef<Mesh>(null);
	const darkMode = useFishStore((state) => state.darkMode);

	const spherePositions: Vec3[] = [
		[30, 1, 0],
		[-30, 1, 0],
		[0, 1, 30],
		[0, 1, -30],
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
				<directionalLight color={0xf8f8ff} intensity={4} position={[2, 1, 3]} castShadow />

				<Suspense fallback={null}>
					<FishModel fishRef={fishRef} sphereRefs={sphereRefs} />
					<Plane planeRef={planeRef} />
					<Grid fishRef={fishRef} />
					{sphereRefs.map((ref, i) => (
						<Sphere key={i} sphereRef={ref} position={spherePositions[i]} />
					))}
					<ClickHandler fishRef={fishRef} planeRef={planeRef} />
				</Suspense>
			</Canvas>

			<FishConfig />
		</>
	);
};

export default Experience;
